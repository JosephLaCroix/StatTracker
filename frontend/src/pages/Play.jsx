import {
    useEffect,
    useMemo,
    useState
} from "react";

import { Link } from "react-router";

import "../styles/play.css";


const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";


// =========================================
// MARIO KART TRACKS
// =========================================

const marioKartTracks = [

    {
        cup: "Mushroom Cup",
        tracks: [
            "Mario Kart Stadium",
            "Water Park",
            "Sweet Sweet Canyon",
            "Thwomp Ruins"
        ]
    },

    {
        cup: "Flower Cup",
        tracks: [
            "Mario Circuit",
            "Toad Harbor",
            "Twisted Mansion",
            "Shy Guy Falls"
        ]
    },

    {
        cup: "Star Cup",
        tracks: [
            "Sunshine Airport",
            "Dolphin Shoals",
            "Electrodrome",
            "Mount Wario"
        ]
    },

    {
        cup: "Special Cup",
        tracks: [
            "Cloudtop Cruise",
            "Bone-Dry Dunes",
            "Bowser's Castle",
            "Rainbow Road"
        ]
    },

    {
        cup: "Shell Cup",
        tracks: [
            "Wii Moo Moo Meadows",
            "GBA Mario Circuit",
            "DS Cheep Cheep Beach",
            "N64 Toad's Turnpike"
        ]
    },

    {
        cup: "Banana Cup",
        tracks: [
            "GCN Dry Dry Desert",
            "SNES Donut Plains 3",
            "N64 Royal Raceway",
            "3DS DK Jungle"
        ]
    },

    {
        cup: "Leaf Cup",
        tracks: [
            "DS Wario Stadium",
            "GBA Sherbet Land",
            "3DS Music Park",
            "N64 Yoshi Valley"
        ]
    },

    {
        cup: "Lightning Cup",
        tracks: [
            "DS Tick-Tock Clock",
            "3DS Piranha Plant Slide",
            "Wii Grumble Volcano",
            "N64 Rainbow Road"
        ]
    },

    {
        cup: "Egg Cup",
        tracks: [
            "Wii Yoshi Circuit",
            "Excitebike Arena",
            "Dragon Driftway",
            "Mute City"
        ]
    },

    {
        cup: "Triforce Cup",
        tracks: [
            "Wii Wario's Gold Mine",
            "SNES Rainbow Road",
            "Ice Ice Outpost",
            "Hyrule Circuit"
        ]
    },

    {
        cup: "Crossing Cup",
        tracks: [
            "GCN Baby Park",
            "GBA Cheese Land",
            "Wild Woods",
            "Animal Crossing"
        ]
    },

    {
        cup: "Bell Cup",
        tracks: [
            "3DS Neo Bowser City",
            "GBA Ribbon Road",
            "Super Bell Subway",
            "Big Blue"
        ]
    }

];


// =========================================
// POINT SYSTEM
// =========================================

const pointsByPlace = {

    1: 5,
    2: 3,
    3: 2,
    4: 1

};


// =========================================
// ODDS SETTINGS
// =========================================

const ODDS_WEIGHTS = {

    gpWinRate: 0.40,

    averageGPPoints: 0.30,

    raceWinRate: 0.20,

    recentForm: 0.10

};


const GP_PRIOR_STRENGTH = 3;

const RACE_PRIOR_STRENGTH = 12;

const RECENT_GP_COUNT = 5;


// =========================================
// EMPTY RACES
// =========================================

function createEmptyRaces() {

    return Array.from(
        { length: 4 },
        (_, index) => ({

            raceNumber:
                index + 1,

            track:
                "",

            trackPickerOpen:
                false,

            results:
                {},

            teamResults:
                {}

        })
    );

}


// =========================================
// PLAY COMPONENT
// =========================================

function Play() {

    // =========================================
    // DATA
    // =========================================

    const [
        players,
        setPlayers
    ] = useState([]);


    const [
        grandPrixHistory,
        setGrandPrixHistory
    ] = useState([]);


    const [
        selectedPlayerIds,
        setSelectedPlayerIds
    ] = useState([]);


    const [
        gameMode,
        setGameMode
    ] = useState("individual");


    const [
        teamAssignments,
        setTeamAssignments
    ] = useState({});


    const [
        activeGrandPrixPlayers,
        setActiveGrandPrixPlayers
    ] = useState([]);


    const [
        grandPrixName,
        setGrandPrixName
    ] = useState("");


    const [
        races,
        setRaces
    ] = useState(
        createEmptyRaces()
    );


    const [
        grandPrixStarted,
        setGrandPrixStarted
    ] = useState(false);


    const [
        finalResults,
        setFinalResults
    ] = useState(null);


    const [
        finalTeamResults,
        setFinalTeamResults
    ] = useState(null);


    const [
        loadingPlayers,
        setLoadingPlayers
    ] = useState(true);


    const [
        saving,
        setSaving
    ] = useState(false);


    const [
        pageMessage,
        setPageMessage
    ] = useState("");


    // =========================================
    // LOAD DATA
    // =========================================

    useEffect(() => {

        loadPlayers();

        loadGrandPrixHistory();

    }, []);


    async function loadPlayers() {

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/players`
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to load players"
                );

            }


            const data =
                await response.json();


            setPlayers(data);


        } catch (error) {

            console.error(
                "Error loading players:",
                error
            );


            setPageMessage(
                "Could not load players."
            );


        } finally {

            setLoadingPlayers(false);

        }

    }


    async function loadGrandPrixHistory() {

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/grand-prix`
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to load Grand Prix history"
                );

            }


            const data =
                await response.json();


            setGrandPrixHistory(data);


        } catch (error) {

            console.error(
                "Could not load history for odds:",
                error
            );


            setGrandPrixHistory([]);

        }

    }


    // =========================================
    // PLAYER SELECTION
    // =========================================

    function togglePlayer(playerId) {

        setPageMessage("");


        setSelectedPlayerIds(
            currentIds => {

                if (
                    currentIds.includes(
                        playerId
                    )
                ) {

                    setTeamAssignments(
                        current => {
                            const updated = { ...current };
                            delete updated[playerId];
                            return updated;
                        }
                    );

                    return currentIds.filter(
                        id =>
                            id !== playerId
                    );

                }


                const maxPlayers =
                    gameMode === "teams"
                        ? 8
                        : 4;


                if (
                    currentIds.length >= maxPlayers
                ) {

                    setPageMessage(
                        gameMode === "teams"
                            ? "Team Mode supports 4, 6, or 8 players."
                            : "You can select a maximum of 4 players."
                    );

                    return currentIds;

                }


                return [
                    ...currentIds,
                    playerId
                ];

            }
        );

    }


    // =========================================
    // GAME MODE / TEAM SETUP
    // =========================================

    function changeGameMode(mode) {

        setGameMode(mode);
        setSelectedPlayerIds([]);
        setTeamAssignments({});
        setPageMessage("");

    }


    function assignPlayerToTeam(
        playerId,
        teamNumber
    ) {

        setTeamAssignments(
            current => ({
                ...current,
                [playerId]: Number(teamNumber)
            })
        );

    }


    function randomizeTeams() {

        const playerCount =
            selectedPlayerIds.length;


        if (
            playerCount < 4 ||
            playerCount > 8 ||
            playerCount % 2 !== 0
        ) {

            setPageMessage(
                "Team Mode needs 4, 6, or 8 players before randomizing teams."
            );

            return;

        }


        const shuffled =
            [...selectedPlayerIds]
                .sort(() => Math.random() - 0.5);


        const randomizedAssignments = {};


        shuffled.forEach(
            (playerId, index) => {

                randomizedAssignments[playerId] =
                    Math.floor(index / 2) + 1;

            }
        );


        setTeamAssignments(
            randomizedAssignments
        );

        setPageMessage("");

    }


    // =========================================
    // START GRAND PRIX
    // =========================================

    async function startGrandPrix() {

        setPageMessage("");


        if (gameMode === "teams") {

            const playerCount =
                selectedPlayerIds.length;


            if (
                playerCount < 4 ||
                playerCount > 8 ||
                playerCount % 2 !== 0
            ) {

                setPageMessage(
                    "Team Mode requires 4, 6, or 8 players."
                );

                return;

            }


            const teamCount =
                playerCount / 2;


            const teamCounts =
                Object.fromEntries(
                    Array.from(
                        { length: teamCount },
                        (_, index) => [
                            index + 1,
                            0
                        ]
                    )
                );


            selectedPlayerIds.forEach(
                playerId => {

                    const teamNumber =
                        Number(
                            teamAssignments[
                                playerId
                            ]
                        );


                    if (
                        teamCounts[
                            teamNumber
                        ] !== undefined
                    ) {

                        teamCounts[
                            teamNumber
                        ]++;

                    }

                }
            );


            const teamsAreValid =
                Object.values(
                    teamCounts
                ).every(
                    count =>
                        count === 2
                );


            if (!teamsAreValid) {

                setPageMessage(
                    `Assign exactly 2 players to each of the ${teamCount} teams.`
                );

                return;

            }

        } else {

            if (selectedPlayerIds.length < 2) {

                setPageMessage(
                    "Select at least 2 players."
                );

                return;

            }


            if (selectedPlayerIds.length > 4) {

                setPageMessage(
                    "Select 4 players or fewer."
                );

                return;

            }

        }


        const selected =
            players.filter(
                player =>
                    selectedPlayerIds.includes(
                        player.playerId
                    )
            );


        await loadGrandPrixHistory();


        setActiveGrandPrixPlayers(
            selected
        );


        setRaces(
            createEmptyRaces()
        );


        setGrandPrixStarted(true);

        setFinalResults(null);

        setFinalTeamResults(null);

    }


    // =========================================
    // HISTORICAL PLAYER MATCHING
    // =========================================

    function recordMatchesPlayer(
        record,
        player
    ) {

        if (!record) {

            return false;

        }


        if (
            record.playerId !==
                undefined &&
            record.playerId !==
                null
        ) {

            return (
                Number(
                    record.playerId
                ) ===
                Number(
                    player.playerId
                )
            );

        }


        const recordName =
            record.playerNameAtTime ||
            record.playerName ||
            record.name;


        return (
            recordName ===
            player.name
        );

    }


    // =========================================
    // NEUTRAL GP POINTS
    // =========================================

    function getNeutralAverageGPPoints(
        playerCount
    ) {

        const availablePoints = [];


        for (
            let place = 1;
            place <= playerCount;
            place++
        ) {

            availablePoints.push(
                pointsByPlace[place] ||
                0
            );

        }


        const averagePointsPerRace =
            availablePoints.reduce(
                (sum, points) =>
                    sum + points,
                0
            ) /
            availablePoints.length;


        return (
            averagePointsPerRace *
            4
        );

    }


    // =========================================
    // ODDS HISTORICAL STATS
    // =========================================

    function getPlayerOddsStats(
        player
    ) {

        let gpPlayed = 0;

        let gpWins = 0;

        let totalGPPoints = 0;

        let totalRaces = 0;

        let raceWins = 0;


        const recentGrandPrix = [];


        grandPrixHistory.forEach(
            gp => {

                const standings =
                    gp.finalStandings ||
                    [];


                const standingIndex =
                    standings.findIndex(
                        standing =>
                            recordMatchesPlayer(
                                standing,
                                player
                            )
                    );


                if (
                    standingIndex !== -1
                ) {

                    const standing =
                        standings[
                            standingIndex
                        ];


                    gpPlayed++;


                    totalGPPoints +=
                        Number(
                            standing.points ||
                            0
                        );


                    if (
                        standingIndex === 0
                    ) {

                        gpWins++;

                    }


                    recentGrandPrix.push({

                        date:
                            new Date(
                                gp.datePlayed ||
                                gp.createdAt ||
                                0
                            ).getTime(),

                        points:
                            Number(
                                standing.points ||
                                0
                            )

                    });

                }


                (gp.races || [])
                    .forEach(
                        race => {

                            const result =
                                (
                                    race.results ||
                                    []
                                ).find(
                                    result =>
                                        recordMatchesPlayer(
                                            result,
                                            player
                                        )
                                );


                            if (!result) {

                                return;

                            }


                            totalRaces++;


                            if (
                                Number(
                                    result.placement
                                ) === 1
                            ) {

                                raceWins++;

                            }

                        }
                    );

            }
        );


        recentGrandPrix.sort(
            (a, b) =>
                b.date -
                a.date
        );


        const latestResults =
            recentGrandPrix.slice(
                0,
                RECENT_GP_COUNT
            );


        const recentPoints =
            latestResults.reduce(
                (sum, gp) =>
                    sum +
                    gp.points,
                0
            );


        return {

            gpPlayed,

            gpWins,

            totalGPPoints,

            totalRaces,

            raceWins,

            recentGames:
                latestResults.length,

            recentPoints

        };

    }


    // =========================================
    // PLAYER POWER FOR ODDS
    // =========================================

    function calculatePlayerPowerRating(
        player,
        playerCount
    ) {

        const stats =
            getPlayerOddsStats(
                player
            );


        const neutralWinRate =
            1 /
            playerCount;


        const neutralGPPoints =
            getNeutralAverageGPPoints(
                playerCount
            );


        // =====================================
        // SMOOTHED GP WIN RATE
        // =====================================

        const smoothedGPWinRate =

            (
                stats.gpWins +

                (
                    neutralWinRate *
                    GP_PRIOR_STRENGTH
                )
            )

            /

            (
                stats.gpPlayed +
                GP_PRIOR_STRENGTH
            );


        // =====================================
        // SMOOTHED AVG GP POINTS
        // =====================================

        const smoothedAverageGPPoints =

            (
                stats.totalGPPoints +

                (
                    neutralGPPoints *
                    GP_PRIOR_STRENGTH
                )
            )

            /

            (
                stats.gpPlayed +
                GP_PRIOR_STRENGTH
            );


        const normalizedGPPoints =
            Math.min(
                smoothedAverageGPPoints /
                20,
                1
            );


        // =====================================
        // SMOOTHED RACE WIN RATE
        // =====================================

        const smoothedRaceWinRate =

            (
                stats.raceWins +

                (
                    neutralWinRate *
                    RACE_PRIOR_STRENGTH
                )
            )

            /

            (
                stats.totalRaces +
                RACE_PRIOR_STRENGTH
            );


        // =====================================
        // RECENT FORM
        // =====================================

        const recentPriorGames = 2;


        const smoothedRecentPoints =

            (
                stats.recentPoints +

                (
                    neutralGPPoints *
                    recentPriorGames
                )
            )

            /

            (
                stats.recentGames +
                recentPriorGames
            );


        const normalizedRecentForm =
            Math.min(
                smoothedRecentPoints /
                20,
                1
            );


        // =====================================
        // FINAL POWER
        // =====================================

        const powerRating =

            (
                smoothedGPWinRate *
                ODDS_WEIGHTS.gpWinRate
            )

            +

            (
                normalizedGPPoints *
                ODDS_WEIGHTS.averageGPPoints
            )

            +

            (
                smoothedRaceWinRate *
                ODDS_WEIGHTS.raceWinRate
            )

            +

            (
                normalizedRecentForm *
                ODDS_WEIGHTS.recentForm
            );


        return {

            player,

            powerRating,

            stats

        };

    }


    // =========================================
    // AMERICAN ODDS
    // =========================================

    function probabilityToAmericanOdds(
        probability
    ) {

        if (
            probability <= 0 ||
            probability >= 1
        ) {

            return "N/A";

        }


        let odds;


        if (
            probability > 0.5
        ) {

            odds =
                -100 *
                probability /
                (
                    1 -
                    probability
                );

        } else {

            odds =
                100 *
                (
                    1 -
                    probability
                ) /
                probability;

        }


        odds =
            Math.round(
                odds / 5
            ) * 5;


        if (
            odds === -100
        ) {

            return "+100";

        }


        if (
            odds > 0
        ) {

            return `+${odds}`;

        }


        return `${odds}`;

    }


    // =========================================
    // CALCULATED ODDS
    // =========================================

    const grandPrixOdds =
        useMemo(
            () => {

                if (
                    !activeGrandPrixPlayers.length
                ) {

                    return [];

                }


                const playerCount =
                    activeGrandPrixPlayers.length;

                const ODDS_SHARPNESS =
                    1.25;


                if (gameMode === "teams") {

                    const teamCount =
                        playerCount / 2;


                    const teamRatings =
                        Array.from(
                            { length: teamCount },
                            (_, index) => {

                                const teamNumber =
                                    index + 1;


                                const teamPlayers =
                                    activeGrandPrixPlayers.filter(
                                        player =>
                                            teamAssignments[
                                                player.playerId
                                            ] ===
                                            teamNumber
                                    );


                                const memberRatings =
                                    teamPlayers.map(
                                        player =>
                                            calculatePlayerPowerRating(
                                                player,
                                                playerCount
                                            ).powerRating
                                    );


                                const powerRating =
                                    memberRatings.length
                                        ? memberRatings.reduce(
                                            (sum, rating) =>
                                                sum + rating,
                                            0
                                        ) /
                                        memberRatings.length
                                        : 0.0001;


                                return {

                                    teamNumber,

                                    teamName:
                                        `Team ${teamNumber}`,

                                    players:
                                        teamPlayers,

                                    powerRating,

                                    adjustedRating:
                                        Math.pow(
                                            Math.max(
                                                powerRating,
                                                0.0001
                                            ),
                                            ODDS_SHARPNESS
                                        )

                                };

                            }
                        );


                    const totalRating =
                        teamRatings.reduce(
                            (sum, team) =>
                                sum +
                                team.adjustedRating,
                            0
                        );


                    return teamRatings
                        .map(
                            team => {

                                const probability =
                                    totalRating > 0
                                        ? team.adjustedRating /
                                            totalRating
                                        : 1 /
                                            teamCount;


                                return {

                                    ...team,

                                    probability,

                                    americanOdds:
                                        probabilityToAmericanOdds(
                                            probability
                                        )

                                };

                            }
                        )
                        .sort(
                            (a, b) =>
                                b.probability -
                                a.probability
                        );

                }


                const ratings =
                    activeGrandPrixPlayers.map(
                        player =>
                            calculatePlayerPowerRating(
                                player,
                                playerCount
                            )
                    );


                const adjustedRatings =
                    ratings.map(
                        rating => ({

                            ...rating,

                            adjustedRating:
                                Math.pow(
                                    Math.max(
                                        rating.powerRating,
                                        0.0001
                                    ),
                                    ODDS_SHARPNESS
                                )

                        })
                    );


                const totalRating =
                    adjustedRatings.reduce(
                        (
                            sum,
                            rating
                        ) =>
                            sum +
                            rating.adjustedRating,
                        0
                    );


                return adjustedRatings
                    .map(
                        rating => {

                            const probability =
                                totalRating > 0
                                    ? rating.adjustedRating /
                                        totalRating
                                    : 1 /
                                        playerCount;


                            return {

                                ...rating,

                                probability,

                                americanOdds:
                                    probabilityToAmericanOdds(
                                        probability
                                    )

                            };

                        }
                    )
                    .sort(
                        (a, b) =>
                            b.probability -
                            a.probability
                    );

            },

            [
                activeGrandPrixPlayers,
                grandPrixHistory,
                gameMode,
                teamAssignments
            ]
        );


    function getOddsLabel(
        index,
        totalPlayers
    ) {

        if (
            index === 0
        ) {

            return "Favorite";

        }


        if (
            index ===
                totalPlayers - 1 &&
            totalPlayers > 2
        ) {

            return "Underdog";

        }


        return "Contender";

    }


    // =========================================
    // TRACK PICKER
    // =========================================

    function toggleTrackPicker(
        raceNumber
    ) {

        setRaces(
            currentRaces =>
                currentRaces.map(
                    race => {

                        if (
                            race.raceNumber ===
                            raceNumber
                        ) {

                            return {

                                ...race,

                                trackPickerOpen:
                                    !race
                                        .trackPickerOpen

                            };

                        }


                        return race;

                    }
                )
        );

    }


    function selectTrack(
        raceNumber,
        track
    ) {

        setRaces(
            currentRaces =>
                currentRaces.map(
                    race => {

                        if (
                            race.raceNumber !==
                            raceNumber
                        ) {

                            return race;

                        }


                        return {

                            ...race,

                            track,

                            trackPickerOpen:
                                false

                        };

                    }
                )
        );

    }


    // =========================================
    // PLACEMENT CHANGE
    // =========================================

    function updatePlacement(
        raceNumber,
        playerId,
        placement
    ) {

        setRaces(
            currentRaces =>
                currentRaces.map(
                    race => {

                        if (
                            race.raceNumber !==
                            raceNumber
                        ) {

                            return race;

                        }


                        return {

                            ...race,

                            results: {

                                ...race.results,

                                [playerId]: {

                                    ...race.results[
                                        playerId
                                    ],

                                    placement:
                                        placement
                                            ?
                                            Number(
                                                placement
                                            )
                                            :
                                            ""

                                }

                            }

                        };

                    }
                )
        );

    }


    // =========================================
    // NOTE / TIME CHANGE
    // =========================================

    function updateNote(
        raceNumber,
        playerId,
        note
    ) {

        setRaces(
            currentRaces =>
                currentRaces.map(
                    race => {

                        if (
                            race.raceNumber !==
                            raceNumber
                        ) {

                            return race;

                        }


                        return {

                            ...race,

                            results: {

                                ...race.results,

                                [playerId]: {

                                    ...race.results[
                                        playerId
                                    ],

                                    note

                                }

                            }

                        };

                    }
                )
        );

    }


    // =========================================
    // CHECK IF PLACEMENT IS USED
    // =========================================

    function placementAlreadyUsed(
        race,
        playerId,
        placement
    ) {

        return Object.entries(
            race.results
        ).some(
            (
                [
                    otherPlayerId,
                    result
                ]
            ) => {

                return (

                    Number(
                        otherPlayerId
                    ) !==
                    Number(
                        playerId
                    )

                    &&

                    Number(
                        result?.placement
                    ) ===
                    Number(
                        placement
                    )

                );

            }
        );

    }


    // =========================================
    // TEAM RACE RESULTS
    // =========================================

    function updateTeamPlacement(
        raceNumber,
        teamNumber,
        placement
    ) {

        setRaces(
            currentRaces =>
                currentRaces.map(
                    race => {

                        if (
                            race.raceNumber !==
                            raceNumber
                        ) {

                            return race;

                        }


                        return {

                            ...race,

                            teamResults: {

                                ...race.teamResults,

                                [teamNumber]: {

                                    ...race.teamResults[
                                        teamNumber
                                    ],

                                    placement:
                                        placement
                                            ? Number(
                                                placement
                                            )
                                            : ""

                                }

                            }

                        };

                    }
                )
        );

    }


    function updateTeamNote(
        raceNumber,
        teamNumber,
        note
    ) {

        setRaces(
            currentRaces =>
                currentRaces.map(
                    race => {

                        if (
                            race.raceNumber !==
                            raceNumber
                        ) {

                            return race;

                        }


                        return {

                            ...race,

                            teamResults: {

                                ...race.teamResults,

                                [teamNumber]: {

                                    ...race.teamResults[
                                        teamNumber
                                    ],

                                    note

                                }

                            }

                        };

                    }
                )
        );

    }


    function teamPlacementAlreadyUsed(
        race,
        teamNumber,
        placement
    ) {

        return Object.entries(
            race.teamResults || {}
        ).some(
            (
                [
                    otherTeamNumber,
                    result
                ]
            ) => {

                return (

                    Number(
                        otherTeamNumber
                    ) !==
                    Number(
                        teamNumber
                    )

                    &&

                    Number(
                        result?.placement
                    ) ===
                    Number(
                        placement
                    )

                );

            }
        );

    }


    // =========================================
    // LIVE SCOREBOARD
    // =========================================

    const currentStandings =
        useMemo(
            () => {

                if (gameMode === "teams") {
                    return [];
                }


                const scores = {};


                activeGrandPrixPlayers
                    .forEach(
                        player => {

                            scores[
                                player.playerId
                            ] = {

                                playerId:
                                    player.playerId,

                                playerNameAtTime:
                                    player.name,

                                profileImageAtTime:
                                    player.profileImage,

                                points:
                                    0

                            };

                        }
                    );


                races.forEach(
                    race => {

                        Object.entries(
                            race.results
                        ).forEach(
                            (
                                [
                                    playerId,
                                    result
                                ]
                            ) => {

                                const placement =
                                    Number(
                                        result?.placement
                                    );


                                if (
                                    placement &&
                                    scores[
                                        playerId
                                    ]
                                ) {

                                    scores[
                                        playerId
                                    ].points +=
                                        pointsByPlace[
                                            placement
                                        ] || 0;

                                }

                            }
                        );

                    }
                );


                return Object
                    .values(
                        scores
                    )
                    .sort(
                        (a, b) =>
                            b.points -
                            a.points
                    );

            },

            [
                activeGrandPrixPlayers,
                races,
                gameMode
            ]
        );


    const currentTeamStandings =
        useMemo(
            () => {

                if (gameMode !== "teams") {
                    return [];
                }


                const teamCount =
                    activeGrandPrixPlayers.length /
                    2;


                const teamScores =
                    Array.from(
                        { length: teamCount },
                        (_, index) => {

                            const teamNumber =
                                index + 1;


                            const teamPlayers =
                                activeGrandPrixPlayers.filter(
                                    player =>
                                        teamAssignments[
                                            player.playerId
                                        ] ===
                                        teamNumber
                                );


                            let points = 0;


                            races.forEach(
                                race => {

                                    const result =
                                        race.teamResults?.[
                                            teamNumber
                                        ];


                                    const placement =
                                        Number(
                                            result?.placement
                                        );


                                    if (placement) {

                                        points +=
                                            pointsByPlace[
                                                placement
                                            ] || 0;

                                    }

                                }
                            );


                            return {

                                teamNumber,

                                teamName:
                                    `Team ${teamNumber}`,

                                points,

                                players:
                                    teamPlayers.map(
                                        player => ({

                                            playerId:
                                                player.playerId,

                                            playerNameAtTime:
                                                player.name,

                                            profileImageAtTime:
                                                player.profileImage

                                        })
                                    )

                            };

                        }
                    );


                return teamScores.sort(
                    (a, b) =>
                        b.points -
                        a.points
                );

            },

            [
                gameMode,
                activeGrandPrixPlayers,
                teamAssignments,
                races
            ]
        );


    const totalBeers =
        activeGrandPrixPlayers.length *
        (gameMode === "teams" ? 1 : 2);


    // =========================================
    // BUILD GRAND PRIX DATA
    // =========================================

    function buildGrandPrixData() {

        const finalScores =
            gameMode === "individual"
                ? currentStandings
                : [];


        const teamCount =
            gameMode === "teams"
                ? activeGrandPrixPlayers.length /
                    2
                : 0;


        return {

            grandPrixName:
                grandPrixName.trim() ||
                "Untitled Grand Prix",

            datePlayed:
                new Date()
                    .toISOString(),

            gameMode,

            winner:
                gameMode === "individual"
                    ? finalScores[0]
                    : undefined,

            winningTeam:
                gameMode === "teams"
                    ? currentTeamStandings[0]
                    : undefined,

            totalPlayers:
                activeGrandPrixPlayers
                    .length,

            players:
                activeGrandPrixPlayers.map(
                    player => ({

                        playerId:
                            player.playerId,

                        playerNameAtTime:
                            player.name,

                        profileImageAtTime:
                            player.profileImage,

                        teamNumber:
                            gameMode === "teams"
                                ? teamAssignments[
                                    player.playerId
                                ]
                                : undefined

                    })
                ),

            teams:
                gameMode === "teams"
                    ? currentTeamStandings
                    : [],

            finalTeamStandings:
                gameMode === "teams"
                    ? currentTeamStandings
                    : [],

            races:
                races.map(
                    race => {

                        if (
                            gameMode === "teams"
                        ) {

                            return {

                                raceNumber:
                                    race.raceNumber,

                                track:
                                    race.track.trim(),

                                results: [],

                                teamResults:
                                    Array.from(
                                        { length: teamCount },
                                        (_, index) => {

                                            const teamNumber =
                                                index + 1;


                                            const result =
                                                race.teamResults?.[
                                                    teamNumber
                                                ] ||
                                                {};


                                            const placement =
                                                Number(
                                                    result.placement
                                                );


                                            return {

                                                teamNumber,

                                                teamName:
                                                    `Team ${teamNumber}`,

                                                placement,

                                                points:
                                                    pointsByPlace[
                                                        placement
                                                    ] || 0,

                                                note:
                                                    result.note ||
                                                    "",

                                                players:
                                                    activeGrandPrixPlayers
                                                        .filter(
                                                            player =>
                                                                teamAssignments[
                                                                    player.playerId
                                                                ] ===
                                                                teamNumber
                                                        )
                                                        .map(
                                                            player => ({

                                                                playerId:
                                                                    player.playerId,

                                                                playerNameAtTime:
                                                                    player.name,

                                                                profileImageAtTime:
                                                                    player.profileImage

                                                            })
                                                        )

                                            };

                                        }
                                    )

                            };

                        }


                        return {

                            raceNumber:
                                race.raceNumber,

                            track:
                                race.track.trim(),

                            results:
                                activeGrandPrixPlayers
                                    .map(
                                        player => {

                                            const result =
                                                race.results[
                                                    player.playerId
                                                ] ||
                                                {};


                                            const placement =
                                                Number(
                                                    result.placement
                                                );


                                            return {

                                                playerId:
                                                    player.playerId,

                                                playerNameAtTime:
                                                    player.name,

                                                profileImageAtTime:
                                                    player.profileImage,

                                                placement,

                                                points:
                                                    pointsByPlace[
                                                        placement
                                                    ] || 0,

                                                note:
                                                    result.note ||
                                                    ""

                                            };

                                        }
                                    ),

                            teamResults: []

                        };

                    }
                ),

            finalStandings:
                finalScores

        };

    }


    // =========================================
    // VALIDATE GRAND PRIX
    // =========================================

    function validateGrandPrix() {

        const teamCount =
            gameMode === "teams"
                ? activeGrandPrixPlayers.length /
                    2
                : 0;


        for (
            const race of races
        ) {

            if (
                !race.track
            ) {

                setPageMessage(
                    `Pick a track for Race ${race.raceNumber}.`
                );

                return false;

            }


            if (gameMode === "teams") {

                for (
                    let teamNumber = 1;
                    teamNumber <= teamCount;
                    teamNumber++
                ) {

                    const placement =
                        race.teamResults?.[
                            teamNumber
                        ]?.placement;


                    if (!placement) {

                        setPageMessage(
                            `Enter every team placement for Race ${race.raceNumber}.`
                        );

                        return false;

                    }

                }

            } else {

                for (
                    const player of
                    activeGrandPrixPlayers
                ) {

                    const placement =
                        race.results[
                            player.playerId
                        ]?.placement;


                    if (!placement) {

                        setPageMessage(
                            `Enter every placement for Race ${race.raceNumber}.`
                        );

                        return false;

                    }

                }

            }

        }


        return true;

    }


    // =========================================
    // SAVE GRAND PRIX
    // =========================================

    async function saveGrandPrixToDatabase(
        raceData
    ) {

        const response =
            await fetch(
                `${API_BASE_URL}/api/grand-prix`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            raceData
                        )

                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "Failed to save Grand Prix"
            );

        }


        return (
            await response.json()
        );

    }


    // =========================================
    // SUBMIT
    // =========================================

    async function handleSubmit(
        event
    ) {

        event.preventDefault();


        setPageMessage("");


        if (
            !validateGrandPrix()
        ) {

            return;

        }


        const raceData =
            buildGrandPrixData();


        try {

            setSaving(true);


            const savedGrandPrix =
                await saveGrandPrixToDatabase(
                    raceData
                );


            console.log(
                "Saved to MongoDB:",
                savedGrandPrix
            );


            setFinalResults(
                raceData.finalStandings
            );

            setFinalTeamResults(
                gameMode === "teams"
                    ? raceData.finalTeamStandings
                    : null
            );


            setGrandPrixStarted(
                false
            );


            await loadGrandPrixHistory();


        } catch (error) {

            console.error(
                "Error saving Grand Prix:",
                error
            );


            setPageMessage(
                "Grand Prix could not be saved."
            );


        } finally {

            setSaving(false);

        }

    }


    // =========================================
    // START NEW GRAND PRIX
    // =========================================

    function startNewGrandPrix() {

        setSelectedPlayerIds([]);

        setTeamAssignments({});

        setGameMode("individual");

        setActiveGrandPrixPlayers([]);

        setGrandPrixName("");

        setRaces(
            createEmptyRaces()
        );

        setGrandPrixStarted(false);

        setFinalResults(null);

        setFinalTeamResults(null);

        setPageMessage("");

    }


    // =========================================
    // JSX
    // =========================================

    return (

        <>

            {/* =====================================
                HEADER
            ====================================== */}

            <header className="page-header">

                <Link
                    to="/"
                    className="home-link"
                >
                    ← Home
                </Link>


                <h1>
                    🏎️ Grand Prix 🏎️
                </h1>

            </header>


            <main className="play-container">


                {/* =================================
                    PAGE MESSAGE
                ================================== */}

                {pageMessage && (

                    <div
                        style={{
                            marginBottom: "20px",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            background:
                                "rgba(230,57,70,0.22)",
                            border:
                                "1px solid rgba(255,255,255,0.2)",
                            textAlign: "center"
                        }}
                    >
                        {pageMessage}
                    </div>

                )}


                {/* =================================
                    PLAYER SELECTION
                ================================== */}

                {!finalResults && (

                    <section className="card">

                        <div className="game-mode-section">

                            <span className="game-mode-label">
                                🏁 Select Game Mode
                            </span>

                            <div className="game-mode-buttons">

                                <button
                                    type="button"
                                    className={`game-mode-btn ${
                                        gameMode === "individual"
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        changeGameMode("individual")
                                    }
                                >
                                    👤 Individual
                                </button>

                                <button
                                    type="button"
                                    className={`game-mode-btn ${
                                        gameMode === "teams"
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        changeGameMode("teams")
                                    }
                                >
                                    👥 Teams
                                </button>

                            </div>

                            <p className="game-mode-description">
                                {gameMode === "teams"
                                    ? "4–8 players • teams of 2 • 1 beer each"
                                    : "2–4 players • 2 beers each"}
                            </p>

                        </div>


                        <h2>
                            Select Players
                        </h2>


                        {loadingPlayers ? (

                            <p>
                                Loading players...
                            </p>

                        ) : (

                            <div
                                id="player-list"
                                className="player-grid"
                            >

                                {players.map(
                                    player => {

                                        const checked =
                                            selectedPlayerIds
                                                .includes(
                                                    player.playerId
                                                );


                                        return (

                                            <label
                                                className="player-card"
                                                key={
                                                    player._id ||
                                                    player.playerId
                                                }
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        checked
                                                    }
                                                    onChange={() =>
                                                        togglePlayer(
                                                            player.playerId
                                                        )
                                                    }
                                                />


                                                <img
                                                    src={`/images/characters/${player.profileImage}`}
                                                    alt={
                                                        player.name
                                                    }
                                                    className="player-profile-image"
                                                />


                                                <span className="player-name-label">
                                                    {
                                                        player.name
                                                    }
                                                </span>

                                            </label>

                                        );

                                    }
                                )}

                            </div>

                        )}


                        {gameMode === "teams" &&
                            selectedPlayerIds.length > 0 && (

                            <div className="team-setup">

                                <div className="team-setup-header">
                                    <div>
                                        <h3>👥 Create Teams</h3>
                                        <p>Put exactly 2 players on each team.</p>
                                    </div>

                                    <button
                                        type="button"
                                        className="randomize-teams-btn"
                                        onClick={randomizeTeams}
                                    >
                                        🎲 Randomize Teams
                                    </button>
                                </div>

                                <div className="team-assignment-grid">

                                    {players
                                        .filter(player =>
                                            selectedPlayerIds.includes(
                                                player.playerId
                                            )
                                        )
                                        .map(player => (

                                            <div
                                                className="team-assignment-row"
                                                key={player.playerId}
                                            >
                                                <div className="team-assignment-player">
                                                    <img
                                                        src={`/images/characters/${player.profileImage}`}
                                                        alt={player.name}
                                                        className="team-player-image"
                                                    />
                                                    <strong>{player.name}</strong>
                                                </div>

                                                <select
                                                    value={
                                                        teamAssignments[
                                                            player.playerId
                                                        ] || ""
                                                    }
                                                    onChange={event =>
                                                        assignPlayerToTeam(
                                                            player.playerId,
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Choose Team
                                                    </option>
                                                    {Array.from(
                                                        {
                                                            length:
                                                                Math.min(
                                                                    4,
                                                                    Math.ceil(
                                                                        selectedPlayerIds.length /
                                                                        2
                                                                    )
                                                                )
                                                        },
                                                        (_, index) => (
                                                            <option
                                                                key={
                                                                    index + 1
                                                                }
                                                                value={
                                                                    index + 1
                                                                }
                                                            >
                                                                Team {index + 1}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>

                                        ))}

                                </div>

                            </div>

                        )}


                        <button
                            type="button"
                            id="start-grand-prix-btn"
                            onClick={
                                startGrandPrix
                            }
                            disabled={
                                loadingPlayers
                            }
                        >
                            Start Grand Prix
                        </button>

                    </section>

                )}


                {/* =================================
                    GRAND PRIX
                ================================== */}

                {grandPrixStarted && (

                    <section
                        id="grand-prix-section"
                        className="card"
                    >

                        <h2>
                            Enter Race Results
                        </h2>


                        <form
                            id="grand-prix-form"
                            onSubmit={
                                handleSubmit
                            }
                        >


                            {/* GP NAME */}

                            <label
                                htmlFor="grand-prix-name"
                            >
                                Grand Prix Name
                            </label>


                            <input
                                type="text"
                                id="grand-prix-name"
                                placeholder="Ex: Tavern Pregame"
                                value={
                                    grandPrixName
                                }
                                onChange={
                                    event =>
                                        setGrandPrixName(
                                            event.target.value
                                        )
                                }
                            />


                            {/* =========================
                                ODDS
                            ========================== */}

                            <section
                                id="grand-prix-odds"
                                className="grand-prix-odds"
                            >

                                <div className="odds-header">

                                    <h2>
                                        🎰 Grand Prix Odds
                                    </h2>

                                    <p>
                                        Estimated chance to win based on previous performance
                                    </p>

                                </div>


                                <div
                                    id="odds-list"
                                    className="odds-list"
                                >

                                    {grandPrixOdds.map(
                                        (
                                            entry,
                                            index
                                        ) => {

                                            const chance =
                                                (
                                                    entry.probability *
                                                    100
                                                ).toFixed(
                                                    1
                                                );


                                            const label =
                                                getOddsLabel(
                                                    index,
                                                    grandPrixOdds
                                                        .length
                                                );


                                            return (

                                                <div
                                                    className={
                                                        `odds-card ${
                                                            index === 0
                                                                ?
                                                                "odds-favorite"
                                                                :
                                                                ""
                                                        }`
                                                    }
                                                    key={
                                                        gameMode === "teams"
                                                            ? `team-${entry.teamNumber}`
                                                            : entry.player.playerId
                                                    }
                                                >

                                                    <div className="odds-player">

                                                        {gameMode === "teams" ? (

                                                            <div className="odds-player-info">

                                                                <strong>
                                                                    {entry.teamName}
                                                                </strong>

                                                                <span>
                                                                    {entry.players
                                                                        .map(
                                                                            player =>
                                                                                player.name
                                                                        )
                                                                        .join(" + ")}
                                                                </span>

                                                                <span className="odds-label">
                                                                    {label}
                                                                </span>

                                                            </div>

                                                        ) : (

                                                            <>

                                                                <img
                                                                    src={`/images/characters/${entry.player.profileImage}`}
                                                                    alt={
                                                                        entry.player
                                                                            .name
                                                                    }
                                                                    className="odds-player-image"
                                                                />


                                                                <div className="odds-player-info">

                                                                    <strong>
                                                                        {
                                                                            entry.player
                                                                                .name
                                                                        }
                                                                    </strong>

                                                                    <span className="odds-label">
                                                                        {
                                                                            label
                                                                        }
                                                                    </span>

                                                                </div>

                                                            </>

                                                        )}

                                                    </div>


                                                    <div className="odds-numbers">

                                                        <span className="american-odds">
                                                            {
                                                                entry
                                                                    .americanOdds
                                                            }
                                                        </span>

                                                        <span className="win-probability">
                                                            {
                                                                chance
                                                            }% chance
                                                        </span>

                                                    </div>

                                                </div>

                                            );

                                        }
                                    )}

                                </div>

                            </section>


                            {/* =========================
                                RACES
                            ========================== */}

                            <div id="races-container">

                                {races.map(
                                    race => (

                                        <div
                                            className="race-card"
                                            key={
                                                race.raceNumber
                                            }
                                        >

                                            <h3>
                                                Race {
                                                    race.raceNumber
                                                }
                                            </h3>


                                            <label>
                                                Track Name
                                            </label>


                                            <button
                                                type="button"
                                                className="track-picker-btn"
                                                onClick={() =>
                                                    toggleTrackPicker(
                                                        race.raceNumber
                                                    )
                                                }
                                            >

                                                <span>
                                                    {
                                                        race.track ||
                                                        "Pick a track"
                                                    }
                                                </span>

                                                <span>
                                                    🏁
                                                </span>

                                            </button>


                                            {race.trackPickerOpen && (

                                                <div className="track-picker">

                                                    {marioKartTracks.map(
                                                        cup => (

                                                            <div
                                                                className="track-cup"
                                                                key={
                                                                    cup.cup
                                                                }
                                                            >

                                                                <h4>
                                                                    {
                                                                        cup.cup
                                                                    }
                                                                </h4>


                                                                <div className="track-grid">

                                                                    {cup.tracks.map(
                                                                        track => (

                                                                            <button
                                                                                type="button"
                                                                                className={
                                                                                    `track-option ${
                                                                                        race.track ===
                                                                                        track
                                                                                            ?
                                                                                            "selected"
                                                                                            :
                                                                                            ""
                                                                                    }`
                                                                                }
                                                                                key={
                                                                                    track
                                                                                }
                                                                                onClick={() =>
                                                                                    selectTrack(
                                                                                        race.raceNumber,
                                                                                        track
                                                                                    )
                                                                                }
                                                                            >
                                                                                {
                                                                                    track
                                                                                }
                                                                            </button>

                                                                        )
                                                                    )}

                                                                </div>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            )}


                                            {/* =================
                                                RACE RESULTS
                                            ================== */}

                                            {gameMode === "teams" ? (

                                                Array.from(
                                                    {
                                                        length:
                                                            activeGrandPrixPlayers.length /
                                                            2
                                                    },
                                                    (_, index) => {

                                                        const teamNumber =
                                                            index + 1;

                                                        const teamPlayers =
                                                            activeGrandPrixPlayers.filter(
                                                                player =>
                                                                    teamAssignments[
                                                                        player.playerId
                                                                    ] ===
                                                                    teamNumber
                                                            );

                                                        const teamResult =
                                                            race.teamResults?.[
                                                                teamNumber
                                                            ] ||
                                                            {};


                                                        return (

                                                            <div
                                                                className="player-result"
                                                                key={
                                                                    `team-${teamNumber}`
                                                                }
                                                            >

                                                                <div className="player-name">

                                                                    <span>
                                                                        <strong>
                                                                            Team {teamNumber}
                                                                        </strong>
                                                                        {" — "}
                                                                        {teamPlayers
                                                                            .map(
                                                                                player =>
                                                                                    player.name
                                                                            )
                                                                            .join(" + ")}
                                                                    </span>

                                                                </div>


                                                                <select
                                                                    className="placement-select"
                                                                    value={
                                                                        teamResult
                                                                            .placement ||
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            updateTeamPlacement(
                                                                                race.raceNumber,
                                                                                teamNumber,
                                                                                event.target.value
                                                                            )
                                                                    }
                                                                >

                                                                    <option value="">
                                                                        Team Placement
                                                                    </option>


                                                                    {Array.from(
                                                                        {
                                                                            length:
                                                                                activeGrandPrixPlayers.length /
                                                                                2
                                                                        },
                                                                        (
                                                                            _,
                                                                            placementIndex
                                                                        ) => {

                                                                            const placement =
                                                                                placementIndex +
                                                                                1;


                                                                            const disabled =
                                                                                teamPlacementAlreadyUsed(
                                                                                    race,
                                                                                    teamNumber,
                                                                                    placement
                                                                                );


                                                                            return (

                                                                                <option
                                                                                    key={
                                                                                        placement
                                                                                    }
                                                                                    value={
                                                                                        placement
                                                                                    }
                                                                                    disabled={
                                                                                        disabled
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        placement
                                                                                    }
                                                                                </option>

                                                                            );

                                                                        }
                                                                    )}

                                                                </select>


                                                                <input
                                                                    type="text"
                                                                    className="player-note"
                                                                    placeholder="Time (Optional)"
                                                                    value={
                                                                        teamResult
                                                                            .note ||
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            updateTeamNote(
                                                                                race.raceNumber,
                                                                                teamNumber,
                                                                                event.target.value
                                                                            )
                                                                    }
                                                                />

                                                            </div>

                                                        );

                                                    }
                                                )

                                            ) : (

                                                activeGrandPrixPlayers
                                                    .map(
                                                        player => {

                                                            const playerResult =
                                                                race.results[
                                                                    player.playerId
                                                                ] ||
                                                                {};


                                                            return (

                                                                <div
                                                                    className="player-result"
                                                                    key={
                                                                        player
                                                                            .playerId
                                                                    }
                                                                >

                                                                    <div className="player-name">

                                                                        <img
                                                                            src={`/images/characters/${player.profileImage}`}
                                                                            alt={
                                                                                player.name
                                                                            }
                                                                            className="race-player-image"
                                                                        />

                                                                        <span>
                                                                            {
                                                                                player.name
                                                                            }
                                                                        </span>

                                                                    </div>


                                                                    <select
                                                                        className="placement-select"
                                                                        value={
                                                                            playerResult
                                                                                .placement ||
                                                                            ""
                                                                        }
                                                                        onChange={
                                                                            event =>
                                                                                updatePlacement(
                                                                                    race.raceNumber,
                                                                                    player.playerId,
                                                                                    event.target.value
                                                                                )
                                                                        }
                                                                    >

                                                                        <option value="">
                                                                            Placement
                                                                        </option>


                                                                        {activeGrandPrixPlayers
                                                                            .map(
                                                                                (
                                                                                    _,
                                                                                    index
                                                                                ) => {

                                                                                    const placement =
                                                                                        index +
                                                                                        1;


                                                                                    const disabled =
                                                                                        placementAlreadyUsed(
                                                                                            race,
                                                                                            player.playerId,
                                                                                            placement
                                                                                        );


                                                                                    return (

                                                                                        <option
                                                                                            key={
                                                                                                placement
                                                                                            }
                                                                                            value={
                                                                                                placement
                                                                                            }
                                                                                            disabled={
                                                                                                disabled
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                placement
                                                                                            }
                                                                                        </option>

                                                                                    );

                                                                                }
                                                                            )}

                                                                    </select>


                                                                    <input
                                                                        type="text"
                                                                        className="player-note"
                                                                        placeholder="Time (Optional)"
                                                                        value={
                                                                            playerResult
                                                                                .note ||
                                                                            ""
                                                                        }
                                                                        onChange={
                                                                            event =>
                                                                                updateNote(
                                                                                    race.raceNumber,
                                                                                    player.playerId,
                                                                                    event.target.value
                                                                                )
                                                                        }
                                                                    />

                                                                </div>

                                                            );

                                                        }
                                                    )

                                            )}

                                        </div>

                                    )
                                )}

                            </div>


                            {/* =========================
                                CURRENT STANDINGS
                            ========================== */}

                            <section className="scoreboard">

                                <h2>
                                    Current Standings
                                </h2>


                                <div id="scoreboard-list">

                                    {gameMode === "individual" &&
                                        currentStandings
                                        .map(
                                            player => (

                                                <div
                                                    className="score-row"
                                                    key={
                                                        player.playerId
                                                    }
                                                >

                                                    <span className="score-player">

                                                        <img
                                                            src={`/images/characters/${player.profileImageAtTime}`}
                                                            alt={
                                                                player.playerNameAtTime
                                                            }
                                                            className="score-player-image"
                                                        />

                                                        {
                                                            player.playerNameAtTime
                                                        }

                                                    </span>


                                                    <strong>
                                                        {
                                                            player.points
                                                        } pts
                                                    </strong>

                                                </div>

                                            )
                                        )}


                                    {gameMode === "teams" && (

                                        <div className="team-scoreboard">

                                            <h3>👥 Team Standings</h3>

                                            {currentTeamStandings.map(
                                                (team, index) => (

                                                    <div
                                                        className={`team-score-row ${
                                                            index === 0
                                                                ? "team-leading"
                                                                : ""
                                                        }`}
                                                        key={team.teamNumber}
                                                    >
                                                        <span>
                                                            {["🥇", "🥈", "🥉", "4️⃣"][index]}{" "}
                                                            <strong>{team.teamName}</strong>
                                                            {" — "}
                                                            {team.players
                                                                .map(player =>
                                                                    player.playerNameAtTime
                                                                )
                                                                .join(" + ")}
                                                        </span>

                                                        <strong>
                                                            {team.points} pts
                                                        </strong>
                                                    </div>

                                                )
                                            )}

                                        </div>

                                    )}


                                    <div className="beer-tracker">

                                        🍺 Beers for this Grand Prix:{" "}

                                        <strong>
                                            {
                                                totalBeers
                                            }
                                        </strong>

                                        {gameMode === "teams" && (
                                            <span className="beer-mode-note">
                                                {" "}• 1 beer per player
                                            </span>
                                        )}

                                    </div>

                                </div>

                            </section>


                            <button
                                type="submit"
                                disabled={
                                    saving
                                }
                            >
                                {
                                    saving
                                        ?
                                        "Saving..."
                                        :
                                        "Save Grand Prix"
                                }
                            </button>

                        </form>

                    </section>

                )}


                {/* =================================
                    FINAL RESULTS
                ================================== */}

                {finalResults && (

                    <section
                        id="final-results-section"
                        className="card"
                    >

                        <h2>
                            🏆 Grand Prix Complete
                        </h2>


                        {finalTeamResults && (

                            <div className="final-team-results">

                                <h3>👥 Team Results</h3>

                                {finalTeamResults.map(
                                    (team, index) => (

                                        <div
                                            className={`final-team-card ${
                                                index === 0
                                                    ? "team-champion"
                                                    : ""
                                            }`}
                                            key={team.teamNumber}
                                        >
                                            <span className="final-team-place">
                                                {["🏆", "🥈", "🥉", "4️⃣"][index]}
                                            </span>

                                            <div>
                                                <strong>{team.teamName}</strong>
                                                <p>
                                                    {team.players
                                                        .map(player =>
                                                            player.playerNameAtTime
                                                        )
                                                        .join(" + ")}
                                                </p>
                                            </div>

                                            <strong>
                                                {team.points} pts
                                            </strong>
                                        </div>

                                    )
                                )}

                            </div>

                        )}


                        {!finalTeamResults && (

                            <>

                                <h3 className="individual-results-title">
                                    Final Standings
                                </h3>


                                <div id="podium-list">

                                    {finalResults.map(
                                        (
                                            player,
                                            index
                                        ) => {

                                            const medals = [
                                                "🥇",
                                                "🥈",
                                                "🥉",
                                                "4️⃣"
                                            ];


                                            return (

                                                <div
                                                    className={
                                                        `podium-card ${
                                                            index === 0
                                                                ?
                                                                "first"
                                                                :
                                                                ""
                                                        }`
                                                    }
                                                    key={
                                                        player.playerId
                                                    }
                                                >

                                                    <span className="podium-place">
                                                        {
                                                            medals[
                                                                index
                                                            ]
                                                        }
                                                    </span>


                                                    <img
                                                        src={`/images/characters/${player.profileImageAtTime}`}
                                                        alt={
                                                            player.playerNameAtTime
                                                        }
                                                        className="podium-player-image"
                                                    />


                                                    <span className="podium-player-name">
                                                        {
                                                            player.playerNameAtTime
                                                        }
                                                    </span>


                                                    <strong>
                                                        {
                                                            player.points
                                                        } pts
                                                    </strong>

                                                </div>

                                            );

                                        }
                                    )}

                                </div>

                            </>

                        )}


                        <button
                            id="new-grand-prix-btn"
                            type="button"
                            onClick={
                                startNewGrandPrix
                            }
                        >
                            Start New Grand Prix
                        </button>

                    </section>

                )}

            </main>

        </>

    );

}


export default Play;