const API_BASE_URL = "http://localhost:3000";


// =========================================
// ELEMENTS
// =========================================

const tabButtons =
    document.querySelectorAll(".tab-btn");

const tabContents =
    document.querySelectorAll(".tab-content");


const generalStatsDiv =
    document.getElementById("general-stats");

const powerRankingsDiv =
    document.getElementById("power-rankings");

const leagueLeadersDiv =
    document.getElementById("league-leaders");

const currentFormDiv =
    document.getElementById("current-form");

const trackStatsDiv =
    document.getElementById("track-stats");

const trackSpecialistsDiv =
    document.getElementById("track-specialists");

const beerStatsDiv =
    document.getElementById("beer-stats");

const beerEfficiencyDiv =
    document.getElementById("beer-efficiency");

const streakStatsDiv =
    document.getElementById("streak-stats");


const playerListDiv =
    document.getElementById("player-list");


const h2hPlayerOne =
    document.getElementById("h2h-player-one");

const h2hPlayerTwo =
    document.getElementById("h2h-player-two");

const headToHeadResultsDiv =
    document.getElementById("head-to-head-results");


const historyListDiv =
    document.getElementById("history-list");


const playerModal =
    document.getElementById("player-modal");

const closeModalBtn =
    document.getElementById("close-modal");

const modalBody =
    document.getElementById("modal-body");


// =========================================
// DATA
// =========================================

let grandPrixHistory = [];
let currentPlayers = [];
let cachedPlayerStats = [];


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


function getCurrentPlayerByName(name) {

    return currentPlayers.find(
        player =>
            player.name === name
    );

}


function getCurrentProfileImage(
    name,
    historicalImage = "mario.png"
) {

    const currentPlayer =
        getCurrentPlayerByName(name);

    return (
        currentPlayer?.profileImage ||
        historicalImage ||
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
// TABS
// =========================================

tabButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const tab =
                button.dataset.tab;


            tabButtons.forEach(btn => {
                btn.classList.remove(
                    "active"
                );
            });


            tabContents.forEach(content => {
                content.classList.remove(
                    "active"
                );
            });


            button.classList.add(
                "active"
            );


            document
                .getElementById(tab)
                .classList.add(
                    "active"
                );

        }
    );

});


// =========================================
// LOAD DATA
// =========================================

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


        if (!historyResponse.ok) {

            throw new Error(
                "Failed to load Grand Prix history"
            );

        }


        grandPrixHistory =
            await historyResponse.json();


        if (playersResponse.ok) {

            currentPlayers =
                await playersResponse.json();

        } else {

            currentPlayers = [];

        }


        cachedPlayerStats =
            calculatePlayerStats();


        renderGeneralStats();

        renderPowerRankings();

        renderLeagueLeaders();

        renderCurrentForm();

        renderTrackStats();

        renderTrackSpecialists();

        renderBeerStats();

        renderBeerEfficiency();

        renderStreakStats();

        renderPlayerStats();

        setupHeadToHead();

        renderHistory();


        console.log(
            "Calculated Player Stats:",
            cachedPlayerStats
        );


    } catch (error) {

        console.error(
            "Error loading stats:",
            error
        );


        historyListDiv.innerHTML = `
            <div class="empty-state">
                <h3>Could not load stats.</h3>
            </div>
        `;

    }

}


// =========================================
// CALCULATE PLAYER STATS
// =========================================

function calculatePlayerStats() {

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

            stats[name] = {

                name,

                profileImage:
                    getCurrentProfileImage(
                        name,
                        profileImage
                    ),

                // GRAND PRIX
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

                // FORM / STREAKS
                gpResults: [],

                currentWinStreak: 0,
                longestWinStreak: 0,
                longestWinlessStreak: 0,

                // CALCULATED LATER
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


    // =========================================
    // READ HISTORY
    // =========================================

    chronologicalHistory.forEach(gp => {

        const standings =
            gp.finalStandings || [];


        standings.forEach(
            (standing, index) => {

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
                        standing.points || 0
                    );

                player.totalGPPlacement +=
                    placement;


                if (placement === 1) {

                    player.gpWins++;

                }


                if (placement <= 3) {

                    player.gpPodiums++;

                }


                player.gpResults.push({

                    placement,

                    points:
                        Number(
                            standing.points || 0
                        ),

                    date:
                        getGrandPrixDate(gp),

                    grandPrixName:
                        gp.grandPrixName ||
                        "Untitled Grand Prix"

                });

            }
        );


        (gp.races || []).forEach(
            race => {

                (race.results || [])
                    .forEach(result => {

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
                            stats[name];


                        const placement =
                            Number(
                                result.placement
                            );


                        if (!placement) {
                            return;
                        }


                        player.totalRaces++;

                        player.totalRacePlacements +=
                            placement;

                        player.racePoints +=
                            Number(
                                result.points || 0
                            );


                        if (placement === 1) {

                            player.raceWins++;

                        }


                        if (placement <= 3) {

                            player.racePodiums++;

                        }


                        if (race.track) {

                            if (
                                !player
                                    .trackStats[
                                        race.track
                                    ]
                            ) {

                                player.trackStats[
                                    race.track
                                ] = {

                                    races: 0,
                                    wins: 0,
                                    points: 0,
                                    totalPlacement: 0

                                };

                            }


                            const track =
                                player.trackStats[
                                    race.track
                                ];


                            track.races++;

                            track.points +=
                                Number(
                                    result.points || 0
                                );

                            track.totalPlacement +=
                                placement;


                            if (placement === 1) {

                                track.wins++;

                            }

                        }

                    });

            }
        );

    });


    // =========================================
    // CALCULATE DERIVED STATS
    // =========================================

    Object.values(stats)
        .forEach(player => {

            player.gpWinRate =
                player.grandPrixPlayed
                    ? player.gpWins /
                        player.grandPrixPlayed
                    : 0;


            player.podiumRate =
                player.grandPrixPlayed
                    ? player.gpPodiums /
                        player.grandPrixPlayed
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
                        player.grandPrixPlayed
                    : null;


            player.averageGPPoints =
                player.grandPrixPlayed
                    ? player.totalPoints /
                        player.grandPrixPlayed
                    : 0;


            player.beers =
                player.grandPrixPlayed * 2;


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

        });


    // =========================================
    // POWER RATINGS
    // =========================================

    Object.values(stats)
        .forEach(player => {

            player.powerRating =
                calculatePowerRating(
                    player
                );

        });


    // =========================================
    // RIVALRIES
    // =========================================

    Object.values(stats)
        .forEach(player => {

            player.biggestRival =
                findBiggestRival(
                    player.name
                );

        });


    return Object.values(stats)
        .sort(
            (a, b) =>
                b.powerRating -
                a.powerRating
        );

}


// =========================================
// STREAK CALCULATIONS
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
// CURRENT FORM
// =========================================

function calculatePlayerRecentForm(player) {

    const lastFive =
        player.gpResults.slice(-5);


    if (!lastFive.length) {

        player.recentAverageFinish =
            null;

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


    // Lower placement is better.
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

        // Positive = improving.
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


    // =========================================
    // SAMPLE SIZE ADJUSTMENT
    //
    // New players get pulled toward an
    // average 50 rating until more data exists.
    // =========================================

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
// GENERAL STATS
// =========================================

function renderGeneralStats() {

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


    const totalPlayers =
        cachedPlayerStats.length;


    const totalBeers =
        cachedPlayerStats.reduce(
            (sum, player) =>
                sum + player.beers,
            0
        );


    const trackCounts =
        getTrackCounts();


    const mostPlayedTrack =
        Object.entries(trackCounts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];


    generalStatsDiv.innerHTML = `

        <div class="stat-card">

            <h3>
                🏆 Grand Prix Played
            </h3>

            <p>
                ${totalGrandPrix}
            </p>

        </div>


        <div class="stat-card">

            <h3>
                🏁 Total Races
            </h3>

            <p>
                ${totalRaces}
            </p>

        </div>


        <div class="stat-card">

            <h3>
                👥 Players Tracked
            </h3>

            <p>
                ${totalPlayers}
            </p>

        </div>


        <div class="stat-card">

            <h3>
                🍺 Total Beers
            </h3>

            <p>
                ${totalBeers}
            </p>

        </div>


        <div class="stat-card">

            <h3>
                🎮 Most Played Track
            </h3>

            <p class="small-stat">
                ${
                    mostPlayedTrack
                        ? mostPlayedTrack[0]
                        : "N/A"
                }
            </p>

            ${
                mostPlayedTrack
                    ? `
                        <span>
                            ${mostPlayedTrack[1]}
                            races
                        </span>
                    `
                    : ""
            }

        </div>


        <div class="stat-card">

            <h3>
                📊 Total Points Scored
            </h3>

            <p>
                ${
                    cachedPlayerStats.reduce(
                        (sum, player) =>
                            sum +
                            player.totalPoints,
                        0
                    )
                }
            </p>

        </div>

    `;

}


// =========================================
// POWER RANKINGS
// =========================================

function renderPowerRankings() {

    if (!cachedPlayerStats.length) {

        powerRankingsDiv.innerHTML = `
            <div class="empty-state">
                <p>
                    No rankings yet.
                </p>
            </div>
        `;

        return;

    }


    const rankedPlayers =
        [...cachedPlayerStats]
            .sort(
                (a, b) =>
                    b.powerRating -
                    a.powerRating
            );


    powerRankingsDiv.innerHTML =
        rankedPlayers.map(
            (player, index) => {

                const trendIcon =
                    getTrendIcon(
                        player.trend
                    );


                const trendClass =
                    getTrendClass(
                        player.trend
                    );


                return `

                    <div
                        class="power-row ${
                            index === 0
                                ? "power-number-one"
                                : ""
                        }"
                    >

                        <div class="power-position">

                            ${
                                index === 0
                                    ? "👑"
                                    : `#${index + 1}`
                            }

                        </div>


                        <img
                            src="../images/characters/${player.profileImage}"
                            alt="${player.name}"
                            class="power-player-image"
                        >


                        <div class="power-player-info">

                            <strong>
                                ${player.name}
                            </strong>

                            <span>
                                ${player.gpWins}
                                wins •
                                ${player.grandPrixPlayed}
                                GP
                            </span>

                        </div>


                        <div
                            class="power-trend ${trendClass}"
                        >
                            ${trendIcon}
                        </div>


                        <div class="power-score">

                            <strong>
                                ${player.powerRating}
                            </strong>

                            <span>
                                POWER
                            </span>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


// =========================================
// LEAGUE LEADERS
// =========================================

function renderLeagueLeaders() {

    if (!cachedPlayerStats.length) {

        leagueLeadersDiv.innerHTML =
            "<p>No stats yet.</p>";

        return;

    }


    const mostGPWins =
        getLeader(
            "gpWins",
            true
        );


    const bestGPWinRate =
        getLeader(
            "gpWinRate",
            true
        );


    const mostRaceWins =
        getLeader(
            "raceWins",
            true
        );


    const bestRaceWinRate =
        getLeader(
            "raceWinRate",
            true
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
            "podiumRate",
            true
        );


    const mostPoints =
        getLeader(
            "totalPoints",
            true
        );


    const longestWinStreak =
        getLeader(
            "longestWinStreak",
            true
        );


    const hottestPlayer =
        [...cachedPlayerStats]
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
            )[0];


    const climber =
        [...cachedPlayerStats]
            .filter(
                player =>
                    player.grandPrixPlayed >=
                    2
            )
            .sort(
                (a, b) =>
                    b.trend -
                    a.trend
            )[0];


    const slump =
        [...cachedPlayerStats]
            .filter(
                player =>
                    player.grandPrixPlayed >=
                    2
            )
            .sort(
                (a, b) =>
                    a.trend -
                    b.trend
            )[0];


    const cards = [

        {
            icon: "🏆",
            title: "Most GP Wins",
            player: mostGPWins,
            value:
                mostGPWins
                    ? `${mostGPWins.gpWins}`
                    : "N/A"
        },

        {
            icon: "👑",
            title: "Best GP Win %",
            player: bestGPWinRate,
            value:
                bestGPWinRate
                    ? `${percentage(
                        bestGPWinRate.gpWins,
                        bestGPWinRate.grandPrixPlayed
                    )}%`
                    : "N/A"
        },

        {
            icon: "🏁",
            title: "Most Race Wins",
            player: mostRaceWins,
            value:
                mostRaceWins
                    ? `${mostRaceWins.raceWins}`
                    : "N/A"
        },

        {
            icon: "⚡",
            title: "Best Race Win %",
            player: bestRaceWinRate,
            value:
                bestRaceWinRate
                    ? `${percentage(
                        bestRaceWinRate.raceWins,
                        bestRaceWinRate.totalRaces
                    )}%`
                    : "N/A"
        },

        {
            icon: "🎯",
            title: "Best Avg Finish",
            player: bestAverageFinish,
            value:
                bestAverageFinish
                    ? bestAverageFinish
                        .averageFinish
                        .toFixed(2)
                    : "N/A"
        },

        {
            icon: "🥉",
            title: "Best Podium %",
            player: bestPodiumRate,
            value:
                bestPodiumRate
                    ? `${percentage(
                        bestPodiumRate.gpPodiums,
                        bestPodiumRate.grandPrixPlayed
                    )}%`
                    : "N/A"
        },

        {
            icon: "💰",
            title: "Most Points",
            player: mostPoints,
            value:
                mostPoints
                    ? mostPoints.totalPoints
                    : "N/A"
        },

        {
            icon: "🔥",
            title: "Longest Win Streak",
            player: longestWinStreak,
            value:
                longestWinStreak
                    ? `${longestWinStreak.longestWinStreak} GP`
                    : "N/A"
        },

        {
            icon: "🌡️",
            title: "Hottest Player",
            player: hottestPlayer,
            value:
                hottestPlayer
                    ? `${hottestPlayer.recentAverageFinish.toFixed(2)} avg`
                    : "N/A"
        },

        {
            icon: "📈",
            title: "Biggest Climber",
            player: climber,
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
            title: "Biggest Slump",
            player: slump,
            value:
                slump
                    ? `${Math.min(
                        slump.trend,
                        0
                    ).toFixed(2)}`
                    : "N/A"
        }

    ];


    leagueLeadersDiv.innerHTML =
        cards.map(card =>
            createLeaderCard(card)
        ).join("");

}


// =========================================
// GENERIC LEADER
// =========================================

function getLeader(
    property,
    highest = true,
    filterFunction = null
) {

    let players =
        [...cachedPlayerStats];


    if (filterFunction) {

        players =
            players.filter(
                filterFunction
            );

    }


    players =
        players.filter(
            player =>
                player[property] !==
                null &&
                player[property] !==
                undefined
        );


    players.sort(
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


    return players[0] || null;

}


// =========================================
// LEADER CARD
// =========================================

function createLeaderCard(card) {

    if (!card.player) {

        return `

            <div class="leader-card">

                <span class="leader-icon">
                    ${card.icon}
                </span>

                <h3>
                    ${card.title}
                </h3>

                <p>
                    N/A
                </p>

            </div>

        `;

    }


    return `

        <div class="leader-card">

            <span class="leader-icon">
                ${card.icon}
            </span>

            <img
                src="../images/characters/${card.player.profileImage}"
                alt="${card.player.name}"
                class="leader-player-image"
            >

            <h3>
                ${card.title}
            </h3>

            <strong>
                ${card.player.name}
            </strong>

            <p>
                ${card.value}
            </p>

        </div>

    `;

}


// =========================================
// CURRENT FORM
// =========================================

function renderCurrentForm() {

    const players =
        [...cachedPlayerStats]
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
            );


    currentFormDiv.innerHTML =
        players.map(player => {

            const recent =
                player.gpResults
                    .slice(-5);


            const trendIcon =
                getTrendIcon(
                    player.trend
                );


            const trendClass =
                getTrendClass(
                    player.trend
                );


            return `

                <div class="form-card">

                    <div class="form-player-header">

                        <img
                            src="../images/characters/${player.profileImage}"
                            alt="${player.name}"
                            class="form-player-image"
                        >

                        <div>

                            <h3>
                                ${player.name}
                            </h3>

                            <span
                                class="${trendClass}"
                            >
                                ${trendIcon}
                                ${
                                    Math.abs(
                                        player.trend
                                    ).toFixed(2)
                                }
                            </span>

                        </div>

                    </div>


                    <div class="form-results">

                        ${
                            recent.length
                                ? recent.map(
                                    result => `
                                        <span
                                            class="form-result form-place-${result.placement}"
                                            title="${result.grandPrixName}"
                                        >
                                            ${getPlacementDisplay(
                                                result.placement
                                            )}
                                        </span>
                                    `
                                ).join("")
                                : `
                                    <span>
                                        No races
                                    </span>
                                `
                        }

                    </div>


                    <p>
                        Last ${
                            recent.length
                        } GP avg:
                        <strong>
                            ${
                                player
                                    .recentAverageFinish !==
                                null
                                    ? player
                                        .recentAverageFinish
                                        .toFixed(2)
                                    : "N/A"
                            }
                        </strong>
                    </p>

                </div>

            `;

        }).join("");

}


// =========================================
// TRACK COUNTS
// =========================================

function getTrackCounts() {

    const trackCounts = {};


    grandPrixHistory.forEach(gp => {

        (gp.races || [])
            .forEach(race => {

                if (!race.track) {
                    return;
                }


                if (!trackCounts[race.track]) {

                    trackCounts[
                        race.track
                    ] = 0;

                }


                trackCounts[
                    race.track
                ]++;

            });

    });


    return trackCounts;

}


// =========================================
// TRACK STATS
// =========================================

function renderTrackStats() {

    const trackCounts =
        getTrackCounts();


    const sortedTracks =
        Object.entries(trackCounts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    if (!sortedTracks.length) {

        trackStatsDiv.innerHTML = `

            <div class="stat-card">

                <h3>
                    No Tracks Yet
                </h3>

                <p>
                    🏁
                </p>

            </div>

        `;

        return;

    }


    const mostPlayed =
        sortedTracks[0];


    const leastPlayed =
        [...sortedTracks]
            .sort(
                (a, b) =>
                    a[1] - b[1]
            )[0];


    const totalTrackEntries =
        sortedTracks.reduce(
            (sum, track) =>
                sum + track[1],
            0
        );


    trackStatsDiv.innerHTML = `

        <div class="stat-card">

            <h3>
                🗺️ Unique Tracks
            </h3>

            <p>
                ${sortedTracks.length}
            </p>

        </div>


        <div class="stat-card">

            <h3>
                🔥 Most Played
            </h3>

            <p class="small-stat">
                ${mostPlayed[0]}
            </p>

            <span>
                ${mostPlayed[1]}
                races
            </span>

        </div>


        <div class="stat-card">

            <h3>
                🧊 Least Played
            </h3>

            <p class="small-stat">
                ${leastPlayed[0]}
            </p>

            <span>
                ${leastPlayed[1]}
                races
            </span>

        </div>


        <div class="stat-card">

            <h3>
                🏁 Track Entries
            </h3>

            <p>
                ${totalTrackEntries}
            </p>

        </div>

    `;

}


// =========================================
// TRACK SPECIALISTS
// =========================================

function renderTrackSpecialists() {

    const specialists = [];


    const allTracks =
        new Set();


    cachedPlayerStats.forEach(player => {

        Object.keys(
            player.trackStats
        ).forEach(track => {

            allTracks.add(track);

        });

    });


    allTracks.forEach(track => {

        const candidates =
            cachedPlayerStats
                .filter(
                    player =>
                        player.trackStats[
                            track
                        ]?.races > 0
                )
                .map(player => {

                    const stat =
                        player.trackStats[
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
                            stat.totalPlacement /
                            stat.races

                    };

                })
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


        if (candidates[0]) {

            specialists.push(
                candidates[0]
            );

        }

    });


    specialists.sort(
        (a, b) =>
            b.races -
            a.races
    );


    const displaySpecialists =
        specialists.slice(0, 8);


    if (!displaySpecialists.length) {

        trackSpecialistsDiv.innerHTML = `
            <p>
                No track data yet.
            </p>
        `;

        return;

    }


    trackSpecialistsDiv.innerHTML =
        displaySpecialists.map(
            specialist => `

                <div class="specialist-card">

                    <img
                        src="../images/characters/${specialist.player.profileImage}"
                        alt="${specialist.player.name}"
                        class="specialist-image"
                    >

                    <div>

                        <span class="specialist-track">
                            ${specialist.track}
                        </span>

                        <h3>
                            👑 ${specialist.player.name}
                        </h3>

                        <p>
                            ${specialist.averagePoints.toFixed(1)}
                            avg pts •
                            ${specialist.wins}
                            wins
                        </p>

                    </div>

                </div>

            `
        ).join("");

}


// =========================================
// BEER STATS
// =========================================

function renderBeerStats() {

    const totalBeers =
        cachedPlayerStats.reduce(
            (sum, player) =>
                sum + player.beers,
            0
        );


    const biggestDrinker =
        [...cachedPlayerStats]
            .sort(
                (a, b) =>
                    b.beers -
                    a.beers
            )[0];


    const mostWinsPerBeer =
        [...cachedPlayerStats]
            .filter(
                player =>
                    player.beers > 0
            )
            .sort(
                (a, b) =>
                    b.winsPer10Beers -
                    a.winsPer10Beers
            )[0];


    beerStatsDiv.innerHTML = `

        <div class="stat-card">

            <h3>
                🍺 Total Beers
            </h3>

            <p>
                ${totalBeers}
            </p>

        </div>


        <div class="stat-card">

            <h3>
                🍻 Most Beers
            </h3>

            <p class="small-stat">
                ${
                    biggestDrinker
                        ? biggestDrinker.name
                        : "N/A"
                }
            </p>

            <span>
                ${
                    biggestDrinker
                        ? `${biggestDrinker.beers} beers`
                        : ""
                }
            </span>

        </div>


        <div class="stat-card">

            <h3>
                🏆 Best Wins / Beer
            </h3>

            <p class="small-stat">
                ${
                    mostWinsPerBeer
                        ? mostWinsPerBeer.name
                        : "N/A"
                }
            </p>

            <span>
                ${
                    mostWinsPerBeer
                        ? `${mostWinsPerBeer.winsPer10Beers.toFixed(2)} wins / 10 beers`
                        : ""
                }
            </span>

        </div>

    `;

}


// =========================================
// BEER EFFICIENCY
// =========================================

function renderBeerEfficiency() {

    const players =
        [...cachedPlayerStats]
            .sort(
                (a, b) =>
                    b.winsPer10Beers -
                    a.winsPer10Beers
            );


    beerEfficiencyDiv.innerHTML =
        players.map(player => `

            <div class="efficiency-card">

                <img
                    src="../images/characters/${player.profileImage}"
                    alt="${player.name}"
                    class="efficiency-image"
                >

                <div>

                    <h3>
                        ${player.name}
                    </h3>

                    <p>
                        🍺 ${player.beers}
                        beers
                    </p>

                    <strong>
                        ${player.winsPer10Beers.toFixed(2)}
                        wins / 10 beers
                    </strong>

                    <span>
                        ${player.podiumsPer10Beers.toFixed(2)}
                        podiums / 10 beers
                    </span>

                </div>

            </div>

        `).join("");

}


// =========================================
// STREAK STATS
// =========================================

function renderStreakStats() {

    const currentStreak =
        getLeader(
            "currentWinStreak",
            true
        );


    const longestStreak =
        getLeader(
            "longestWinStreak",
            true
        );


    const longestWinless =
        getLeader(
            "longestWinlessStreak",
            true
        );


    const bestRecent =
        [...cachedPlayerStats]
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
            )[0];


    const cards = [

        {
            icon: "🔥",
            title: "Current Win Streak",
            player: currentStreak,
            value:
                currentStreak
                    ? `${currentStreak.currentWinStreak} GP`
                    : "N/A"
        },

        {
            icon: "👑",
            title: "Longest Win Streak",
            player: longestStreak,
            value:
                longestStreak
                    ? `${longestStreak.longestWinStreak} GP`
                    : "N/A"
        },

        {
            icon: "🥶",
            title: "Longest Winless Streak",
            player: longestWinless,
            value:
                longestWinless
                    ? `${longestWinless.longestWinlessStreak} GP`
                    : "N/A"
        },

        {
            icon: "🌡️",
            title: "Best Recent Form",
            player: bestRecent,
            value:
                bestRecent
                    ? `${bestRecent.recentAverageFinish.toFixed(2)} avg finish`
                    : "N/A"
        }

    ];


    streakStatsDiv.innerHTML =
        cards.map(
            card =>
                createLeaderCard(card)
        ).join("");

}


// =========================================
// PLAYER CARDS
// =========================================

function renderPlayerStats() {

    playerListDiv.innerHTML =
        cachedPlayerStats.map(
            (player, index) => `

                <div
                    class="player-card"
                    data-player="${player.name}"
                >

                    <div class="player-rank-badge">
                        #${index + 1}
                    </div>

                    <img
                        src="../images/characters/${player.profileImage}"
                        alt="${player.name}"
                        class="stats-player-image"
                    >

                    <h3>
                        ${player.name}
                    </h3>

                    <p>
                        ${player.gpWins}
                        GP Wins
                    </p>

                    <span class="player-power-preview">
                        ${player.powerRating}
                        Power
                    </span>

                </div>

            `
        ).join("");


    document
        .querySelectorAll(
            ".player-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const player =
                        cachedPlayerStats
                            .find(
                                player =>
                                    player.name ===
                                    card.dataset.player
                            );


                    if (player) {

                        openPlayerModal(
                            player
                        );

                    }

                }
            );

        });

}


// =========================================
// BEST / WORST TRACK
// =========================================

function getBestAndWorstTrack(player) {

    const tracks =
        Object.entries(
            player.trackStats || {}
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


                return avgB - avgA;

            }
        );


    return {

        bestTrack:
            sorted[0],

        worstTrack:
            sorted[
                sorted.length - 1
            ]

    };

}


// =========================================
// PLAYER MODAL
// =========================================

function openPlayerModal(player) {

    const {
        bestTrack,
        worstTrack
    } =
        getBestAndWorstTrack(player);


    const recentResults =
        player.gpResults.slice(-5);


    const rival =
        player.biggestRival;


    modalBody.innerHTML = `

        <div class="player-modal-header">

            <img
                src="../images/characters/${player.profileImage}"
                alt="${player.name}"
                class="modal-player-image"
            >

            <div>

                <span class="modal-power-label">
                    POWER RATING
                </span>

                <h2>
                    ${player.name}
                </h2>

                <div class="modal-power-score">
                    ${player.powerRating}
                </div>

            </div>

        </div>


        <div class="modal-form-strip">

            <strong>
                Current Form
            </strong>

            <div>

                ${
                    recentResults.length
                        ? recentResults.map(
                            result => `
                                <span
                                    class="form-result form-place-${result.placement}"
                                >
                                    ${getPlacementDisplay(
                                        result.placement
                                    )}
                                </span>
                            `
                        ).join("")
                        : "No GP yet"
                }

            </div>

        </div>


        <div class="stat-grid">


            <div class="stat-card">

                <h3>
                    🏆 GP Wins
                </h3>

                <p>
                    ${player.gpWins}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    👑 GP Win %
                </h3>

                <p>
                    ${percentage(
                        player.gpWins,
                        player.grandPrixPlayed
                    )}%
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🥉 GP Podiums
                </h3>

                <p>
                    ${player.gpPodiums}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🎯 Podium %
                </h3>

                <p>
                    ${percentage(
                        player.gpPodiums,
                        player.grandPrixPlayed
                    )}%
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🎮 GP Played
                </h3>

                <p>
                    ${player.grandPrixPlayed}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    📊 Avg GP Points
                </h3>

                <p>
                    ${player.averageGPPoints.toFixed(2)}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🏁 Race Wins
                </h3>

                <p>
                    ${player.raceWins}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    ⚡ Race Win %
                </h3>

                <p>
                    ${percentage(
                        player.raceWins,
                        player.totalRaces
                    )}%
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🎯 Avg Race Finish
                </h3>

                <p>
                    ${
                        player.averageFinish
                            ? player
                                .averageFinish
                                .toFixed(2)
                            : "N/A"
                    }
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    💰 Total Points
                </h3>

                <p>
                    ${player.totalPoints}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🔥 Current Win Streak
                </h3>

                <p>
                    ${player.currentWinStreak}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    👑 Longest Win Streak
                </h3>

                <p>
                    ${player.longestWinStreak}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🥶 Longest Winless
                </h3>

                <p>
                    ${player.longestWinlessStreak}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🍺 Career Beers
                </h3>

                <p>
                    ${player.beers}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🍻 Wins / 10 Beers
                </h3>

                <p>
                    ${player.winsPer10Beers.toFixed(2)}
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🏁 Best Track
                </h3>

                <p class="small-stat">
                    ${
                        bestTrack
                            ? bestTrack[0]
                            : "N/A"
                    }
                </p>

                ${
                    bestTrack
                        ? `
                            <span>
                                ${(
                                    bestTrack[1].points /
                                    bestTrack[1].races
                                ).toFixed(1)}
                                avg pts
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="stat-card">

                <h3>
                    📉 Worst Track
                </h3>

                <p class="small-stat">
                    ${
                        worstTrack
                            ? worstTrack[0]
                            : "N/A"
                    }
                </p>

                ${
                    worstTrack
                        ? `
                            <span>
                                ${(
                                    worstTrack[1].points /
                                    worstTrack[1].races
                                ).toFixed(1)}
                                avg pts
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="stat-card">

                <h3>
                    😤 Biggest Rival
                </h3>

                <p class="small-stat">
                    ${
                        rival
                            ? rival.opponent
                            : "N/A"
                    }
                </p>

                ${
                    rival
                        ? `
                            <span>
                                ${rival.wins}-${rival.losses}-${rival.ties}
                                GP record
                            </span>
                        `
                        : ""
                }

            </div>


        </div>

    `;


    playerModal.classList.remove(
        "hidden"
    );

}


// =========================================
// CLOSE PLAYER MODAL
// =========================================

closeModalBtn.addEventListener(
    "click",
    () => {

        playerModal.classList.add(
            "hidden"
        );

    }
);


playerModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            playerModal
        ) {

            playerModal.classList.add(
                "hidden"
            );

        }

    }
);


// =========================================
// HEAD TO HEAD SETUP
// =========================================

function setupHeadToHead() {

    const sortedPlayers =
        [...cachedPlayerStats]
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
            );


    const options =
        sortedPlayers.map(
            player => `
                <option value="${player.name}">
                    ${player.name}
                </option>
            `
        ).join("");


    h2hPlayerOne.innerHTML = `
        <option value="">
            Select Player
        </option>
        ${options}
    `;


    h2hPlayerTwo.innerHTML = `
        <option value="">
            Select Player
        </option>
        ${options}
    `;


    h2hPlayerOne.addEventListener(
        "change",
        renderHeadToHead
    );


    h2hPlayerTwo.addEventListener(
        "change",
        renderHeadToHead
    );


    if (sortedPlayers.length >= 2) {

        h2hPlayerOne.value =
            sortedPlayers[0].name;

        h2hPlayerTwo.value =
            sortedPlayers[1].name;

        renderHeadToHead();

    }

}


// =========================================
// HEAD TO HEAD CALCULATION
// =========================================

function calculateHeadToHead(
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


    grandPrixHistory.forEach(gp => {

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


        (gp.races || [])
            .forEach(race => {

                const results =
                    race.results || [];


                const playerOneResult =
                    results.find(
                        record =>
                            getPlayerName(
                                record
                            ) ===
                            playerOneName
                    );


                const playerTwoResult =
                    results.find(
                        record =>
                            getPlayerName(
                                record
                            ) ===
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
                        playerOneResult
                            .placement
                    );


                const placementTwo =
                    Number(
                        playerTwoResult
                            .placement
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
// RENDER HEAD TO HEAD
// =========================================

function renderHeadToHead() {

    const playerOneName =
        h2hPlayerOne.value;


    const playerTwoName =
        h2hPlayerTwo.value;


    if (
        !playerOneName ||
        !playerTwoName
    ) {

        return;

    }


    if (
        playerOneName ===
        playerTwoName
    ) {

        headToHeadResultsDiv.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ⚠️
                </div>

                <h3>
                    Pick Two Different Players
                </h3>

            </div>

        `;

        return;

    }


    const playerOne =
        cachedPlayerStats.find(
            player =>
                player.name ===
                playerOneName
        );


    const playerTwo =
        cachedPlayerStats.find(
            player =>
                player.name ===
                playerTwoName
        );


    const record =
        calculateHeadToHead(
            playerOneName,
            playerTwoName
        );


    let leaderText =
        "Even rivalry";


    if (
        record.playerOneGPWins >
        record.playerTwoGPWins
    ) {

        leaderText =
            `${playerOneName} leads`;

    } else if (
        record.playerTwoGPWins >
        record.playerOneGPWins
    ) {

        leaderText =
            `${playerTwoName} leads`;

    }


    headToHeadResultsDiv.innerHTML = `

        <div class="h2h-scoreboard">


            <div class="h2h-player-card">

                <img
                    src="../images/characters/${playerOne.profileImage}"
                    alt="${playerOne.name}"
                    class="h2h-player-image"
                >

                <h2>
                    ${playerOne.name}
                </h2>

                <div class="h2h-big-score">
                    ${record.playerOneGPWins}
                </div>

                <span>
                    GP wins vs
                    ${playerTwo.name}
                </span>

            </div>


            <div class="h2h-center">

                <span class="h2h-record-label">
                    ${leaderText}
                </span>

                <div class="h2h-vs-large">
                    VS
                </div>

                <span>
                    ${record.gpMeetings}
                    GP meetings
                </span>

            </div>


            <div class="h2h-player-card">

                <img
                    src="../images/characters/${playerTwo.profileImage}"
                    alt="${playerTwo.name}"
                    class="h2h-player-image"
                >

                <h2>
                    ${playerTwo.name}
                </h2>

                <div class="h2h-big-score">
                    ${record.playerTwoGPWins}
                </div>

                <span>
                    GP wins vs
                    ${playerOne.name}
                </span>

            </div>

        </div>


        <div class="h2h-stat-grid">


            <div class="stat-card">

                <h3>
                    ⚔️ GP Record
                </h3>

                <p class="small-stat">
                    ${record.playerOneGPWins}
                    -
                    ${record.playerTwoGPWins}
                </p>

                <span>
                    ${record.gpTies}
                    ties
                </span>

            </div>


            <div class="stat-card">

                <h3>
                    🏁 Race Record
                </h3>

                <p class="small-stat">
                    ${record.playerOneRaceWins}
                    -
                    ${record.playerTwoRaceWins}
                </p>

                <span>
                    ${record.raceMeetings}
                    races together
                </span>

            </div>


            <div class="stat-card">

                <h3>
                    🎯 ${playerOne.name} Avg Finish
                </h3>

                <p>
                    ${
                        record
                            .playerOneAverageFinish !==
                        null
                            ? record
                                .playerOneAverageFinish
                                .toFixed(2)
                            : "N/A"
                    }
                </p>

            </div>


            <div class="stat-card">

                <h3>
                    🎯 ${playerTwo.name} Avg Finish
                </h3>

                <p>
                    ${
                        record
                            .playerTwoAverageFinish !==
                        null
                            ? record
                                .playerTwoAverageFinish
                                .toFixed(2)
                            : "N/A"
                    }
                </p>

            </div>

        </div>

    `;

}


// =========================================
// BIGGEST RIVAL
// =========================================

function findBiggestRival(playerName) {

    let bestRival = null;


    cachedPlayerStats
        .filter(
            player =>
                player.name !==
                playerName
        )
        .forEach(opponent => {

            const record =
                calculateHeadToHead(
                    playerName,
                    opponent.name
                );


            if (!record.gpMeetings) {
                return;
            }


            if (
                !bestRival ||
                record.gpMeetings >
                bestRival.meetings
            ) {

                bestRival = {

                    opponent:
                        opponent.name,

                    meetings:
                        record.gpMeetings,

                    wins:
                        record.playerOneGPWins,

                    losses:
                        record.playerTwoGPWins,

                    ties:
                        record.gpTies

                };

            }

        });


    return bestRival;

}


// =========================================
// HISTORY
// =========================================

function renderHistory() {

    if (!grandPrixHistory.length) {

        historyListDiv.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    🏁
                </div>

                <h3>
                    No Grand Prix History Yet
                </h3>

            </div>

        `;

        return;

    }


    const newestFirst =
        sortHistoryNewestFirst(
            grandPrixHistory
        );


    historyListDiv.innerHTML =
        newestFirst.map(gp => {

            const date =
                new Date(
                    gp.datePlayed ||
                    gp.createdAt
                ).toLocaleDateString();


            const standings =
                gp.finalStandings || [];


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


            return `

                <div class="history-card">

                    <h3>
                        🏁 ${
                            gp.grandPrixName ||
                            "Untitled Grand Prix"
                        }
                    </h3>


                    <p>
                        📅 ${date}
                    </p>


                    <p>
                        👥 ${
                            gp.totalPlayers ||
                            gp.players?.length ||
                            standings.length ||
                            0
                        } Players
                    </p>


                    <div class="history-winner">

                        <span>
                            🏆 Winner:
                        </span>

                        <img
                            src="../images/characters/${winnerImage}"
                            alt="${winnerName}"
                            class="history-player-image"
                        >

                        <strong>
                            ${winnerName}
                        </strong>

                    </div>


                    <div class="history-standings">

                        ${standings.map(
                            (standing, index) => {

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


                                return `

                                    <div class="history-row">

                                        <span class="history-player">

                                            <span class="history-medal">
                                                ${getMedal(index)}
                                            </span>

                                            <img
                                                src="../images/characters/${image}"
                                                alt="${name}"
                                                class="history-player-image"
                                            >

                                            <span>
                                                ${name}
                                            </span>

                                        </span>


                                        <strong>
                                            ${
                                                standing.points ||
                                                0
                                            } pts
                                        </strong>

                                    </div>

                                `;

                            }
                        ).join("")}

                    </div>

                </div>

            `;

        }).join("");

}


// =========================================
// START
// =========================================

loadStatsData();