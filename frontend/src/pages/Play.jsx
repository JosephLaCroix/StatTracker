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

                    return currentIds.filter(
                        id =>
                            id !== playerId
                    );

                }


                if (
                    currentIds.length >= 4
                ) {

                    setPageMessage(
                        "You can select a maximum of 4 players."
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
    // START GRAND PRIX
    // =========================================

    async function startGrandPrix() {

        setPageMessage("");


        if (
            selectedPlayerIds.length < 2
        ) {

            setPageMessage(
                "Select at least 2 players."
            );

            return;

        }


        if (
            selectedPlayerIds.length > 4
        ) {

            setPageMessage(
                "Select 4 players or fewer."
            );

            return;

        }


        const selected =
            players.filter(
                player =>
                    selectedPlayerIds.includes(
                        player.playerId
                    )
            );


        // Refresh history so odds use
        // the newest completed GP.
        await loadGrandPrixHistory();


        setActiveGrandPrixPlayers(
            selected
        );


        setRaces(
            createEmptyRaces()
        );


        setGrandPrixStarted(true);

        setFinalResults(null);

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


                const ratings =
                    activeGrandPrixPlayers.map(
                        player =>
                            calculatePlayerPowerRating(
                                player,
                                playerCount
                            )
                    );


                const ODDS_SHARPNESS =
                    1.25;


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
                                    ?
                                    rating.adjustedRating /
                                    totalRating
                                    :
                                    1 /
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
                grandPrixHistory
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
    // LIVE SCOREBOARD
    // =========================================

    const currentStandings =
        useMemo(
            () => {

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
                races
            ]
        );


    const totalBeers =
        activeGrandPrixPlayers.length *
        2;


    // =========================================
    // BUILD GRAND PRIX DATA
    // =========================================

    function buildGrandPrixData() {

        const finalScores =
            currentStandings;


        return {

            grandPrixName:
                grandPrixName.trim() ||
                "Untitled Grand Prix",

            datePlayed:
                new Date()
                    .toISOString(),

            winner:
                finalScores[0],

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
                            player.profileImage

                    })
                ),

            races:
                races.map(
                    race => ({

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

                                            placement:
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
                                )

                    })
                ),

            finalStandings:
                finalScores

        };

    }


    // =========================================
    // VALIDATE GRAND PRIX
    // =========================================

    function validateGrandPrix() {

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


            for (
                const player of
                activeGrandPrixPlayers
            ) {

                const placement =
                    race.results[
                        player.playerId
                    ]?.placement;


                if (
                    !placement
                ) {

                    setPageMessage(
                        `Enter every placement for Race ${race.raceNumber}.`
                    );

                    return false;

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

        setActiveGrandPrixPlayers([]);

        setGrandPrixName("");

        setRaces(
            createEmptyRaces()
        );

        setGrandPrixStarted(false);

        setFinalResults(null);

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
                                                        entry.player
                                                            .playerId
                                                    }
                                                >

                                                    <div className="odds-player">

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
                                                PLAYER RESULTS
                                            ================== */}

                                            {activeGrandPrixPlayers
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

                                    {currentStandings
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


                                    <div className="beer-tracker">

                                        🍺 Beers for this Grand Prix:{" "}

                                        <strong>
                                            {
                                                totalBeers
                                            }
                                        </strong>

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