import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import "../styles/home.css";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function Home() {
    const [grandPrixHistory, setGrandPrixHistory] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        async function loadHomeDashboard() {
            try {
                const [
                    historyResponse,
                    playersResponse
                ] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/grand-prix`),
                    fetch(`${API_BASE_URL}/api/players`)
                ]);

                if (!historyResponse.ok) {
                    throw new Error("Failed to load Grand Prix history");
                }

                const historyData =
                    await historyResponse.json();

                let playersData = [];

                if (playersResponse.ok) {
                    playersData =
                        await playersResponse.json();
                }

                setGrandPrixHistory(historyData);
                setPlayers(playersData);
                setLoadError(false);

            } catch (error) {
                console.error(
                    "Error loading home dashboard:",
                    error
                );

                setLoadError(true);

            } finally {
                setLoading(false);
            }
        }

        loadHomeDashboard();
    }, []);


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


    function getCurrentProfileImage(
        name,
        fallbackImage = "mario.png"
    ) {
        const currentPlayer =
            players.find(
                player =>
                    player.name === name
            );

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
    // CALCULATE PLAYER STATS
    // =========================================

    const playerStats = useMemo(() => {
        const stats = {};

        const chronologicalHistory =
            [...grandPrixHistory].sort(
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


            (gp.races || []).forEach(
                race => {
                    (race.results || []).forEach(
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

                            player.totalRacePlacements +=
                                placement;

                            if (placement === 1) {
                                player.raceWins++;
                            }
                        }
                    );
                }
            );
        });


        Object.values(stats).forEach(
            player => {
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
                        ? player.totalRacePlacements /
                            player.totalRaces
                        : null;

                player.averageGPFinish =
                    player.grandPrixPlayed
                        ? player.totalGPPlacement /
                            player.grandPrixPlayed
                        : null;


                const lastFive =
                    player.gpResults.slice(-5);

                if (lastFive.length) {
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


                player.powerRating =
                    Number(
                        (
                            adjustedRating *
                            100
                        ).toFixed(1)
                    );
            }
        );


        return Object.values(stats);

    }, [grandPrixHistory, players]);


    // =========================================
    // DASHBOARD VALUES
    // =========================================

    const newestGrandPrix = useMemo(() => {
        if (!grandPrixHistory.length) {
            return null;
        }

        return [...grandPrixHistory]
            .sort(
                (a, b) =>
                    getGrandPrixDate(b) -
                    getGrandPrixDate(a)
            )[0];

    }, [grandPrixHistory]);


    const recentWinner = useMemo(() => {
        if (!newestGrandPrix) {
            return null;
        }

        const winner =
            newestGrandPrix
                .finalStandings?.[0] ||
            newestGrandPrix.winner ||
            {};

        const name =
            getPlayerName(winner) ||
            "Unknown";

        return {
            name,

            profileImage:
                getCurrentProfileImage(
                    name,
                    getHistoricalProfileImage(
                        winner
                    )
                ),

            points:
                Number(
                    winner.points || 0
                ),

            grandPrixName:
                newestGrandPrix
                    .grandPrixName ||
                "Untitled Grand Prix"
        };

    }, [newestGrandPrix, players]);


    const powerLeader = useMemo(() => {
        if (!playerStats.length) {
            return null;
        }

        return [...playerStats]
            .sort(
                (a, b) =>
                    b.powerRating -
                    a.powerRating
            )[0];

    }, [playerStats]);


    const hottestPlayer = useMemo(() => {
        const eligible =
            playerStats.filter(
                player =>
                    player
                        .recentAverageFinish !==
                    null
            );

        if (!eligible.length) {
            return null;
        }

        return [...eligible]
            .sort(
                (a, b) =>
                    a.recentAverageFinish -
                    b.recentAverageFinish
            )[0];

    }, [playerStats]);


    const recentGrandPrix = useMemo(() => {
        return [...grandPrixHistory]
            .sort(
                (a, b) =>
                    getGrandPrixDate(b) -
                    getGrandPrixDate(a)
            )
            .slice(0, 5);

    }, [grandPrixHistory]);


    // =========================================
    // JSX
    // =========================================

    return (
        <>
            <div className="kart-animation">
                🏎️
            </div>

            <div className="coin coin-1">
                
            </div>

            <div className="coin coin-2">
                
            </div>

            <div className="coin coin-3">
                
            </div>


            <nav id="main-nav">

                <h1>
                    🏁 Mario Kart Stat Tracker 🏁
                </h1>


                <ul className="nav-links">

                    <li id="Play">

                        <Link
                            id="play-link"
                            to="/play"
                        >
                            <strong>
                                🏎️ Play 🏎️
                            </strong>
                        </Link>

                    </li>


                    <li id="Stats">

                        <Link
                            id="stats-link"
                            to="/stats"
                        >
                            <strong>
                                📊 Stats 📊
                            </strong>
                        </Link>

                    </li>


                    <li id="Rules">

                        <Link
                            id="rules-link"
                            to="/rules"
                        >
                            <strong>
                                📜 Rules 📜
                            </strong>
                        </Link>

                    </li>


                    <li id="Settings">

                        <Link
                            id="settings-link"
                            to="/settings"
                        >
                            <strong>
                                ⚙️ Settings ⚙️
                            </strong>
                        </Link>

                    </li>

                </ul>

            </nav>


            <main className="home-main">


                <section className="about">

                    <span className="home-kicker">
                        BEERIO KART HQ
                    </span>

                    <h2>
                        Welcome!
                    </h2>

                    <p>
                        Track every Grand Prix,
                        player statistic,
                        rivalry, power ranking,
                        beer, and championship run.
                    </p>


                    <div className="home-actions">

                        <Link
                            to="/play"
                            className="home-action primary-home-action"
                        >
                            🏁 Start a Grand Prix
                        </Link>

                        <Link
                            to="/stats"
                            className="home-action secondary-home-action"
                        >
                            📊 View Full Stats
                        </Link>

                    </div>

                </section>


                <section className="home-dashboard">

                    <div className="dashboard-heading">

                        <div>

                            <span className="home-kicker">
                                LIVE FROM THE LEAGUE
                            </span>

                            <h2>
                                🏆 League Dashboard
                            </h2>

                        </div>

                        <p>
                            Updated automatically
                            from your Grand Prix history.
                        </p>

                    </div>


                    <div className="home-dashboard-grid">


                        <div className="home-stat-card">

                            <span className="home-stat-label">
                                MOST RECENT WINNER
                            </span>


                            <div className="home-player-stat">

                                {loading && (
                                    <div className="home-loading">
                                        Loading...
                                    </div>
                                )}


                                {!loading &&
                                loadError && (
                                    <div className="home-loading">
                                        Could not load stats.
                                    </div>
                                )}


                                {!loading &&
                                !loadError &&
                                !recentWinner && (
                                    <div className="home-loading">
                                        No Grand Prix yet.
                                    </div>
                                )}


                                {!loading &&
                                !loadError &&
                                recentWinner && (
                                    <>
                                        <img
                                            src={`/images/characters/${recentWinner.profileImage}`}
                                            alt={recentWinner.name}
                                            className="home-dashboard-image"
                                        />

                                        <h3>
                                            {recentWinner.name}
                                        </h3>

                                        <p>
                                            {
                                                recentWinner
                                                    .grandPrixName
                                            }
                                        </p>

                                        <div className="home-player-highlight">
                                            🏆 {
                                                recentWinner
                                                    .points
                                            } pts
                                        </div>
                                    </>
                                )}

                            </div>

                        </div>


                        <div className="home-stat-card power-home-card">

                            <span className="home-stat-label">
                                #1 POWER RANKING
                            </span>


                            <div className="home-player-stat">

                                {loading && (
                                    <div className="home-loading">
                                        Loading...
                                    </div>
                                )}


                                {!loading &&
                                !loadError &&
                                powerLeader && (
                                    <>
                                        <img
                                            src={`/images/characters/${powerLeader.profileImage}`}
                                            alt={powerLeader.name}
                                            className="home-dashboard-image"
                                        />

                                        <h3>
                                            👑 {
                                                powerLeader.name
                                            }
                                        </h3>

                                        <p>
                                            {
                                                powerLeader.gpWins
                                            } GP wins
                                        </p>

                                        <div className="home-player-highlight">
                                            {
                                                powerLeader
                                                    .powerRating
                                            } Power
                                        </div>
                                    </>
                                )}


                                {!loading &&
                                !loadError &&
                                !powerLeader && (
                                    <div className="home-loading">
                                        No rankings yet.
                                    </div>
                                )}

                            </div>

                        </div>


                        <div className="home-stat-card hot-home-card">

                            <span className="home-stat-label">
                                🔥 HOTTEST PLAYER
                            </span>


                            <div className="home-player-stat">

                                {loading && (
                                    <div className="home-loading">
                                        Loading...
                                    </div>
                                )}


                                {!loading &&
                                !loadError &&
                                hottestPlayer && (
                                    <>
                                        <img
                                            src={`/images/characters/${hottestPlayer.profileImage}`}
                                            alt={hottestPlayer.name}
                                            className="home-dashboard-image"
                                        />

                                        <h3>
                                            🔥 {
                                                hottestPlayer.name
                                            }
                                        </h3>

                                        <p>
                                            Last 5 Grand Prix
                                        </p>

                                        <div className="home-player-highlight">
                                            {
                                                hottestPlayer
                                                    .recentAverageFinish
                                                    .toFixed(2)
                                            } Avg Finish
                                        </div>
                                    </>
                                )}


                                {!loading &&
                                !loadError &&
                                !hottestPlayer && (
                                    <div className="home-loading">
                                        No recent form yet.
                                    </div>
                                )}

                            </div>

                        </div>


                        <div className="home-stat-card">

                            <span className="home-stat-label">
                                GRAND PRIX PLAYED
                            </span>

                            <div className="home-number-stat">

                                <strong>
                                    {
                                        grandPrixHistory.length
                                    }
                                </strong>

                                <span>
                                    total events
                                </span>

                            </div>

                        </div>

                    </div>

                </section>


                <section className="home-recent-section">

                    <div className="dashboard-heading">

                        <div>

                            <span className="home-kicker">
                                RECENT ACTION
                            </span>

                            <h2>
                                🏁 Recent Grand Prix
                            </h2>

                        </div>

                    </div>


                    <div className="recent-grand-prix-list">

                        {loading && (
                            <div className="home-loading">
                                Loading recent results...
                            </div>
                        )}


                        {!loading &&
                        loadError && (
                            <div className="home-loading">
                                Could not load recent Grand Prix.
                            </div>
                        )}


                        {!loading &&
                        !loadError &&
                        recentGrandPrix.length === 0 && (
                            <div className="home-loading">
                                No Grand Prix history yet.
                            </div>
                        )}


                        {!loading &&
                        !loadError &&
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

                            return (
                                <div
                                    className="recent-gp-row"
                                    key={
                                        gp._id ||
                                        `${
                                            gp.grandPrixName
                                        }-${getGrandPrixDate(gp)}`
                                    }
                                >

                                    <img
                                        src={`/images/characters/${winnerImage}`}
                                        alt={winnerName}
                                        className="recent-gp-image"
                                    />


                                    <div className="recent-gp-name">

                                        <strong>
                                            {
                                                gp.grandPrixName ||
                                                "Untitled Grand Prix"
                                            }
                                        </strong>

                                        <span>
                                            {date}
                                        </span>

                                    </div>


                                    <div className="recent-gp-winner">

                                        🏆 Winner:{" "}

                                        <strong>
                                            {winnerName}
                                        </strong>

                                    </div>


                                    <div className="recent-gp-points">
                                        {winnerPoints} pts
                                    </div>

                                </div>
                            );
                        })}

                    </div>

                </section>

            </main>
        </>
    );
}

export default Home;