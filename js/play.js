let players = [];
let selectedPlayers = [];
let grandPrixHistory = [];

const API_BASE_URL = "http://localhost:3000";


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
            "GCN Sherbet Land",
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
    }
];


// =========================================
// ELEMENTS
// =========================================

const playerList =
    document.getElementById("player-list");

const startGrandPrixBtn =
    document.getElementById("start-grand-prix-btn");

const grandPrixSection =
    document.getElementById("grand-prix-section");

const racesContainer =
    document.getElementById("races-container");

const scoreboardList =
    document.getElementById("scoreboard-list");

const grandPrixForm =
    document.getElementById("grand-prix-form");

const finalResultsSection =
    document.getElementById("final-results-section");

const podiumList =
    document.getElementById("podium-list");

const newGrandPrixBtn =
    document.getElementById("new-grand-prix-btn");

const oddsList =
    document.getElementById("odds-list");


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
// ODDS MODEL SETTINGS
// =========================================

const ODDS_WEIGHTS = {
    gpWinRate: 0.40,
    averageGPPoints: 0.30,
    raceWinRate: 0.20,
    recentForm: 0.10
};


// Number of Grand Prix worth of "average player"
// data we blend into small samples.
const GP_PRIOR_STRENGTH = 3;

// 3 Grand Prix × 4 races
const RACE_PRIOR_STRENGTH = 12;

// Number of recent Grand Prix considered
const RECENT_GP_COUNT = 5;


// =========================================
// LOAD PLAYERS
// =========================================

async function loadPlayers() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/players`
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load players"
            );
        }

        players = await response.json();

        displayPlayers();

    } catch (error) {

        console.error(
            "Error loading players:",
            error
        );

    }

}


// =========================================
// LOAD GRAND PRIX HISTORY
// =========================================

async function loadGrandPrixHistory() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/grand-prix`
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load Grand Prix history"
            );
        }

        grandPrixHistory =
            await response.json();

        console.log(
            "Loaded history for odds:",
            grandPrixHistory
        );

    } catch (error) {

        console.error(
            "Could not load history for odds:",
            error
        );

        // Equal-ish odds will still work
        // if history cannot be loaded.
        grandPrixHistory = [];

    }

}


// =========================================
// DISPLAY PLAYER SELECTION
// =========================================

function displayPlayers() {

    playerList.innerHTML = "";

    players.forEach(player => {

        const label =
            document.createElement("label");

        label.classList.add(
            "player-card"
        );

        label.innerHTML = `

            <input
                type="checkbox"
                value="${player.playerId}"
            >

            <img
                src="../images/characters/${player.profileImage}"
                alt="${player.name}"
                class="player-profile-image"
            >

            <span class="player-name-label">
                ${player.name}
            </span>

        `;

        playerList.appendChild(label);

    });

}


// =========================================
// START GRAND PRIX
// =========================================

startGrandPrixBtn.addEventListener(
    "click",
    async () => {

        selectedPlayers = Array.from(
            document.querySelectorAll(
                "#player-list input:checked"
            )
        ).map(input => {

            return players.find(
                player =>
                    player.playerId ===
                    Number(input.value)
            );

        });


        if (selectedPlayers.length < 2) {

            console.warn(
                "Select at least 2 players."
            );

            return;

        }


        if (selectedPlayers.length > 4) {

            console.warn(
                "Select 4 players or fewer."
            );

            return;

        }


        // Reload history so odds always use
        // the newest completed Grand Prix.
        await loadGrandPrixHistory();


        // Calculate pre-Grand Prix odds
        renderGrandPrixOdds();


        racesContainer.innerHTML = "";


        for (
            let raceNumber = 1;
            raceNumber <= 4;
            raceNumber++
        ) {

            createRaceCard(raceNumber);

        }


        grandPrixSection.classList.remove(
            "hidden"
        );


        updateScoreboard();

    }
);


// =========================================
// PLAYER MATCHING HELPER
// =========================================

function recordMatchesPlayer(
    record,
    player
) {

    if (!record) {
        return false;
    }


    if (
        record.playerId !== undefined &&
        record.playerId !== null
    ) {

        return Number(record.playerId) ===
            Number(player.playerId);

    }


    const recordName =
        record.playerNameAtTime ||
        record.playerName ||
        record.name;


    return recordName === player.name;

}


// =========================================
// NEUTRAL AVERAGE GP POINTS
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
            pointsByPlace[place] || 0
        );

    }


    const averagePointsPerRace =
        availablePoints.reduce(
            (sum, points) =>
                sum + points,
            0
        ) /
        availablePoints.length;


    // 4 races per Grand Prix
    return averagePointsPerRace * 4;

}


// =========================================
// COLLECT HISTORICAL PLAYER STATS
// =========================================

function getPlayerOddsStats(player) {

    let gpPlayed = 0;
    let gpWins = 0;
    let totalGPPoints = 0;

    let totalRaces = 0;
    let raceWins = 0;

    const recentGrandPrix = [];


    grandPrixHistory.forEach(gp => {

        const standings =
            gp.finalStandings || [];


        const standingIndex =
            standings.findIndex(
                standing =>
                    recordMatchesPlayer(
                        standing,
                        player
                    )
            );


        if (standingIndex !== -1) {

            const standing =
                standings[standingIndex];


            gpPlayed++;

            totalGPPoints +=
                standing.points || 0;


            if (standingIndex === 0) {
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
                    standing.points || 0

            });

        }


        (gp.races || []).forEach(race => {

            const result =
                (race.results || [])
                    .find(
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
                Number(result.placement) === 1
            ) {

                raceWins++;

            }

        });

    });


    recentGrandPrix.sort(
        (a, b) =>
            b.date - a.date
    );


    const latestResults =
        recentGrandPrix.slice(
            0,
            RECENT_GP_COUNT
        );


    const recentPoints =
        latestResults.reduce(
            (sum, gp) =>
                sum + gp.points,
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
// CALCULATE PLAYER POWER RATING
// =========================================

function calculatePlayerPowerRating(
    player,
    playerCount
) {

    const stats =
        getPlayerOddsStats(player);


    // If everyone were equally good,
    // this would be their expected win rate.
    const neutralWinRate =
        1 / playerCount;


    const neutralGPPoints =
        getNeutralAverageGPPoints(
            playerCount
        );


    // -----------------------------------------
    // SMOOTHED GRAND PRIX WIN RATE
    // -----------------------------------------

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


    // -----------------------------------------
    // SMOOTHED AVERAGE GP POINTS
    // -----------------------------------------

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


    // Normalize because maximum GP score
    // is 20 points.
    const normalizedGPPoints =
        Math.min(
            smoothedAverageGPPoints / 20,
            1
        );


    // -----------------------------------------
    // SMOOTHED RACE WIN RATE
    // -----------------------------------------

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


    // -----------------------------------------
    // RECENT FORM
    // -----------------------------------------

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
            smoothedRecentPoints / 20,
            1
        );


    // -----------------------------------------
    // FINAL POWER RATING
    // -----------------------------------------

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

        stats,

        metrics: {

            gpWinRate:
                smoothedGPWinRate,

            averageGPPoints:
                smoothedAverageGPPoints,

            raceWinRate:
                smoothedRaceWinRate,

            recentAveragePoints:
                smoothedRecentPoints

        }

    };

}


// =========================================
// CALCULATE GRAND PRIX ODDS
// =========================================

function calculateGrandPrixOdds() {

    const playerCount =
        selectedPlayers.length;


    const ratings =
        selectedPlayers.map(
            player =>
                calculatePlayerPowerRating(
                    player,
                    playerCount
                )
        );


    // Slightly exaggerate real differences
    // without making the model too aggressive.
    const ODDS_SHARPNESS = 1.25;


    ratings.forEach(rating => {

        rating.adjustedRating =
            Math.pow(
                Math.max(
                    rating.powerRating,
                    0.0001
                ),
                ODDS_SHARPNESS
            );

    });


    const totalRating =
        ratings.reduce(
            (sum, rating) =>
                sum +
                rating.adjustedRating,
            0
        );


    ratings.forEach(rating => {

        rating.probability =
            totalRating > 0
                ? rating.adjustedRating /
                    totalRating
                : 1 / playerCount;


        rating.americanOdds =
            probabilityToAmericanOdds(
                rating.probability
            );

    });


    return ratings.sort(
        (a, b) =>
            b.probability -
            a.probability
    );

}


// =========================================
// CONVERT PROBABILITY TO AMERICAN ODDS
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


    if (probability > 0.5) {

        odds =
            -100 *
            probability /
            (1 - probability);

    } else {

        odds =
            100 *
            (1 - probability) /
            probability;

    }


    // Round to nearest 5 like sportsbook lines.
    odds =
        Math.round(
            odds / 5
        ) * 5;


    if (odds === -100) {
        return "+100";
    }


    if (odds > 0) {
        return `+${odds}`;
    }


    return `${odds}`;

}


// =========================================
// ODDS LABEL
// =========================================

function getOddsLabel(
    index,
    totalPlayers
) {

    if (index === 0) {
        return "Favorite";
    }


    if (
        index === totalPlayers - 1 &&
        totalPlayers > 2
    ) {

        return "Underdog";

    }


    return "Contender";

}


// =========================================
// RENDER GRAND PRIX ODDS
// =========================================

function renderGrandPrixOdds() {

    if (!oddsList) {
        return;
    }


    const odds =
        calculateGrandPrixOdds();


    oddsList.innerHTML =
        odds.map(
            (entry, index) => {

                const percentage =
                    (
                        entry.probability *
                        100
                    ).toFixed(1);


                const label =
                    getOddsLabel(
                        index,
                        odds.length
                    );


                return `

                    <div
                        class="odds-card ${
                            index === 0
                                ? "odds-favorite"
                                : ""
                        }"
                    >

                        <div class="odds-player">

                            <img
                                src="../images/characters/${entry.player.profileImage}"
                                alt="${entry.player.name}"
                                class="odds-player-image"
                            >

                            <div class="odds-player-info">

                                <strong>
                                    ${entry.player.name}
                                </strong>

                                <span class="odds-label">
                                    ${label}
                                </span>

                            </div>

                        </div>


                        <div class="odds-numbers">

                            <span class="american-odds">
                                ${entry.americanOdds}
                            </span>

                            <span class="win-probability">
                                ${percentage}% chance
                            </span>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


// =========================================
// TRACK PICKER
// =========================================

function createTrackPickerHTML() {

    return marioKartTracks.map(
        cup => `

            <div class="track-cup">

                <h4>
                    ${cup.cup}
                </h4>

                <div class="track-grid">

                    ${cup.tracks.map(
                        track => `

                            <button
                                type="button"
                                class="track-option"
                                data-track="${track}"
                            >
                                ${track}
                            </button>

                        `
                    ).join("")}

                </div>

            </div>

        `
    ).join("");

}


// =========================================
// CREATE RACE CARD
// =========================================

function createRaceCard(
    raceNumber
) {

    const raceCard =
        document.createElement("div");


    raceCard.classList.add(
        "race-card"
    );


    raceCard.innerHTML = `

        <h3>
            Race ${raceNumber}
        </h3>


        <label>
            Track Name
        </label>


        <input
            type="hidden"
            id="race-${raceNumber}-track"
        >


        <button
            type="button"
            class="track-picker-btn"
        >

            <span
                id="race-${raceNumber}-track-label"
            >
                Pick a track
            </span>

            <span>
                🏁
            </span>

        </button>


        <div class="track-picker hidden">

            ${createTrackPickerHTML()}

        </div>


        ${selectedPlayers.map(
            player => `

                <div class="player-result">

                    <div class="player-name">

                        <img
                            src="../images/characters/${player.profileImage}"
                            alt="${player.name}"
                            class="race-player-image"
                        >

                        <span>
                            ${player.name}
                        </span>

                    </div>


                    <select
                        class="placement-select"
                        data-race="${raceNumber}"
                        data-player-id="${player.playerId}"
                    >

                        <option value="">
                            Placement
                        </option>

                        ${selectedPlayers.map(
                            (_, index) => `

                                <option
                                    value="${index + 1}"
                                >
                                    ${index + 1}
                                </option>

                            `
                        ).join("")}

                    </select>


                    <input
                        type="text"
                        class="player-note"
                        data-race="${raceNumber}"
                        data-player-id="${player.playerId}"
                        placeholder="Time (Optional)"
                    >

                </div>

            `
        ).join("")}

    `;


    racesContainer.appendChild(
        raceCard
    );


    const trackPickerBtn =
        raceCard.querySelector(
            ".track-picker-btn"
        );


    const trackPicker =
        raceCard.querySelector(
            ".track-picker"
        );


    trackPickerBtn.addEventListener(
        "click",
        () => {

            trackPicker.classList.toggle(
                "hidden"
            );

        }
    );


    raceCard
        .querySelectorAll(
            ".track-option"
        )
        .forEach(option => {

            option.addEventListener(
                "click",
                () => {

                    const selectedTrack =
                        option.dataset.track;


                    document.getElementById(
                        `race-${raceNumber}-track`
                    ).value =
                        selectedTrack;


                    document.getElementById(
                        `race-${raceNumber}-track-label`
                    ).textContent =
                        selectedTrack;


                    raceCard
                        .querySelectorAll(
                            ".track-option"
                        )
                        .forEach(button => {

                            button.classList.remove(
                                "selected"
                            );

                        });


                    option.classList.add(
                        "selected"
                    );


                    trackPicker.classList.add(
                        "hidden"
                    );

                }
            );

        });


    const selects =
        raceCard.querySelectorAll(
            ".placement-select"
        );


    selects.forEach(select => {

        select.addEventListener(
            "change",
            () => {

                preventDuplicatePlacements(
                    raceNumber
                );

                updateScoreboard();

            }
        );

    });

}


// =========================================
// PREVENT DUPLICATE PLACEMENTS
// =========================================

function preventDuplicatePlacements(
    raceNumber
) {

    const raceSelects =
        document.querySelectorAll(
            `.placement-select[data-race="${raceNumber}"]`
        );


    const selectedValues =
        Array.from(raceSelects)
            .map(
                select =>
                    select.value
            )
            .filter(
                value =>
                    value !== ""
            );


    raceSelects.forEach(select => {

        const currentValue =
            select.value;


        Array.from(
            select.options
        ).forEach(option => {

            if (
                option.value === ""
            ) {
                return;
            }


            option.disabled =
                selectedValues.includes(
                    option.value
                ) &&
                option.value !==
                    currentValue;

        });

    });

}


// =========================================
// LIVE SCOREBOARD
// =========================================

function updateScoreboard() {

    const scores = {};


    selectedPlayers.forEach(player => {

        scores[player.playerId] = {

            playerId:
                player.playerId,

            playerNameAtTime:
                player.name,

            profileImageAtTime:
                player.profileImage,

            points: 0

        };

    });


    document
        .querySelectorAll(
            ".placement-select"
        )
        .forEach(select => {

            const playerId =
                Number(
                    select.dataset.playerId
                );


            const placement =
                select.value;


            if (
                placement &&
                scores[playerId]
            ) {

                scores[playerId].points +=
                    pointsByPlace[
                        placement
                    ] || 0;

            }

        });


    const sortedScores =
        Object.values(scores)
            .sort(
                (a, b) =>
                    b.points -
                    a.points
            );


    const totalBeers =
        selectedPlayers.length * 2;


    scoreboardList.innerHTML = `

        ${sortedScores.map(
            player => `

                <div class="score-row">

                    <span class="score-player">

                        <img
                            src="../images/characters/${player.profileImageAtTime}"
                            alt="${player.playerNameAtTime}"
                            class="score-player-image"
                        >

                        ${player.playerNameAtTime}

                    </span>

                    <strong>
                        ${player.points} pts
                    </strong>

                </div>

            `
        ).join("")}


        <div class="beer-tracker">

            🍺 Beers for this Grand Prix:

            <strong>
                ${totalBeers}
            </strong>

        </div>

    `;

}


// =========================================
// BUILD GRAND PRIX DATA
// =========================================

function buildGrandPrixData() {

    const finalScores =
        getFinalScores();


    const raceData = {

        grandPrixName:
            document
                .getElementById(
                    "grand-prix-name"
                )
                .value
                .trim()
            ||
            "Untitled Grand Prix",

        datePlayed:
            new Date().toISOString(),

        winner:
            finalScores[0],

        totalPlayers:
            selectedPlayers.length,

        players:
            selectedPlayers.map(
                player => ({

                    playerId:
                        player.playerId,

                    playerNameAtTime:
                        player.name,

                    profileImageAtTime:
                        player.profileImage

                })
            ),

        races: [],

        finalStandings:
            finalScores

    };


    for (
        let raceNumber = 1;
        raceNumber <= 4;
        raceNumber++
    ) {

        const race = {

            raceNumber:
                raceNumber,

            track:
                document
                    .getElementById(
                        `race-${raceNumber}-track`
                    )
                    .value
                    .trim(),

            results: []

        };


        selectedPlayers.forEach(
            player => {

                const placement =
                    document.querySelector(
                        `.placement-select[data-race="${raceNumber}"][data-player-id="${player.playerId}"]`
                    ).value;


                const note =
                    document.querySelector(
                        `.player-note[data-race="${raceNumber}"][data-player-id="${player.playerId}"]`
                    ).value;


                race.results.push({

                    playerId:
                        player.playerId,

                    playerNameAtTime:
                        player.name,

                    profileImageAtTime:
                        player.profileImage,

                    placement:
                        Number(placement),

                    points:
                        pointsByPlace[
                            placement
                        ] || 0,

                    note:
                        note

                });

            }
        );


        raceData.races.push(
            race
        );

    }


    return raceData;

}


// =========================================
// SUBMIT GRAND PRIX
// =========================================

grandPrixForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const raceData =
            buildGrandPrixData();


        console.log(
            "Grand Prix Data:",
            raceData
        );


        await saveGrandPrixToDatabase(
            raceData
        );


        showFinalResults(
            raceData.finalStandings
        );


        grandPrixSection.classList.add(
            "hidden"
        );


        finalResultsSection.classList.remove(
            "hidden"
        );

    }
);


// =========================================
// FINAL SCORES
// =========================================

function getFinalScores() {

    const scores = {};


    selectedPlayers.forEach(player => {

        scores[player.playerId] = {

            playerId:
                player.playerId,

            playerNameAtTime:
                player.name,

            profileImageAtTime:
                player.profileImage,

            points: 0

        };

    });


    document
        .querySelectorAll(
            ".placement-select"
        )
        .forEach(select => {

            const playerId =
                Number(
                    select.dataset.playerId
                );


            const placement =
                select.value;


            if (
                placement &&
                scores[playerId]
            ) {

                scores[playerId].points +=
                    pointsByPlace[
                        placement
                    ] || 0;

            }

        });


    return Object
        .values(scores)
        .sort(
            (a, b) =>
                b.points -
                a.points
        );

}


// =========================================
// FINAL PODIUM
// =========================================

function showFinalResults(
    finalScores
) {

    const medals = [
        "🥇",
        "🥈",
        "🥉",
        "4️⃣"
    ];


    podiumList.innerHTML =
        finalScores.map(
            (player, index) => `

                <div
                    class="podium-card ${
                        index === 0
                            ? "first"
                            : ""
                    }"
                >

                    <span class="podium-place">
                        ${medals[index]}
                    </span>


                    <img
                        src="../images/characters/${player.profileImageAtTime}"
                        alt="${player.playerNameAtTime}"
                        class="podium-player-image"
                    >


                    <span class="podium-player-name">
                        ${player.playerNameAtTime}
                    </span>


                    <strong>
                        ${player.points} pts
                    </strong>

                </div>

            `
        ).join("");

}


// =========================================
// NEW GRAND PRIX
// =========================================

newGrandPrixBtn.addEventListener(
    "click",
    () => {

        location.reload();

    }
);


// =========================================
// SAVE GRAND PRIX
// =========================================

async function saveGrandPrixToDatabase(
    raceData
) {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/grand-prix`,
            {

                method: "POST",

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


        if (!response.ok) {

            throw new Error(
                "Failed to save Grand Prix"
            );

        }


        const savedGrandPrix =
            await response.json();


        console.log(
            "Saved to MongoDB:",
            savedGrandPrix
        );


    } catch (error) {

        console.error(
            "Error saving Grand Prix:",
            error
        );

    }

}


// =========================================
// START PAGE
// =========================================

loadPlayers();
loadGrandPrixHistory();