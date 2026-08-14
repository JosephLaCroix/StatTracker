import {
    useEffect,
    useMemo,
    useState
} from "react";

import { Link } from "react-router";

import "../styles/stats.css";


const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";


// =========================================
// HELPERS
// =========================================

function clamp(value, min, max) {
    return Math.min(
        Math.max(value, min),
        max
    );
}


function percentage(
    numerator,
    denominator,
    decimals = 1
) {

    if (!denominator) {
        return "0.0";
    }

    return (
        (numerator / denominator) *
        100
    ).toFixed(decimals);
}


function getPlayerName(record) {

    return (
        record?.playerNameAtTime ||
        record?.playerName ||
        record?.name ||
        null
    );

}


function getPlayerImageFromRecord(record) {

    return (
        record?.profileImageAtTime ||
        record?.profileImage ||
        "mario.png"
    );

}


function getGrandPrixDate(gp) {

    return new Date(
        gp.datePlayed ||
        gp.createdAt ||
        0
    ).getTime();

}


function sortHistoryChronologically(history) {

    return [...history].sort(
        (a, b) =>
            getGrandPrixDate(a) -
            getGrandPrixDate(b)
    );

}


function sortHistoryNewestFirst(history) {

    return [...history].sort(
        (a, b) =>
            getGrandPrixDate(b) -
            getGrandPrixDate(a)
    );

}


function getMedal(index) {

    if (index === 0) {
        return "🥇";
    }

    if (index === 1) {
        return "🥈";
    }

    if (index === 2) {
        return "🥉";
    }

    return `${index + 1}.`;

}


function getPlacementDisplay(placement) {

    if (placement === 1) {
        return "🥇";
    }

    if (placement === 2) {
        return "🥈";
    }

    if (placement === 3) {
        return "🥉";
    }

    return `${placement}th`;

}


function getTrendIcon(value) {

    if (value > 0.15) {
        return "▲";
    }

    if (value < -0.15) {
        return "▼";
    }

    return "—";

}


function getTrendClass(value) {

    if (value > 0.15) {
        return "trend-up";
    }

    if (value < -0.15) {
        return "trend-down";
    }

    return "trend-even";

}


// =========================================
// STREAKS
// =========================================

function calculatePlayerStreaks(player) {

    let currentWinStreak = 0;
    let longestWinStreak = 0;

    let currentWinlessStreak = 0;
    let longestWinlessStreak = 0;


    player.gpResults.forEach(result => {

        if (result.placement === 1) {

            currentWinStreak++;

            longestWinStreak =
                Math.max(
                    longestWinStreak,
                    currentWinStreak
                );

            currentWinlessStreak = 0;

        } else {

            currentWinlessStreak++;

            longestWinlessStreak =
                Math.max(
                    longestWinlessStreak,
                    currentWinlessStreak
                );

            currentWinStreak = 0;

        }

    });


    player.currentWinStreak =
        currentWinStreak;

    player.longestWinStreak =
        longestWinStreak;

    player.longestWinlessStreak =
        longestWinlessStreak;

}


// =========================================
// RECENT FORM
// =========================================

function calculatePlayerRecentForm(player) {

    const lastFive =
        player.gpResults.slice(-5);


    if (!lastFive.length) {

        player.recentAverageFinish = null;

        player.recentFormScore = 0;

        player.trend = 0;

        return;

    }


    const recentAverageFinish =
        lastFive.reduce(
            (sum, result) =>
                sum + result.placement,
            0
        ) /
        lastFive.length;


    player.recentAverageFinish =
        recentAverageFinish;


    player.recentFormScore =
        clamp(
            (
                4.5 -
                recentAverageFinish
            ) /
            3.5,
            0,
            1
        );


    if (
        player.averageGPFinish !==
        null
    ) {

        player.trend =
            player.averageGPFinish -
            recentAverageFinish;

    }

}


// =========================================
// POWER RATING
// =========================================

function calculatePowerRating(player) {

    if (!player.grandPrixPlayed) {
        return 0;
    }


    const gpWinComponent =
        player.gpWinRate;

    const podiumComponent =
        player.podiumRate;

    const raceWinComponent =
        player.raceWinRate;


    const finishComponent =
        player.averageFinish
            ? clamp(
                (
                    4.5 -
                    player.averageFinish
                ) /
                3.5,
                0,
                1
            )
            : 0;


    const recentComponent =
        player.recentFormScore;


    const rawRating =
        (
            gpWinComponent *
            0.30
        )
        +
        (
            podiumComponent *
            0.20
        )
        +
        (
            raceWinComponent *
            0.20
        )
        +
        (
            finishComponent *
            0.15
        )
        +
        (
            recentComponent *
            0.15
        );


    const sampleStrength =
        player.grandPrixPlayed /
        (
            player.grandPrixPlayed +
            4
        );


    const adjustedRating =
        (
            rawRating *
            sampleStrength
        )
        +
        (
            0.50 *
            (
                1 -
                sampleStrength
            )
        );


    return Number(
        (
            adjustedRating *
            100
        ).toFixed(1)
    );

}


// =========================================
// HEAD TO HEAD
// =========================================

function calculateHeadToHead(
    history,
    playerOneName,
    playerTwoName
) {

    let gpMeetings = 0;

    let playerOneGPWins = 0;
    let playerTwoGPWins = 0;
    let gpTies = 0;


    let raceMeetings = 0;

    let playerOneRaceWins = 0;
    let playerTwoRaceWins = 0;
    let raceTies = 0;


    let playerOnePlacementTotal = 0;
    let playerTwoPlacementTotal = 0;


    history.forEach(gp => {

        const standings =
            gp.finalStandings || [];


        const playerOneIndex =
            standings.findIndex(
                record =>
                    getPlayerName(record) ===
                    playerOneName
            );


        const playerTwoIndex =
            standings.findIndex(
                record =>
                    getPlayerName(record) ===
                    playerTwoName
            );


        if (
            playerOneIndex !== -1 &&
            playerTwoIndex !== -1
        ) {

            gpMeetings++;


            if (
                playerOneIndex <
                playerTwoIndex
            ) {

                playerOneGPWins++;

            } else if (
                playerTwoIndex <
                playerOneIndex
            ) {

                playerTwoGPWins++;

            } else {

                gpTies++;

            }

        }


        (gp.races || []).forEach(race => {

            const results =
                race.results || [];


            const playerOneResult =
                results.find(
                    record =>
                        getPlayerName(record) ===
                        playerOneName
                );


            const playerTwoResult =
                results.find(
                    record =>
                        getPlayerName(record) ===
                        playerTwoName
                );


            if (
                !playerOneResult ||
                !playerTwoResult
            ) {

                return;

            }


            const placementOne =
                Number(
                    playerOneResult.placement
                );


            const placementTwo =
                Number(
                    playerTwoResult.placement
                );


            raceMeetings++;

            playerOnePlacementTotal +=
                placementOne;

            playerTwoPlacementTotal +=
                placementTwo;


            if (
                placementOne <
                placementTwo
            ) {

                playerOneRaceWins++;

            } else if (
                placementTwo <
                placementOne
            ) {

                playerTwoRaceWins++;

            } else {

                raceTies++;

            }

        });

    });


    return {

        gpMeetings,

        playerOneGPWins,

        playerTwoGPWins,

        gpTies,

        raceMeetings,

        playerOneRaceWins,

        playerTwoRaceWins,

        raceTies,

        playerOneAverageFinish:
            raceMeetings
                ? playerOnePlacementTotal /
                    raceMeetings
                : null,

        playerTwoAverageFinish:
            raceMeetings
                ? playerTwoPlacementTotal /
                    raceMeetings
                : null

    };

}


// =========================================
// MAIN COMPONENT
// =========================================

function Stats() {

    const [
        grandPrixHistory,
        setGrandPrixHistory
    ] = useState([]);


    const [
        currentPlayers,
        setCurrentPlayers
    ] = useState([]);


    const [
        activeTab,
        setActiveTab
    ] = useState("general");


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        loadError,
        setLoadError
    ] = useState(false);


    const [
        selectedModalPlayer,
        setSelectedModalPlayer
    ] = useState(null);


    const [
        h2hPlayerOne,
        setH2hPlayerOne
    ] = useState("");


    const [
        h2hPlayerTwo,
        setH2hPlayerTwo
    ] = useState("");


    // =========================================
    // LOAD DATA
    // =========================================

    useEffect(() => {

        async function loadStatsData() {

            try {

                const [
                    historyResponse,
                    playersResponse
                ] = await Promise.all([

                    fetch(
                        `${API_BASE_URL}/api/grand-prix`
                    ),

                    fetch(
                        `${API_BASE_URL}/api/players`
                    )

                ]);


                if (
                    !historyResponse.ok
                ) {

                    throw new Error(
                        "Failed to load Grand Prix history"
                    );

                }


                const historyData =
                    await historyResponse.json();


                let playersData = [];


                if (
                    playersResponse.ok
                ) {

                    playersData =
                        await playersResponse.json();

                }


                setGrandPrixHistory(
                    historyData
                );

                setCurrentPlayers(
                    playersData
                );

                setLoadError(false);


            } catch (error) {

                console.error(
                    "Error loading stats:",
                    error
                );

                setLoadError(true);


            } finally {

                setLoading(false);

            }

        }


        loadStatsData();

    }, []);


    // =========================================
    // CURRENT IMAGE HELPER
    // =========================================

    function getCurrentProfileImage(
        name,
        historicalImage = "mario.png"
    ) {

        const currentPlayer =
            currentPlayers.find(
                player =>
                    player.name === name
            );


        return (
            currentPlayer?.profileImage ||
            historicalImage ||
            "mario.png"
        );

    }


    // =========================================
    // PLAYER STATS
    // =========================================

    const playerStats =
        useMemo(
            () => {

                const stats = {};


                const chronologicalHistory =
                    sortHistoryChronologically(
                        grandPrixHistory
                    );


                function createPlayerIfNeeded(
                    name,
                    profileImage
                ) {

                    if (!name) {
                        return;
                    }


                    if (!stats[name]) {

                        const currentPlayer =
                            currentPlayers.find(
                                player =>
                                    player.name ===
                                    name
                            );


                        stats[name] = {

                            name,

                            profileImage:
                                currentPlayer
                                    ?.profileImage ||
                                profileImage ||
                                "mario.png",

                            // GP
                            grandPrixPlayed: 0,

                            gpWins: 0,

                            gpPodiums: 0,

                            totalPoints: 0,

                            totalGPPlacement: 0,


                            // RACES
                            totalRaces: 0,

                            raceWins: 0,

                            racePodiums: 0,

                            totalRacePlacements: 0,

                            racePoints: 0,


                            // TRACKS
                            trackStats: {},


                            // FORM
                            gpResults: [],

                            currentWinStreak: 0,

                            longestWinStreak: 0,

                            longestWinlessStreak: 0,


                            // DERIVED
                            gpWinRate: 0,

                            podiumRate: 0,

                            raceWinRate: 0,

                            averageFinish: null,

                            averageGPFinish: null,

                            averageGPPoints: 0,

                            powerRating: 0,

                            recentAverageFinish: null,

                            recentFormScore: 0,

                            trend: 0,

                            beers: 0,

                            winsPer10Beers: 0,

                            podiumsPer10Beers: 0,

                            biggestRival: null

                        };

                    }

                }


                chronologicalHistory
                    .forEach(gp => {

                        const standings =
                            gp.finalStandings ||
                            [];


                        standings.forEach(
                            (
                                standing,
                                index
                            ) => {

                                const name =
                                    getPlayerName(
                                        standing
                                    );


                                if (!name) {
                                    return;
                                }


                                const profileImage =
                                    getPlayerImageFromRecord(
                                        standing
                                    );


                                createPlayerIfNeeded(
                                    name,
                                    profileImage
                                );


                                const player =
                                    stats[name];


                                const placement =
                                    index + 1;


                                player.grandPrixPlayed++;

                                player.totalPoints +=
                                    Number(
                                        standing.points ||
                                        0
                                    );

                                player.totalGPPlacement +=
                                    placement;


                                if (
                                    placement === 1
                                ) {

                                    player.gpWins++;

                                }


                                if (
                                    placement <= 3
                                ) {

                                    player.gpPodiums++;

                                }


                                player.gpResults.push({

                                    placement,

                                    points:
                                        Number(
                                            standing.points ||
                                            0
                                        ),

                                    date:
                                        getGrandPrixDate(
                                            gp
                                        ),

                                    grandPrixName:
                                        gp.grandPrixName ||
                                        "Untitled Grand Prix"

                                });

                            }
                        );


                        (gp.races || [])
                            .forEach(
                                race => {

                                    (
                                        race.results ||
                                        []
                                    ).forEach(
                                        result => {

                                            const name =
                                                getPlayerName(
                                                    result
                                                );


                                            if (!name) {
                                                return;
                                            }


                                            createPlayerIfNeeded(
                                                name,
                                                getPlayerImageFromRecord(
                                                    result
                                                )
                                            );


                                            const player =
                                                stats[
                                                    name
                                                ];


                                            const placement =
                                                Number(
                                                    result
                                                        .placement
                                                );


                                            if (
                                                !placement
                                            ) {

                                                return;

                                            }


                                            player.totalRaces++;

                                            player
                                                .totalRacePlacements +=
                                                placement;

                                            player.racePoints +=
                                                Number(
                                                    result.points ||
                                                    0
                                                );


                                            if (
                                                placement ===
                                                1
                                            ) {

                                                player.raceWins++;

                                            }


                                            if (
                                                placement <=
                                                3
                                            ) {

                                                player.racePodiums++;

                                            }


                                            if (
                                                race.track
                                            ) {

                                                if (
                                                    !player
                                                        .trackStats[
                                                            race.track
                                                        ]
                                                ) {

                                                    player
                                                        .trackStats[
                                                            race.track
                                                        ] = {

                                                        races: 0,

                                                        wins: 0,

                                                        points: 0,

                                                        totalPlacement:
                                                            0

                                                    };

                                                }


                                                const track =
                                                    player
                                                        .trackStats[
                                                            race.track
                                                        ];


                                                track.races++;

                                                track.points +=
                                                    Number(
                                                        result.points ||
                                                        0
                                                    );

                                                track
                                                    .totalPlacement +=
                                                    placement;


                                                if (
                                                    placement ===
                                                    1
                                                ) {

                                                    track.wins++;

                                                }

                                            }

                                        }
                                    );

                                }
                            );

                    });


                Object.values(stats)
                    .forEach(player => {

                        player.gpWinRate =
                            player.grandPrixPlayed
                                ? player.gpWins /
                                    player
                                        .grandPrixPlayed
                                : 0;


                        player.podiumRate =
                            player.grandPrixPlayed
                                ? player.gpPodiums /
                                    player
                                        .grandPrixPlayed
                                : 0;


                        player.raceWinRate =
                            player.totalRaces
                                ? player.raceWins /
                                    player.totalRaces
                                : 0;


                        player.averageFinish =
                            player.totalRaces
                                ? player
                                    .totalRacePlacements /
                                    player.totalRaces
                                : null;


                        player.averageGPFinish =
                            player.grandPrixPlayed
                                ? player
                                    .totalGPPlacement /
                                    player
                                        .grandPrixPlayed
                                : null;


                        player.averageGPPoints =
                            player.grandPrixPlayed
                                ? player.totalPoints /
                                    player
                                        .grandPrixPlayed
                                : 0;


                        player.beers =
                            player.grandPrixPlayed *
                            2;


                        player.winsPer10Beers =
                            player.beers
                                ? (
                                    player.gpWins /
                                    player.beers
                                ) * 10
                                : 0;


                        player.podiumsPer10Beers =
                            player.beers
                                ? (
                                    player.gpPodiums /
                                    player.beers
                                ) * 10
                                : 0;


                        calculatePlayerStreaks(
                            player
                        );


                        calculatePlayerRecentForm(
                            player
                        );


                        player.powerRating =
                            calculatePowerRating(
                                player
                            );

                    });


                const allPlayers =
                    Object.values(stats);


                // Add biggest rival after all
                // player objects exist.
                allPlayers.forEach(
                    player => {

                        let bestRival =
                            null;


                        allPlayers
                            .filter(
                                opponent =>
                                    opponent.name !==
                                    player.name
                            )
                            .forEach(
                                opponent => {

                                    const record =
                                        calculateHeadToHead(
                                            grandPrixHistory,
                                            player.name,
                                            opponent.name
                                        );


                                    if (
                                        !record
                                            .gpMeetings
                                    ) {

                                        return;

                                    }


                                    if (
                                        !bestRival ||
                                        record
                                            .gpMeetings >
                                        bestRival
                                            .meetings
                                    ) {

                                        bestRival = {

                                            opponent:
                                                opponent.name,

                                            meetings:
                                                record
                                                    .gpMeetings,

                                            wins:
                                                record
                                                    .playerOneGPWins,

                                            losses:
                                                record
                                                    .playerTwoGPWins,

                                            ties:
                                                record
                                                    .gpTies

                                        };

                                    }

                                }
                            );


                        player.biggestRival =
                            bestRival;

                    }
                );


                return allPlayers.sort(
                    (a, b) =>
                        b.powerRating -
                        a.powerRating
                );

            },

            [
                grandPrixHistory,
                currentPlayers
            ]
        );


    // =========================================
    // H2H DEFAULT PLAYERS
    // =========================================

    useEffect(() => {

        if (
            playerStats.length >= 2 &&
            !h2hPlayerOne &&
            !h2hPlayerTwo
        ) {

            const alphabetical =
                [...playerStats].sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name
                        )
                );


            setH2hPlayerOne(
                alphabetical[0].name
            );

            setH2hPlayerTwo(
                alphabetical[1].name
            );

        }

    }, [
        playerStats,
        h2hPlayerOne,
        h2hPlayerTwo
    ]);


    // =========================================
    // GENERAL STATS
    // =========================================

    const totalGrandPrix =
        grandPrixHistory.length;


    const totalRaces =
        grandPrixHistory.reduce(
            (sum, gp) =>
                sum +
                (
                    gp.races?.length ||
                    0
                ),
            0
        );


    const totalBeers =
        playerStats.reduce(
            (sum, player) =>
                sum + player.beers,
            0
        );


    const totalPoints =
        playerStats.reduce(
            (sum, player) =>
                sum +
                player.totalPoints,
            0
        );


    // =========================================
    // TRACK COUNTS
    // =========================================

    const trackCounts =
        useMemo(
            () => {

                const counts = {};


                grandPrixHistory.forEach(
                    gp => {

                        (gp.races || [])
                            .forEach(
                                race => {

                                    if (
                                        !race.track
                                    ) {

                                        return;

                                    }


                                    if (
                                        !counts[
                                            race.track
                                        ]
                                    ) {

                                        counts[
                                            race.track
                                        ] = 0;

                                    }


                                    counts[
                                        race.track
                                    ]++;

                                }
                            );

                    }
                );


                return counts;

            },

            [grandPrixHistory]
        );


    const sortedTracks =
        Object.entries(
            trackCounts
        ).sort(
            (a, b) =>
                b[1] - a[1]
        );


    const mostPlayedTrack =
        sortedTracks[0] ||
        null;


    const leastPlayedTrack =
        sortedTracks.length
            ? [...sortedTracks]
                .sort(
                    (a, b) =>
                        a[1] -
                        b[1]
                )[0]
            : null;


    // =========================================
    // LEADER HELPER
    // =========================================

    function getLeader(
        property,
        highest = true,
        filterFunction = null
    ) {

        let available =
            [...playerStats];


        if (filterFunction) {

            available =
                available.filter(
                    filterFunction
                );

        }


        available =
            available.filter(
                player =>
                    player[property] !==
                    null &&
                    player[property] !==
                    undefined
            );


        available.sort(
            (a, b) => {

                if (highest) {

                    return (
                        b[property] -
                        a[property]
                    );

                }


                return (
                    a[property] -
                    b[property]
                );

            }
        );


        return (
            available[0] ||
            null
        );

    }


    // =========================================
    // LEAGUE LEADERS
    // =========================================

    const mostGPWins =
        getLeader(
            "gpWins"
        );


    const bestGPWinRate =
        getLeader(
            "gpWinRate"
        );


    const mostRaceWins =
        getLeader(
            "raceWins"
        );


    const bestRaceWinRate =
        getLeader(
            "raceWinRate"
        );


    const bestAverageFinish =
        getLeader(
            "averageFinish",
            false,
            player =>
                player.totalRaces > 0
        );


    const bestPodiumRate =
        getLeader(
            "podiumRate"
        );


    const mostPoints =
        getLeader(
            "totalPoints"
        );


    const longestWinStreak =
        getLeader(
            "longestWinStreak"
        );


    const hottestPlayer =
        [...playerStats]
            .filter(
                player =>
                    player
                        .recentAverageFinish !==
                    null
            )
            .sort(
                (a, b) =>
                    a.recentAverageFinish -
                    b.recentAverageFinish
            )[0] ||
        null;


    const climber =
        [...playerStats]
            .filter(
                player =>
                    player.grandPrixPlayed >=
                    2
            )
            .sort(
                (a, b) =>
                    b.trend -
                    a.trend
            )[0] ||
        null;


    const slump =
        [...playerStats]
            .filter(
                player =>
                    player.grandPrixPlayed >=
                    2
            )
            .sort(
                (a, b) =>
                    a.trend -
                    b.trend
            )[0] ||
        null;


    const leaderCards = [

        {
            icon: "🏆",

            title:
                "Most GP Wins",

            player:
                mostGPWins,

            value:
                mostGPWins
                    ? mostGPWins.gpWins
                    : "N/A"
        },

        {
            icon: "👑",

            title:
                "Best GP Win %",

            player:
                bestGPWinRate,

            value:
                bestGPWinRate
                    ? `${percentage(
                        bestGPWinRate
                            .gpWins,
                        bestGPWinRate
                            .grandPrixPlayed
                    )}%`
                    : "N/A"
        },

        {
            icon: "🏁",

            title:
                "Most Race Wins",

            player:
                mostRaceWins,

            value:
                mostRaceWins
                    ? mostRaceWins
                        .raceWins
                    : "N/A"
        },

        {
            icon: "⚡",

            title:
                "Best Race Win %",

            player:
                bestRaceWinRate,

            value:
                bestRaceWinRate
                    ? `${percentage(
                        bestRaceWinRate
                            .raceWins,
                        bestRaceWinRate
                            .totalRaces
                    )}%`
                    : "N/A"
        },

        {
            icon: "🎯",

            title:
                "Best Avg Finish",

            player:
                bestAverageFinish,

            value:
                bestAverageFinish
                    ? bestAverageFinish
                        .averageFinish
                        .toFixed(2)
                    : "N/A"
        },

        {
            icon: "🥉",

            title:
                "Best Podium %",

            player:
                bestPodiumRate,

            value:
                bestPodiumRate
                    ? `${percentage(
                        bestPodiumRate
                            .gpPodiums,
                        bestPodiumRate
                            .grandPrixPlayed
                    )}%`
                    : "N/A"
        },

        {
            icon: "💰",

            title:
                "Most Points",

            player:
                mostPoints,

            value:
                mostPoints
                    ? mostPoints
                        .totalPoints
                    : "N/A"
        },

        {
            icon: "🔥",

            title:
                "Longest Win Streak",

            player:
                longestWinStreak,

            value:
                longestWinStreak
                    ? `${longestWinStreak
                        .longestWinStreak} GP`
                    : "N/A"
        },

        {
            icon: "🌡️",

            title:
                "Hottest Player",

            player:
                hottestPlayer,

            value:
                hottestPlayer
                    ? `${hottestPlayer
                        .recentAverageFinish
                        .toFixed(2)} avg`
                    : "N/A"
        },

        {
            icon: "📈",

            title:
                "Biggest Climber",

            player:
                climber,

            value:
                climber
                    ? `+${Math.max(
                        climber.trend,
                        0
                    ).toFixed(2)}`
                    : "N/A"
        },

        {
            icon: "📉",

            title:
                "Biggest Slump",

            player:
                slump,

            value:
                slump
                    ? `${Math.min(
                        slump.trend,
                        0
                    ).toFixed(2)}`
                    : "N/A"
        }

    ];


    // =========================================
    // TRACK SPECIALISTS
    // =========================================

    const trackSpecialists =
        useMemo(
            () => {

                const specialists = [];

                const allTracks =
                    new Set();


                playerStats.forEach(
                    player => {

                        Object.keys(
                            player.trackStats
                        ).forEach(
                            track => {

                                allTracks.add(
                                    track
                                );

                            }
                        );

                    }
                );


                allTracks.forEach(
                    track => {

                        const candidates =
                            playerStats
                                .filter(
                                    player =>
                                        player
                                            .trackStats[
                                                track
                                            ]
                                            ?.races >
                                        0
                                )
                                .map(
                                    player => {

                                        const stat =
                                            player
                                                .trackStats[
                                                    track
                                                ];


                                        return {

                                            player,

                                            track,

                                            races:
                                                stat.races,

                                            wins:
                                                stat.wins,

                                            averagePoints:
                                                stat.points /
                                                stat.races,

                                            averageFinish:
                                                stat
                                                    .totalPlacement /
                                                stat.races

                                        };

                                    }
                                )
                                .sort(
                                    (a, b) => {

                                        if (
                                            b.averagePoints !==
                                            a.averagePoints
                                        ) {

                                            return (
                                                b.averagePoints -
                                                a.averagePoints
                                            );

                                        }


                                        return (
                                            b.races -
                                            a.races
                                        );

                                    }
                                );


                        if (
                            candidates[0]
                        ) {

                            specialists.push(
                                candidates[0]
                            );

                        }

                    }
                );


                specialists.sort(
                    (a, b) =>
                        b.races -
                        a.races
                );


                return specialists.slice(
                    0,
                    8
                );

            },

            [playerStats]
        );


    // =========================================
    // BEER LEADERS
    // =========================================

    const biggestDrinker =
        [...playerStats]
            .sort(
                (a, b) =>
                    b.beers -
                    a.beers
            )[0] ||
        null;


    const mostWinsPerBeer =
        [...playerStats]
            .filter(
                player =>
                    player.beers >
                    0
            )
            .sort(
                (a, b) =>
                    b.winsPer10Beers -
                    a.winsPer10Beers
            )[0] ||
        null;


    const beerEfficiencyPlayers =
        [...playerStats]
            .sort(
                (a, b) =>
                    b.winsPer10Beers -
                    a.winsPer10Beers
            );


    // =========================================
    // STREAK CARDS
    // =========================================

    const currentStreak =
        getLeader(
            "currentWinStreak"
        );


    const longestStreak =
        getLeader(
            "longestWinStreak"
        );


    const longestWinless =
        getLeader(
            "longestWinlessStreak"
        );


    const streakCards = [

        {
            icon: "🔥",

            title:
                "Current Win Streak",

            player:
                currentStreak,

            value:
                currentStreak
                    ? `${currentStreak
                        .currentWinStreak} GP`
                    : "N/A"
        },

        {
            icon: "👑",

            title:
                "Longest Win Streak",

            player:
                longestStreak,

            value:
                longestStreak
                    ? `${longestStreak
                        .longestWinStreak} GP`
                    : "N/A"
        },

        {
            icon: "🥶",

            title:
                "Longest Winless Streak",

            player:
                longestWinless,

            value:
                longestWinless
                    ? `${longestWinless
                        .longestWinlessStreak} GP`
                    : "N/A"
        },

        {
            icon: "🌡️",

            title:
                "Best Recent Form",

            player:
                hottestPlayer,

            value:
                hottestPlayer
                    ? `${hottestPlayer
                        .recentAverageFinish
                        .toFixed(2)} avg finish`
                    : "N/A"
        }

    ];


    // =========================================
    // CURRENT H2H
    // =========================================

    const headToHeadRecord =
        useMemo(
            () => {

                if (
                    !h2hPlayerOne ||
                    !h2hPlayerTwo ||
                    h2hPlayerOne ===
                    h2hPlayerTwo
                ) {

                    return null;

                }


                return calculateHeadToHead(
                    grandPrixHistory,
                    h2hPlayerOne,
                    h2hPlayerTwo
                );

            },

            [
                grandPrixHistory,
                h2hPlayerOne,
                h2hPlayerTwo
            ]
        );


    const h2hPlayerOneObject =
        playerStats.find(
            player =>
                player.name ===
                h2hPlayerOne
        );


    const h2hPlayerTwoObject =
        playerStats.find(
            player =>
                player.name ===
                h2hPlayerTwo
        );


    let h2hLeaderText =
        "Even rivalry";


    if (
        headToHeadRecord &&
        headToHeadRecord
            .playerOneGPWins >
        headToHeadRecord
            .playerTwoGPWins
    ) {

        h2hLeaderText =
            `${h2hPlayerOne} leads`;

    } else if (
        headToHeadRecord &&
        headToHeadRecord
            .playerTwoGPWins >
        headToHeadRecord
            .playerOneGPWins
    ) {

        h2hLeaderText =
            `${h2hPlayerTwo} leads`;

    }


    // =========================================
    // PLAYER MODAL HELPERS
    // =========================================

    function getBestAndWorstTrack(
        player
    ) {

        const tracks =
            Object.entries(
                player.trackStats ||
                {}
            );


        if (!tracks.length) {

            return {

                bestTrack: null,

                worstTrack: null

            };

        }


        const sorted =
            [...tracks].sort(
                (a, b) => {

                    const avgA =
                        a[1].points /
                        a[1].races;


                    const avgB =
                        b[1].points /
                        b[1].races;


                    return (
                        avgB -
                        avgA
                    );

                }
            );


        return {

            bestTrack:
                sorted[0],

            worstTrack:
                sorted[
                    sorted.length -
                    1
                ]

        };

    }


    // =========================================
    // LEADER CARD COMPONENT
    // =========================================

    function LeaderCard({
        card
    }) {

        return (

            <div className="leader-card">

                <span className="leader-icon">
                    {card.icon}
                </span>


                {card.player && (

                    <img
                        src={`/images/characters/${card.player.profileImage}`}
                        alt={
                            card.player.name
                        }
                        className="leader-player-image"
                    />

                )}


                <h3>
                    {card.title}
                </h3>


                {card.player && (

                    <strong>
                        {card.player.name}
                    </strong>

                )}


                <p>
                    {card.value}
                </p>

            </div>

        );

    }


    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (

            <>

                <header className="page-header">

                    <Link
                        to="/"
                        className="home-link"
                    >
                        ← Home
                    </Link>

                    <h1>
                        📊 Stats Dashboard
                    </h1>

                </header>


                <main className="stats-container">

                    <div className="empty-state">

                        <h3>
                            Loading stats...
                        </h3>

                    </div>

                </main>

            </>

        );

    }


    // =========================================
    // JSX
    // =========================================

    return (

        <>

            {/* =================================
                HEADER
            ================================== */}

            <header className="page-header">

                <Link
                    to="/"
                    className="home-link"
                >
                    ← Home
                </Link>


                <h1>
                    📊 Stats Dashboard
                </h1>


                <p>
                    Power rankings, player records,
                    rivalries, tracks, beers, and
                    Grand Prix history.
                </p>

            </header>


            <main className="stats-container">


                {loadError && (

                    <div className="empty-state">

                        <h3>
                            Could not load stats.
                        </h3>

                        <p>
                            Make sure the backend is running.
                        </p>

                    </div>

                )}


                {/* =================================
                    TABS
                ================================== */}

                <div className="tabs">

                    <button
                        className={
                            `tab-btn ${
                                activeTab ===
                                "general"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            setActiveTab(
                                "general"
                            )
                        }
                    >
                        General Stats
                    </button>


                    <button
                        className={
                            `tab-btn ${
                                activeTab ===
                                "players"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            setActiveTab(
                                "players"
                            )
                        }
                    >
                        Player Stats
                    </button>


                    <button
                        className={
                            `tab-btn ${
                                activeTab ===
                                "head-to-head"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            setActiveTab(
                                "head-to-head"
                            )
                        }
                    >
                        ⚔️ Head-to-Head
                    </button>


                    <button
                        className={
                            `tab-btn ${
                                activeTab ===
                                "history"
                                    ? "active"
                                    : ""
                            }`
                        }
                        onClick={() =>
                            setActiveTab(
                                "history"
                            )
                        }
                    >
                        History
                    </button>

                </div>


                {/* =================================
                    GENERAL TAB
                ================================== */}

                {activeTab ===
                "general" && (

                    <section
                        id="general"
                        className="tab-content active"
                    >

                        <h2>
                            General Stats
                        </h2>


                        <div className="stat-grid">

                            <div className="stat-card">

                                <h3>
                                    🏆 Grand Prix Played
                                </h3>

                                <p>
                                    {totalGrandPrix}
                                </p>

                            </div>


                            <div className="stat-card">

                                <h3>
                                    🏁 Total Races
                                </h3>

                                <p>
                                    {totalRaces}
                                </p>

                            </div>


                            <div className="stat-card">

                                <h3>
                                    👥 Players Tracked
                                </h3>

                                <p>
                                    {playerStats.length}
                                </p>

                            </div>


                            <div className="stat-card">

                                <h3>
                                    🍺 Total Beers
                                </h3>

                                <p>
                                    {totalBeers}
                                </p>

                            </div>


                            <div className="stat-card">

                                <h3>
                                    🎮 Most Played Track
                                </h3>

                                <p className="small-stat">

                                    {
                                        mostPlayedTrack
                                            ? mostPlayedTrack[0]
                                            : "N/A"
                                    }

                                </p>


                                {mostPlayedTrack && (

                                    <span>
                                        {
                                            mostPlayedTrack[1]
                                        } races
                                    </span>

                                )}

                            </div>


                            <div className="stat-card">

                                <h3>
                                    📊 Total Points Scored
                                </h3>

                                <p>
                                    {totalPoints}
                                </p>

                            </div>

                        </div>


                        {/* =========================
                            POWER RANKINGS
                        ========================== */}

                        <section className="dashboard-section power-section">

                            <div className="section-heading">

                                <div>

                                    <span className="section-kicker">
                                        LIVE RANKINGS
                                    </span>

                                    <h2>
                                        🏆 Beerio Kart Power Rankings
                                    </h2>

                                </div>


                                <p>
                                    Overall rating based on wins,
                                    podiums, race performance,
                                    average finish, and recent form.
                                </p>

                            </div>


                            <div className="power-rankings">

                                {playerStats.length ===
                                0 ? (

                                    <div className="empty-state">
                                        No rankings yet.
                                    </div>

                                ) : (

                                    playerStats.map(
                                        (
                                            player,
                                            index
                                        ) => (

                                            <div
                                                className={
                                                    `power-row ${
                                                        index === 0
                                                            ? "power-number-one"
                                                            : ""
                                                    }`
                                                }
                                                key={
                                                    player.name
                                                }
                                            >

                                                <div className="power-position">

                                                    {
                                                        index ===
                                                        0
                                                            ? "👑"
                                                            : `#${index + 1}`
                                                    }

                                                </div>


                                                <img
                                                    src={`/images/characters/${player.profileImage}`}
                                                    alt={
                                                        player.name
                                                    }
                                                    className="power-player-image"
                                                />


                                                <div className="power-player-info">

                                                    <strong>
                                                        {
                                                            player.name
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            player.gpWins
                                                        } wins •{" "}
                                                        {
                                                            player.grandPrixPlayed
                                                        } GP
                                                    </span>

                                                </div>


                                                <div
                                                    className={
                                                        `power-trend ${getTrendClass(
                                                            player.trend
                                                        )}`
                                                    }
                                                >
                                                    {
                                                        getTrendIcon(
                                                            player.trend
                                                        )
                                                    }
                                                </div>


                                                <div className="power-score">

                                                    <strong>
                                                        {
                                                            player.powerRating
                                                        }
                                                    </strong>

                                                    <span>
                                                        POWER
                                                    </span>

                                                </div>

                                            </div>

                                        )
                                    )

                                )}

                            </div>

                        </section>


                        {/* =========================
                            LEAGUE LEADERS
                        ========================== */}

                        <section className="dashboard-section">

                            <div className="section-heading">

                                <div>

                                    <span className="section-kicker">
                                        BEST OF THE BEST
                                    </span>

                                    <h2>
                                        🔥 League Leaders
                                    </h2>

                                </div>

                            </div>


                            <div className="leader-grid">

                                {leaderCards.map(
                                    card => (

                                        <LeaderCard
                                            card={card}
                                            key={
                                                card.title
                                            }
                                        />

                                    )
                                )}

                            </div>

                        </section>


                        {/* =========================
                            CURRENT FORM
                        ========================== */}

                        <section className="dashboard-section">

                            <div className="section-heading">

                                <div>

                                    <span className="section-kicker">
                                        LAST 5 GRAND PRIX
                                    </span>

                                    <h2>
                                        🔥 Current Form
                                    </h2>

                                </div>


                                <p>
                                    See who is hot, cold, or
                                    trending in the right direction.
                                </p>

                            </div>


                            <div className="form-grid">

                                {[...playerStats]
                                    .sort(
                                        (a, b) => {

                                            if (
                                                a.recentAverageFinish ===
                                                null
                                            ) {
                                                return 1;
                                            }

                                            if (
                                                b.recentAverageFinish ===
                                                null
                                            ) {
                                                return -1;
                                            }

                                            return (
                                                a.recentAverageFinish -
                                                b.recentAverageFinish
                                            );

                                        }
                                    )
                                    .map(
                                        player => {

                                            const recent =
                                                player.gpResults
                                                    .slice(
                                                        -5
                                                    );


                                            return (

                                                <div
                                                    className="form-card"
                                                    key={
                                                        player.name
                                                    }
                                                >

                                                    <div className="form-player-header">

                                                        <img
                                                            src={`/images/characters/${player.profileImage}`}
                                                            alt={
                                                                player.name
                                                            }
                                                            className="form-player-image"
                                                        />


                                                        <div>

                                                            <h3>
                                                                {
                                                                    player.name
                                                                }
                                                            </h3>

                                                            <span
                                                                className={
                                                                    getTrendClass(
                                                                        player.trend
                                                                    )
                                                                }
                                                            >
                                                                {
                                                                    getTrendIcon(
                                                                        player.trend
                                                                    )
                                                                }{" "}
                                                                {
                                                                    Math.abs(
                                                                        player.trend
                                                                    ).toFixed(
                                                                        2
                                                                    )
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>


                                                    <div className="form-results">

                                                        {recent.length ? (

                                                            recent.map(
                                                                (
                                                                    result,
                                                                    index
                                                                ) => (

                                                                    <span
                                                                        className={
                                                                            `form-result form-place-${result.placement}`
                                                                        }
                                                                        title={
                                                                            result.grandPrixName
                                                                        }
                                                                        key={
                                                                            `${result.date}-${index}`
                                                                        }
                                                                    >
                                                                        {
                                                                            getPlacementDisplay(
                                                                                result.placement
                                                                            )
                                                                        }
                                                                    </span>

                                                                )
                                                            )

                                                        ) : (

                                                            <span>
                                                                No races
                                                            </span>

                                                        )}

                                                    </div>


                                                    <p>
                                                        Last{" "}
                                                        {
                                                            recent.length
                                                        }{" "}
                                                        GP avg:{" "}

                                                        <strong>
                                                            {
                                                                player.recentAverageFinish !==
                                                                null
                                                                    ? player.recentAverageFinish.toFixed(
                                                                        2
                                                                    )
                                                                    : "N/A"
                                                            }
                                                        </strong>
                                                    </p>

                                                </div>

                                            );

                                        }
                                    )}

                            </div>

                        </section>


                        {/* =========================
                            TRACK STATS
                        ========================== */}

                        <section className="dashboard-section">

                            <div className="section-heading">

                                <div>

                                    <span className="section-kicker">
                                        COURSE DATA
                                    </span>

                                    <h2>
                                        🏁 Track Stats
                                    </h2>

                                </div>

                            </div>


                            <div className="stat-grid">

                                {sortedTracks.length ===
                                0 ? (

                                    <div className="stat-card">

                                        <h3>
                                            No Tracks Yet
                                        </h3>

                                        <p>
                                            🏁
                                        </p>

                                    </div>

                                ) : (

                                    <>

                                        <div className="stat-card">

                                            <h3>
                                                🗺️ Unique Tracks
                                            </h3>

                                            <p>
                                                {
                                                    sortedTracks.length
                                                }
                                            </p>

                                        </div>


                                        <div className="stat-card">

                                            <h3>
                                                🔥 Most Played
                                            </h3>

                                            <p className="small-stat">
                                                {
                                                    mostPlayedTrack[
                                                        0
                                                    ]
                                                }
                                            </p>

                                            <span>
                                                {
                                                    mostPlayedTrack[
                                                        1
                                                    ]
                                                } races
                                            </span>

                                        </div>


                                        <div className="stat-card">

                                            <h3>
                                                🧊 Least Played
                                            </h3>

                                            <p className="small-stat">
                                                {
                                                    leastPlayedTrack[
                                                        0
                                                    ]
                                                }
                                            </p>

                                            <span>
                                                {
                                                    leastPlayedTrack[
                                                        1
                                                    ]
                                                } races
                                            </span>

                                        </div>


                                        <div className="stat-card">

                                            <h3>
                                                🏁 Track Entries
                                            </h3>

                                            <p>
                                                {
                                                    sortedTracks.reduce(
                                                        (
                                                            sum,
                                                            track
                                                        ) =>
                                                            sum +
                                                            track[1],
                                                        0
                                                    )
                                                }
                                            </p>

                                        </div>

                                    </>

                                )}

                            </div>


                            <h3 className="subsection-title">
                                👑 Track Specialists
                            </h3>


                            <div className="specialist-grid">

                                {trackSpecialists.length ? (

                                    trackSpecialists.map(
                                        specialist => (

                                            <div
                                                className="specialist-card"
                                                key={
                                                    specialist.track
                                                }
                                            >

                                                <img
                                                    src={`/images/characters/${specialist.player.profileImage}`}
                                                    alt={
                                                        specialist.player.name
                                                    }
                                                    className="specialist-image"
                                                />


                                                <div>

                                                    <span className="specialist-track">
                                                        {
                                                            specialist.track
                                                        }
                                                    </span>

                                                    <h3>
                                                        👑{" "}
                                                        {
                                                            specialist.player.name
                                                        }
                                                    </h3>

                                                    <p>
                                                        {
                                                            specialist.averagePoints.toFixed(
                                                                1
                                                            )
                                                        }{" "}
                                                        avg pts •{" "}
                                                        {
                                                            specialist.wins
                                                        }{" "}
                                                        wins
                                                    </p>

                                                </div>

                                            </div>

                                        )
                                    )

                                ) : (

                                    <p>
                                        No track data yet.
                                    </p>

                                )}

                            </div>

                        </section>


                        {/* =========================
                            BEER STATS
                        ========================== */}

                        <section className="dashboard-section beer-section">

                            <div className="section-heading">

                                <div>

                                    <span className="section-kicker">
                                        THE IMPORTANT NUMBERS
                                    </span>

                                    <h2>
                                        🍺 Beerio Stats
                                    </h2>

                                </div>


                                <p>
                                    Two beers per player,
                                    per Grand Prix.
                                </p>

                            </div>


                            <div className="stat-grid">

                                <div className="stat-card">

                                    <h3>
                                        🍺 Total Beers
                                    </h3>

                                    <p>
                                        {totalBeers}
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🍻 Most Beers
                                    </h3>

                                    <p className="small-stat">
                                        {
                                            biggestDrinker
                                                ? biggestDrinker.name
                                                : "N/A"
                                        }
                                    </p>

                                    {biggestDrinker && (

                                        <span>
                                            {
                                                biggestDrinker.beers
                                            } beers
                                        </span>

                                    )}

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🏆 Best Wins / Beer
                                    </h3>

                                    <p className="small-stat">
                                        {
                                            mostWinsPerBeer
                                                ? mostWinsPerBeer.name
                                                : "N/A"
                                        }
                                    </p>

                                    {mostWinsPerBeer && (

                                        <span>
                                            {
                                                mostWinsPerBeer.winsPer10Beers.toFixed(
                                                    2
                                                )
                                            }{" "}
                                            wins / 10 beers
                                        </span>

                                    )}

                                </div>

                            </div>


                            <h3 className="subsection-title">
                                🍻 Beerio Efficiency
                            </h3>


                            <div className="efficiency-grid">

                                {beerEfficiencyPlayers.map(
                                    player => (

                                        <div
                                            className="efficiency-card"
                                            key={
                                                player.name
                                            }
                                        >

                                            <img
                                                src={`/images/characters/${player.profileImage}`}
                                                alt={
                                                    player.name
                                                }
                                                className="efficiency-image"
                                            />


                                            <div>

                                                <h3>
                                                    {
                                                        player.name
                                                    }
                                                </h3>

                                                <p>
                                                    🍺{" "}
                                                    {
                                                        player.beers
                                                    }{" "}
                                                    beers
                                                </p>

                                                <strong>
                                                    {
                                                        player.winsPer10Beers.toFixed(
                                                            2
                                                        )
                                                    }{" "}
                                                    wins / 10 beers
                                                </strong>

                                                <span>
                                                    {
                                                        player.podiumsPer10Beers.toFixed(
                                                            2
                                                        )
                                                    }{" "}
                                                    podiums / 10 beers
                                                </span>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </section>


                        {/* =========================
                            STREAKS
                        ========================== */}

                        <section className="dashboard-section">

                            <div className="section-heading">

                                <div>

                                    <span className="section-kicker">
                                        STREAK WATCH
                                    </span>

                                    <h2>
                                        👑 Streaks & Trends
                                    </h2>

                                </div>

                            </div>


                            <div className="leader-grid">

                                {streakCards.map(
                                    card => (

                                        <LeaderCard
                                            card={card}
                                            key={
                                                card.title
                                            }
                                        />

                                    )
                                )}

                            </div>

                        </section>

                    </section>

                )}


                {/* =================================
                    PLAYER TAB
                ================================== */}

                {activeTab ===
                "players" && (

                    <section
                        id="players"
                        className="tab-content active"
                    >

                        <div className="section-heading centered-section-heading">

                            <div>

                                <span className="section-kicker">
                                    INDIVIDUAL PROFILES
                                </span>

                                <h2>
                                    Player Stats
                                </h2>

                            </div>


                            <p>
                                Select a player to view
                                their full career breakdown.
                            </p>

                        </div>


                        <div className="player-grid">

                            {playerStats.map(
                                (
                                    player,
                                    index
                                ) => (

                                    <div
                                        className="player-card"
                                        key={
                                            player.name
                                        }
                                        onClick={() =>
                                            setSelectedModalPlayer(
                                                player
                                            )
                                        }
                                    >

                                        <div className="player-rank-badge">
                                            #{index + 1}
                                        </div>


                                        <img
                                            src={`/images/characters/${player.profileImage}`}
                                            alt={
                                                player.name
                                            }
                                            className="stats-player-image"
                                        />


                                        <h3>
                                            {player.name}
                                        </h3>


                                        <p>
                                            {
                                                player.gpWins
                                            }{" "}
                                            GP Wins
                                        </p>


                                        <span className="player-power-preview">
                                            {
                                                player.powerRating
                                            }{" "}
                                            Power
                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    </section>

                )}


                {/* =================================
                    HEAD TO HEAD TAB
                ================================== */}

                {activeTab ===
                "head-to-head" && (

                    <section
                        id="head-to-head"
                        className="tab-content active"
                    >

                        <div className="section-heading centered-section-heading">

                            <div>

                                <span className="section-kicker">
                                    PLAYER VS PLAYER
                                </span>

                                <h2>
                                    ⚔️ Head-to-Head
                                </h2>

                            </div>


                            <p>
                                Pick any two players and compare
                                their records when they raced
                                against each other.
                            </p>

                        </div>


                        <div className="head-to-head-picker">

                            <div className="h2h-select-box">

                                <label htmlFor="h2h-player-one">
                                    Player 1
                                </label>

                                <select
                                    id="h2h-player-one"
                                    value={
                                        h2hPlayerOne
                                    }
                                    onChange={
                                        event =>
                                            setH2hPlayerOne(
                                                event.target.value
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Player
                                    </option>


                                    {[...playerStats]
                                        .sort(
                                            (a, b) =>
                                                a.name.localeCompare(
                                                    b.name
                                                )
                                        )
                                        .map(
                                            player => (

                                                <option
                                                    value={
                                                        player.name
                                                    }
                                                    key={
                                                        player.name
                                                    }
                                                >
                                                    {
                                                        player.name
                                                    }
                                                </option>

                                            )
                                        )}

                                </select>

                            </div>


                            <div className="h2h-vs">
                                VS
                            </div>


                            <div className="h2h-select-box">

                                <label htmlFor="h2h-player-two">
                                    Player 2
                                </label>

                                <select
                                    id="h2h-player-two"
                                    value={
                                        h2hPlayerTwo
                                    }
                                    onChange={
                                        event =>
                                            setH2hPlayerTwo(
                                                event.target.value
                                            )
                                    }
                                >

                                    <option value="">
                                        Select Player
                                    </option>


                                    {[...playerStats]
                                        .sort(
                                            (a, b) =>
                                                a.name.localeCompare(
                                                    b.name
                                                )
                                        )
                                        .map(
                                            player => (

                                                <option
                                                    value={
                                                        player.name
                                                    }
                                                    key={
                                                        player.name
                                                    }
                                                >
                                                    {
                                                        player.name
                                                    }
                                                </option>

                                            )
                                        )}

                                </select>

                            </div>

                        </div>


                        <div className="head-to-head-results">

                            {h2hPlayerOne ===
                            h2hPlayerTwo &&
                            h2hPlayerOne ? (

                                <div className="empty-state">

                                    <div className="empty-state-icon">
                                        ⚠️
                                    </div>

                                    <h3>
                                        Pick Two Different Players
                                    </h3>

                                </div>

                            ) : !headToHeadRecord ||
                            !h2hPlayerOneObject ||
                            !h2hPlayerTwoObject ? (

                                <div className="empty-state">

                                    <div className="empty-state-icon">
                                        ⚔️
                                    </div>

                                    <h3>
                                        Choose Two Players
                                    </h3>

                                    <p>
                                        Their Grand Prix record,
                                        race wins, average finishes,
                                        and rivalry stats will appear here.
                                    </p>

                                </div>

                            ) : (

                                <>

                                    <div className="h2h-scoreboard">


                                        <div className="h2h-player-card">

                                            <img
                                                src={`/images/characters/${h2hPlayerOneObject.profileImage}`}
                                                alt={
                                                    h2hPlayerOneObject.name
                                                }
                                                className="h2h-player-image"
                                            />

                                            <h2>
                                                {
                                                    h2hPlayerOneObject.name
                                                }
                                            </h2>

                                            <div className="h2h-big-score">
                                                {
                                                    headToHeadRecord
                                                        .playerOneGPWins
                                                }
                                            </div>

                                            <span>
                                                GP wins vs{" "}
                                                {
                                                    h2hPlayerTwoObject.name
                                                }
                                            </span>

                                        </div>


                                        <div className="h2h-center">

                                            <span className="h2h-record-label">
                                                {
                                                    h2hLeaderText
                                                }
                                            </span>

                                            <div className="h2h-vs-large">
                                                VS
                                            </div>

                                            <span>
                                                {
                                                    headToHeadRecord
                                                        .gpMeetings
                                                }{" "}
                                                GP meetings
                                            </span>

                                        </div>


                                        <div className="h2h-player-card">

                                            <img
                                                src={`/images/characters/${h2hPlayerTwoObject.profileImage}`}
                                                alt={
                                                    h2hPlayerTwoObject.name
                                                }
                                                className="h2h-player-image"
                                            />

                                            <h2>
                                                {
                                                    h2hPlayerTwoObject.name
                                                }
                                            </h2>

                                            <div className="h2h-big-score">
                                                {
                                                    headToHeadRecord
                                                        .playerTwoGPWins
                                                }
                                            </div>

                                            <span>
                                                GP wins vs{" "}
                                                {
                                                    h2hPlayerOneObject.name
                                                }
                                            </span>

                                        </div>

                                    </div>


                                    <div className="h2h-stat-grid">

                                        <div className="stat-card">

                                            <h3>
                                                ⚔️ GP Record
                                            </h3>

                                            <p className="small-stat">
                                                {
                                                    headToHeadRecord
                                                        .playerOneGPWins
                                                }
                                                {" - "}
                                                {
                                                    headToHeadRecord
                                                        .playerTwoGPWins
                                                }
                                            </p>

                                            <span>
                                                {
                                                    headToHeadRecord
                                                        .gpTies
                                                }{" "}
                                                ties
                                            </span>

                                        </div>


                                        <div className="stat-card">

                                            <h3>
                                                🏁 Race Record
                                            </h3>

                                            <p className="small-stat">
                                                {
                                                    headToHeadRecord
                                                        .playerOneRaceWins
                                                }
                                                {" - "}
                                                {
                                                    headToHeadRecord
                                                        .playerTwoRaceWins
                                                }
                                            </p>

                                            <span>
                                                {
                                                    headToHeadRecord
                                                        .raceMeetings
                                                }{" "}
                                                races together
                                            </span>

                                        </div>


                                        <div className="stat-card">

                                            <h3>
                                                🎯{" "}
                                                {
                                                    h2hPlayerOneObject.name
                                                }{" "}
                                                Avg Finish
                                            </h3>

                                            <p>
                                                {
                                                    headToHeadRecord
                                                        .playerOneAverageFinish !==
                                                    null
                                                        ? headToHeadRecord
                                                            .playerOneAverageFinish
                                                            .toFixed(
                                                                2
                                                            )
                                                        : "N/A"
                                                }
                                            </p>

                                        </div>


                                        <div className="stat-card">

                                            <h3>
                                                🎯{" "}
                                                {
                                                    h2hPlayerTwoObject.name
                                                }{" "}
                                                Avg Finish
                                            </h3>

                                            <p>
                                                {
                                                    headToHeadRecord
                                                        .playerTwoAverageFinish !==
                                                    null
                                                        ? headToHeadRecord
                                                            .playerTwoAverageFinish
                                                            .toFixed(
                                                                2
                                                            )
                                                        : "N/A"
                                                }
                                            </p>

                                        </div>

                                    </div>

                                </>

                            )}

                        </div>

                    </section>

                )}


                {/* =================================
                    HISTORY TAB
                ================================== */}

                {activeTab ===
                "history" && (

                    <section
                        id="history"
                        className="tab-content active"
                    >

                        <div className="section-heading centered-section-heading">

                            <div>

                                <span className="section-kicker">
                                    THE ARCHIVES
                                </span>

                                <h2>
                                    Grand Prix History
                                </h2>

                            </div>


                            <p>
                                Every completed Grand Prix
                                and its final standings.
                            </p>

                        </div>


                        {grandPrixHistory.length ===
                        0 ? (

                            <div className="empty-state">

                                <div className="empty-state-icon">
                                    🏁
                                </div>

                                <h3>
                                    No Grand Prix History Yet
                                </h3>

                            </div>

                        ) : (

                            sortHistoryNewestFirst(
                                grandPrixHistory
                            ).map(
                                gp => {

                                    const date =
                                        new Date(
                                            gp.datePlayed ||
                                            gp.createdAt
                                        ).toLocaleDateString();


                                    const standings =
                                        gp.finalStandings ||
                                        [];


                                    const winner =
                                        standings[0] ||
                                        gp.winner ||
                                        {};


                                    const winnerName =
                                        getPlayerName(
                                            winner
                                        ) ||
                                        "Unknown";


                                    const winnerImage =
                                        getCurrentProfileImage(
                                            winnerName,
                                            getPlayerImageFromRecord(
                                                winner
                                            )
                                        );


                                    return (

                                        <div
                                            className="history-card"
                                            key={
                                                gp._id ||
                                                `${gp.grandPrixName}-${getGrandPrixDate(
                                                    gp
                                                )}`
                                            }
                                        >

                                            <h3>
                                                🏁{" "}
                                                {
                                                    gp.grandPrixName ||
                                                    "Untitled Grand Prix"
                                                }
                                            </h3>


                                            <p>
                                                📅 {date}
                                            </p>


                                            <p>
                                                👥{" "}
                                                {
                                                    gp.totalPlayers ||
                                                    gp.players
                                                        ?.length ||
                                                    standings.length ||
                                                    0
                                                }{" "}
                                                Players
                                            </p>


                                            <div className="history-winner">

                                                <span>
                                                    🏆 Winner:
                                                </span>


                                                <img
                                                    src={`/images/characters/${winnerImage}`}
                                                    alt={
                                                        winnerName
                                                    }
                                                    className="history-player-image"
                                                />


                                                <strong>
                                                    {
                                                        winnerName
                                                    }
                                                </strong>

                                            </div>


                                            <div className="history-standings">

                                                {standings.map(
                                                    (
                                                        standing,
                                                        index
                                                    ) => {

                                                        const name =
                                                            getPlayerName(
                                                                standing
                                                            ) ||
                                                            "Unknown";


                                                        const image =
                                                            getCurrentProfileImage(
                                                                name,
                                                                getPlayerImageFromRecord(
                                                                    standing
                                                                )
                                                            );


                                                        return (

                                                            <div
                                                                className="history-row"
                                                                key={
                                                                    `${name}-${index}`
                                                                }
                                                            >

                                                                <span className="history-player">

                                                                    <span className="history-medal">
                                                                        {
                                                                            getMedal(
                                                                                index
                                                                            )
                                                                        }
                                                                    </span>


                                                                    <img
                                                                        src={`/images/characters/${image}`}
                                                                        alt={
                                                                            name
                                                                        }
                                                                        className="history-player-image"
                                                                    />


                                                                    <span>
                                                                        {
                                                                            name
                                                                        }
                                                                    </span>

                                                                </span>


                                                                <strong>
                                                                    {
                                                                        standing.points ||
                                                                        0
                                                                    }{" "}
                                                                    pts
                                                                </strong>

                                                            </div>

                                                        );

                                                    }
                                                )}

                                            </div>

                                        </div>

                                    );

                                }
                            )

                        )}

                    </section>

                )}

            </main>


            {/* =================================
                PLAYER MODAL
            ================================== */}

            {selectedModalPlayer && (() => {

                const {
                    bestTrack,
                    worstTrack
                } =
                    getBestAndWorstTrack(
                        selectedModalPlayer
                    );


                const recentResults =
                    selectedModalPlayer
                        .gpResults
                        .slice(-5);


                const rival =
                    selectedModalPlayer
                        .biggestRival;


                return (

                    <div
                        className="modal"
                        onClick={
                            event => {

                                if (
                                    event.target ===
                                    event.currentTarget
                                ) {

                                    setSelectedModalPlayer(
                                        null
                                    );

                                }

                            }
                        }
                    >

                        <div className="modal-content">

                            <button
                                className="close-btn"
                                aria-label="Close player stats"
                                onClick={() =>
                                    setSelectedModalPlayer(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>


                            <div className="player-modal-header">

                                <img
                                    src={`/images/characters/${selectedModalPlayer.profileImage}`}
                                    alt={
                                        selectedModalPlayer.name
                                    }
                                    className="modal-player-image"
                                />


                                <div>

                                    <span className="modal-power-label">
                                        POWER RATING
                                    </span>

                                    <h2>
                                        {
                                            selectedModalPlayer.name
                                        }
                                    </h2>

                                    <div className="modal-power-score">
                                        {
                                            selectedModalPlayer.powerRating
                                        }
                                    </div>

                                </div>

                            </div>


                            <div className="modal-form-strip">

                                <strong>
                                    Current Form
                                </strong>


                                <div>

                                    {recentResults.length
                                        ? recentResults.map(
                                            (
                                                result,
                                                index
                                            ) => (

                                                <span
                                                    className={
                                                        `form-result form-place-${result.placement}`
                                                    }
                                                    key={
                                                        `${result.date}-${index}`
                                                    }
                                                >
                                                    {
                                                        getPlacementDisplay(
                                                            result.placement
                                                        )
                                                    }
                                                </span>

                                            )
                                        )
                                        : "No GP yet"
                                    }

                                </div>

                            </div>


                            <div className="stat-grid">

                                <div className="stat-card">

                                    <h3>
                                        🏆 GP Wins
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.gpWins
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        👑 GP Win %
                                    </h3>

                                    <p>
                                        {
                                            percentage(
                                                selectedModalPlayer.gpWins,
                                                selectedModalPlayer.grandPrixPlayed
                                            )
                                        }%
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🥉 GP Podiums
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.gpPodiums
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🎯 Podium %
                                    </h3>

                                    <p>
                                        {
                                            percentage(
                                                selectedModalPlayer.gpPodiums,
                                                selectedModalPlayer.grandPrixPlayed
                                            )
                                        }%
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🎮 GP Played
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.grandPrixPlayed
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        📊 Avg GP Points
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.averageGPPoints.toFixed(
                                                2
                                            )
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🏁 Race Wins
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.raceWins
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        ⚡ Race Win %
                                    </h3>

                                    <p>
                                        {
                                            percentage(
                                                selectedModalPlayer.raceWins,
                                                selectedModalPlayer.totalRaces
                                            )
                                        }%
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🎯 Avg Race Finish
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.averageFinish
                                                ? selectedModalPlayer.averageFinish.toFixed(
                                                    2
                                                )
                                                : "N/A"
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        💰 Total Points
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.totalPoints
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🔥 Current Win Streak
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.currentWinStreak
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        👑 Longest Win Streak
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.longestWinStreak
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🥶 Longest Winless
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.longestWinlessStreak
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🍺 Career Beers
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.beers
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🍻 Wins / 10 Beers
                                    </h3>

                                    <p>
                                        {
                                            selectedModalPlayer.winsPer10Beers.toFixed(
                                                2
                                            )
                                        }
                                    </p>

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        🏁 Best Track
                                    </h3>

                                    <p className="small-stat">
                                        {
                                            bestTrack
                                                ? bestTrack[0]
                                                : "N/A"
                                        }
                                    </p>

                                    {bestTrack && (

                                        <span>
                                            {
                                                (
                                                    bestTrack[1].points /
                                                    bestTrack[1].races
                                                ).toFixed(
                                                    1
                                                )
                                            }{" "}
                                            avg pts
                                        </span>

                                    )}

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        📉 Worst Track
                                    </h3>

                                    <p className="small-stat">
                                        {
                                            worstTrack
                                                ? worstTrack[0]
                                                : "N/A"
                                        }
                                    </p>

                                    {worstTrack && (

                                        <span>
                                            {
                                                (
                                                    worstTrack[1].points /
                                                    worstTrack[1].races
                                                ).toFixed(
                                                    1
                                                )
                                            }{" "}
                                            avg pts
                                        </span>

                                    )}

                                </div>


                                <div className="stat-card">

                                    <h3>
                                        😤 Biggest Rival
                                    </h3>

                                    <p className="small-stat">
                                        {
                                            rival
                                                ? rival.opponent
                                                : "N/A"
                                        }
                                    </p>

                                    {rival && (

                                        <span>
                                            {
                                                rival.wins
                                            }
                                            -
                                            {
                                                rival.losses
                                            }
                                            -
                                            {
                                                rival.ties
                                            }{" "}
                                            GP record
                                        </span>

                                    )}

                                </div>

                            </div>

                        </div>

                    </div>

                );

            })()}

        </>

    );

}


export default Stats;