const API_BASE_URL = "http://localhost:3000";


// =========================================
// ELEMENTS
// =========================================

const recentWinnerContent =
    document.getElementById("recent-winner-content");

const powerLeaderContent =
    document.getElementById("power-leader-content");

const hottestPlayerContent =
    document.getElementById("hottest-player-content");

const totalGrandPrixElement =
    document.getElementById("home-total-gp");

const recentGrandPrixList =
    document.getElementById("recent-grand-prix-list");


// =========================================
// DATA
// =========================================

let grandPrixHistory = [];
let players = [];


// =========================================
// HELPERS
// =========================================

function getPlayerName(record) {

    return (
        record?.playerNameAtTime ||
        record?.playerName ||
        record?.name ||
        null
    );

}


function getHistoricalProfileImage(record) {

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


function getCurrentPlayer(name) {

    return players.find(
        player =>
            player.name === name
    );

}


function getCurrentProfileImage(
    name,
    fallbackImage = "mario.png"
) {

    const currentPlayer =
        getCurrentPlayer(name);

    return (
        currentPlayer?.profileImage ||
        fallbackImage ||
        "mario.png"
    );

}


function clamp(value, min, max) {

    return Math.min(
        Math.max(value, min),
        max
    );

}


// =========================================
// LOAD DATA
// =========================================

async function loadHomeDashboard() {

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

            players =
                await playersResponse.json();

        } else {

            players = [];

        }


        renderTotalGrandPrix();

        renderRecentWinner();

        renderPowerLeader();

        renderHottestPlayer();

        renderRecentGrandPrix();


    } catch (error) {

        console.error(
            "Error loading home dashboard:",
            error
        );


        showDashboardError();

    }

}


// =========================================
// TOTAL GRAND PRIX
// =========================================

function renderTotalGrandPrix() {

    totalGrandPrixElement.textContent =
        grandPrixHistory.length;

}


// =========================================
// RECENT WINNER
// =========================================

function renderRecentWinner() {

    if (!grandPrixHistory.length) {

        recentWinnerContent.innerHTML = `

            <p>
                No Grand Prix yet
            </p>

        `;

        return;

    }


    const newestGrandPrix =
        [...grandPrixHistory]
            .sort(
                (a, b) =>
                    getGrandPrixDate(b) -
                    getGrandPrixDate(a)
            )[0];


    const winner =
        newestGrandPrix
            .finalStandings?.[0] ||
        newestGrandPrix.winner ||
        {};


    const winnerName =
        getPlayerName(winner) ||
        "Unknown";


    const profileImage =
        getCurrentProfileImage(
            winnerName,
            getHistoricalProfileImage(
                winner
            )
        );


    const points =
        winner.points || 0;


    recentWinnerContent.innerHTML = `

        <img
            src="../images/characters/${profileImage}"
            alt="${winnerName}"
            class="home-dashboard-image"
        >

        <h3>
            ${winnerName}
        </h3>

        <p>
            ${
                newestGrandPrix
                    .grandPrixName ||
                "Untitled Grand Prix"
            }
        </p>

        <div class="home-player-highlight">
            🏆 ${points} pts
        </div>

    `;

}


// =========================================
// CALCULATE PLAYER STATS
// =========================================

function calculatePlayerStats() {

    const stats = {};


    const chronologicalHistory =
        [...grandPrixHistory]
            .sort(
                (a, b) =>
                    getGrandPrixDate(a) -
                    getGrandPrixDate(b)
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

                grandPrixPlayed: 0,

                gpWins: 0,

                gpPodiums: 0,

                totalPoints: 0,

                totalGPPlacement: 0,

                totalRaces: 0,

                raceWins: 0,

                totalRacePlacements: 0,

                gpResults: [],

                gpWinRate: 0,

                podiumRate: 0,

                raceWinRate: 0,

                averageFinish: null,

                averageGPFinish: null,

                recentAverageFinish: null,

                recentFormScore: 0,

                powerRating: 0

            };

        }

    }


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


                createPlayerIfNeeded(
                    name,
                    getHistoricalProfileImage(
                        standing
                    )
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
                        getGrandPrixDate(gp)

                });

            }
        );


        (gp.races || [])
            .forEach(race => {

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
                            getHistoricalProfileImage(
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

                        player
                            .totalRacePlacements +=
                            placement;


                        if (placement === 1) {

                            player.raceWins++;

                        }

                    });

            });

    });


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


            calculateRecentForm(
                player
            );


            player.powerRating =
                calculatePowerRating(
                    player
                );

        });


    return Object.values(stats);

}


// =========================================
// RECENT FORM
// =========================================

function calculateRecentForm(player) {

    const lastFive =
        player.gpResults.slice(-5);


    if (!lastFive.length) {

        player.recentAverageFinish =
            null;

        player.recentFormScore = 0;

        return;

    }


    const averageFinish =
        lastFive.reduce(
            (sum, result) =>
                sum +
                result.placement,
            0
        ) /
        lastFive.length;


    player.recentAverageFinish =
        averageFinish;


    player.recentFormScore =
        clamp(
            (
                4.5 -
                averageFinish
            ) /
            3.5,
            0,
            1
        );

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


    // Keeps players with only one or two
    // Grand Prix from immediately dominating
    // the rankings.
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
// POWER RANKING LEADER
// =========================================

function renderPowerLeader() {

    const playerStats =
        calculatePlayerStats();


    if (!playerStats.length) {

        powerLeaderContent.innerHTML = `

            <p>
                No rankings yet
            </p>

        `;

        return;

    }


    const leader =
        [...playerStats]
            .sort(
                (a, b) =>
                    b.powerRating -
                    a.powerRating
            )[0];


    powerLeaderContent.innerHTML = `

        <img
            src="../images/characters/${leader.profileImage}"
            alt="${leader.name}"
            class="home-dashboard-image"
        >

        <h3>
            👑 ${leader.name}
        </h3>

        <p>
            ${leader.gpWins}
            GP wins
        </p>

        <div class="home-player-highlight">
            ${leader.powerRating}
            Power
        </div>

    `;

}


// =========================================
// HOTTEST PLAYER
// =========================================

function renderHottestPlayer() {

    const playerStats =
        calculatePlayerStats();


    const eligiblePlayers =
        playerStats.filter(
            player =>
                player
                    .recentAverageFinish !==
                null
        );


    if (!eligiblePlayers.length) {

        hottestPlayerContent.innerHTML = `

            <p>
                No recent form yet
            </p>

        `;

        return;

    }


    const hottestPlayer =
        [...eligiblePlayers]
            .sort(
                (a, b) =>
                    a.recentAverageFinish -
                    b.recentAverageFinish
            )[0];


    hottestPlayerContent.innerHTML = `

        <img
            src="../images/characters/${hottestPlayer.profileImage}"
            alt="${hottestPlayer.name}"
            class="home-dashboard-image"
        >

        <h3>
            🔥 ${hottestPlayer.name}
        </h3>

        <p>
            Last 5 Grand Prix
        </p>

        <div class="home-player-highlight">
            ${hottestPlayer
                .recentAverageFinish
                .toFixed(2)}
            Avg Finish
        </div>

    `;

}


// =========================================
// RECENT GRAND PRIX LIST
// =========================================

function renderRecentGrandPrix() {

    if (!grandPrixHistory.length) {

        recentGrandPrixList.innerHTML = `

            <div class="home-loading">
                No Grand Prix history yet.
            </div>

        `;

        return;

    }


    const recentGrandPrix =
        [...grandPrixHistory]
            .sort(
                (a, b) =>
                    getGrandPrixDate(b) -
                    getGrandPrixDate(a)
            )
            .slice(0, 5);


    recentGrandPrixList.innerHTML =
        recentGrandPrix.map(gp => {

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
                    getHistoricalProfileImage(
                        winner
                    )
                );


            const winnerPoints =
                Number(
                    winner.points || 0
                );


            const date =
                new Date(
                    gp.datePlayed ||
                    gp.createdAt
                ).toLocaleDateString();


            return `

                <div class="recent-gp-row">

                    <img
                        src="../images/characters/${winnerImage}"
                        alt="${winnerName}"
                        class="recent-gp-image"
                    >


                    <div class="recent-gp-name">

                        <strong>
                            ${
                                gp.grandPrixName ||
                                "Untitled Grand Prix"
                            }
                        </strong>

                        <span>
                            ${date}
                        </span>

                    </div>


                    <div class="recent-gp-winner">

                        🏆 Winner:

                        <strong>
                            ${winnerName}
                        </strong>

                    </div>


                    <div class="recent-gp-points">

                        ${winnerPoints}
                        pts

                    </div>

                </div>

            `;

        }).join("");

}


// =========================================
// ERROR STATE
// =========================================

function showDashboardError() {

    recentWinnerContent.innerHTML = `
        <div class="home-loading">
            Could not load stats.
        </div>
    `;


    powerLeaderContent.innerHTML = `
        <div class="home-loading">
            Could not load rankings.
        </div>
    `;


    hottestPlayerContent.innerHTML = `
        <div class="home-loading">
            Could not load recent form.
        </div>
    `;


    recentGrandPrixList.innerHTML = `
        <div class="home-loading">
            Could not load recent Grand Prix.
        </div>
    `;

}


// =========================================
// START
// =========================================

loadHomeDashboard();