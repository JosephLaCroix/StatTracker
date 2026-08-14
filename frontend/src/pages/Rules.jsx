import { useEffect, useState } from "react";
import { Link } from "react-router";
import "../styles/rules.css";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function Rules() {
    const [bitchList, setBitchList] = useState([]);
const [bitchListLoading, setBitchListLoading] = useState(true);

useEffect(() => {

    async function loadBitchList() {

        try {

            const response = await fetch(
                `${API_BASE_URL}/api/players`
            );

            if (!response.ok) {
                throw new Error("Failed to load players");
            }

            const players = await response.json();

            const listedPlayers = players.filter(
                player => player.onBitchList === true
            );

            setBitchList(listedPlayers);

        } catch (error) {

            console.error(
                "Error loading Bitch List:",
                error
            );

        } finally {

            setBitchListLoading(false);

        }

    }

    loadBitchList();

}, []);
    return (
        <>
            <header className="rules-header">
               <div className = "homebckg"> <Link to="/" className="rules-home-link">
                    ← Home
                </Link>
                </div>

                <div className="rules-seal">
                    🍺 🏁 🍺
                </div>

                <h1>
                    The Constitution of Beerio Kart
                </h1>

                <p className="rules-subtitle">
                    We the Racers, in Order to form a more perfect pregame (or postgame if ya freaky)...
                </p>
            </header>


            <main className="rules-container">

                {/* PREAMBLE */}

                <section className="constitution-card preamble-card">

                    <span className="article-label">
                        PREAMBLE
                    </span>

                    <h2>
                        We the Racers
                    </h2>

                    <p>
                        We, the participants of Beerio Kart, in pursuit of
                        questionable racing decisions, glorious victories,
                        devastating blue shells, the preservation of
                        competitive drinking traditions and getting sloshed, hereby establish
                        this Constitution as the supreme law of the Grand Prix.
                    </p>

                    <p>
                        All racers who enter competition do so under these
                        sacred articles and agree that ignorance of the law
                        shall not protect them from ridicule, disqualification,
                        or placement upon the Bitch List.
                    </p>

                </section>


                {/* ARTICLE I */}

                <section className="constitution-card">

                    <span className="article-label">
                        ARTICLE I
                    </span>

                    <h2>
                        🍺 The Beer Requirement
                    </h2>

                    <div className="rule-item">
                        <span className="rule-number">§ 1.01</span>

                        <p>
                            Each racer shall finish
                            <strong> two beers</strong>, or another number
                            unanimously established before the Grand Prix,
                            before completing the competition.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 1.02</span>

                        <p>
                            The required number of beers must be declared
                            before racing begins. Mid-Grand-Prix amendments
                            shall not be recognized merely because somebody
                            is losing or being lame.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 1.03</span>

                        <p>
                            Beerio kart is a beer drinking game and the name of the game is literaly fucking BEERio Kart.
                            While racers are permitted to drink beverages of their choice, such as surfsides, happy
                            dads, or other alcoholic beverages, they are subject to ridicule and hilarious jokes made about them for not drinking beer.
                        </p>
                    </div>

                </section>


                {/* ARTICLE II */}

                <section className="constitution-card important-article">

                    <span className="article-label">
                        ARTICLE II
                    </span>

                    <h2>
                        🛑 The Drinking & Driving Clause
                    </h2>

                    <div className="rule-item">
                        <span className="rule-number">§ 2.01</span>

                        <p>
                            <strong>
                                No racer may drink while actively driving.
                            </strong>
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 2.02</span>

                        <p>
                            Before drinking, the racer must completely stop
                            their kart and release all driving controls.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 2.03</span>

                        <p>
                            Drinking while accelerating, steering, drifting,
                            or otherwise controlling the kart constitutes an
                            immediate violation and potential disqualification, if the other players deemed
                            it necessary.
                        </p>
                    </div>

                </section>


                {/* ARTICLE III */}

                <section className="constitution-card">

                    <span className="article-label">
                        ARTICLE III
                    </span>

                    <h2>
                        🚫 The Vessel Clause
                    </h2>

                    <div className="rule-item">
                        <span className="rule-number">§ 3.01</span>

                        <p>
                            Beer shall not be consumed from a cup, glass,
                            tumbler, chalice, goblet, mug, or other substitute
                            drinking vessel (SCHWENK) unless approved by the other racers.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 3.02</span>

                        <p>
                            The original can or bottle shall serve as the
                            official Beerio Kart vessel unless house rules
                            unanimously establish otherwise before play begins.
                        </p>
                    </div>

                </section>


                {/* ARTICLE IV */}

                <section className="constitution-card">

                    <span className="article-label">
                        ARTICLE IV
                    </span>

                    <h2>
                        🚦 The Starting Line Exception
                    </h2>

                    <div className="rule-item">
                        <span className="rule-number">§ 4.01</span>

                        <p>
                            Drinking immediately at the start of a race may be
                            permitted when the established
                            <strong> House Rules</strong> allow it.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 4.02</span>

                        <p>
                            Whether drinking off the start is legal must be
                            decided before the race begins.
                        </p>
                    </div>

                </section>


                {/* ARTICLE V */}

                <section className="constitution-card">

                    <span className="article-label">
                        ARTICLE V
                    </span>

                    <h2>
                        👀 The Pocket-Watching Act
                    </h2>

                    <div className="rule-item">
                        <span className="rule-number">§ 5.01</span>

                        <p>
                            <strong>No pocket watching another racers beer/drink during a prix.</strong>
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 5.02</span>

                        <p>
                            Racers shall concern themselves with their own beer,
                            their own kart, and their own inability to avoid
                            banana peels, shells, or other hazards that may impede their race.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 5.03</span>

                        <p>
                            Excessive surveillance, commentary (unless you wanna), measuring,
                            shaking, inspecting, or otherwise obsessing over
                            another racer's remaining beer is hereby declared
                            lame.
                        </p>
                    </div>

                </section>


                {/* ARTICLE VI */}

                <section className="constitution-card bitch-list-card">

                    <span className="article-label">
                        ARTICLE VI
                    </span>

                    <h2>
                        📜 The Bitch List
                    </h2>

                    <div className="rule-item">
                        <span className="rule-number">§ 6.01</span>

                        <p>
                            Any racer who fails to complete their required
                            beer obligation before the competition ends shall
                            be <strong>disqualified.</strong> However, if there is a arguable amount of drink left 
                            in the racers vessel, the potential <strong>BITCH</strong> may pour the amount of beer they have left
                            into the bottom indent of a 12 oz beer can. If the indent overflows, this racer is indeed a pussy and will
                            be on the <strong>Bitch List</strong>. If the indent does not overflow, the racer is not a pussy and can talk their shit to the players who 
                            argued that they had an arguable amount of beer left.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 6.02</span>

                        <p>
                            Any racer violating the bitch list amendments shall be placed upon the
                            official <strong>Bitch List</strong> and be called a pussy.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 6.03</span>

                        <p>
                            Placement upon the Bitch List shall remain part of
                            league history until such time as the governing
                            body determines that sufficient redemption has
                            occurred.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 6.04</span>

                        <p>
                            If a players throws up, passes out, or is being a huge pussy,
                            they may be placed on the Bitch List at the discretion of the other players.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 6.05</span>

                        <p>
                            Current players on the Bitch List may be removed at the discretion of the other players. However the vote must be 
unanimous and the player must have redeemed themselves in the eyes of the other players by performing something of utmost ferda-ness
                        </p>
                    </div>

    <div className="official-bitch-list">

    <div className="bitch-list-heading">

        <span>
            OFFICIAL LEAGUE RECORD
        </span>

        <h3>
            📜 The Bitch List 📜
        </h3>

        <p>
            The following racers have been formally
            entered into the Beerio Kart record.
        </p>

    </div>


    {bitchListLoading ? (

        <div className="bitch-list-empty">
            Loading official records...
        </div>

    ) : bitchList.length === 0 ? (

        <div className="bitch-list-empty">

            <span className="clean-record-icon">
                🫡
            </span>

            <strong>
                The Record Is Clean
            </strong>

            <p>
                No racers have disgraced themselves...
                yet.
            </p>

        </div>

    ) : (

        <div className="bitch-list-grid">

            {bitchList.map(player => (

                <div
                    className="bitch-list-player"
                    key={player._id}
                >

                    <div className="bitch-list-mugshot">

                        <img
                            src={`/images/characters/${
                                player.profileImage ||
                                "mario.png"
                            }`}
                            alt={player.name}
                        />

                    </div>

                    <div className="bitch-list-player-info">

                        <span className="bitch-list-status">
                            Certified Bitch
                        </span>

                        <h4>
                            {player.name}
                        </h4>

                        <p>
                            Failure to satisfy Beerio
                            obligations.
                        </p>

                    </div>

                </div>

            ))}

        </div>

    )}

</div>

                </section>


                {/* ARTICLE VII */}

                <section className="constitution-card">

                    <span className="article-label">
                        ARTICLE VII
                    </span>

                    <h2>
                        ⚖️ House Rules & Disputes
                    </h2>

                    <div className="rule-item">
                        <span className="rule-number">§ 7.01</span>

                        <p>
                            House Rules may supplement this Constitution but
                            must be announced before the Grand Prix begins.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 7.02</span>

                        <p>
                            Rules may not be invented halfway through a race
                            simply because somebody just discovered an
                            extremely convenient interpretation.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 7.03</span>

                        <p>
                            Any dispute not directly addressed by this
                            Constitution shall be settled by majority vote of
                            the racers not directly involved in the controversy.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 7.04</span>

                        <p>
                            An amendment may be proposed by any racer and shall be ratified by
                            unanimous vote of all racers present at the Grand Prix.
                            Any amendment that provides a player with a competitive advantage or loophole is not permitted.
                        </p>
                    </div>
                </section>


                {/* ARTICLE VIII */}

                <section className="constitution-card">

                    <span className="article-label">
                        ARTICLE VIII
                    </span>

                    <h2>
                        🏆 Competitive Integrity
                    </h2>

                    <div className="rule-item">
                        <span className="rule-number">§ 8.01</span>

                        <p>
                            All race placements shall be entered accurately
                            into the official Beerio Kart Stat Tracker.
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 8.02</span>

                        <p>
                            No racer shall intentionally falsify results,
                            alter history, or claim victory in a Grand Prix
                            they did not win. (cmon dont be that guy)
                        </p>
                    </div>

                    <div className="rule-item">
                        <span className="rule-number">§ 8.03</span>

                        <p>
                            Trash talk is protected speech.
                            However, statistical misinformation is not and shall be treated as law.
                        </p>
                    </div>

                </section>


                {/* ARTICLE IX */}

                <section className="constitution-card">

                    <span className="article-label">
                        ARTICLE IX
                    </span>

                    <h2>
                        🏁 The Spirit of Beerio Kart
                    </h2>

                    <p>
                        Beerio Kart exists for competition, stellar pregames, hilarious
                        moments, ridiculous
                        rivalries, and the pursuit
                        of eternal leaderboard superiority.
                    </p>

                    <p>
                        Racers shall compete fiercely, accept the consequences
                        of blue shells with whatever dignity remains available,
                        and respect the ruling of the Stat Tracker.
                    </p>

                </section>


                {/* RATIFICATION */}

                <section className="ratification-card">

                    <div className="ratification-seal">
                        🏁
                    </div>

                    <span className="article-label">
                        RATIFICATION
                    </span>

                    <h2>
                        So It Is Written.
                    </h2>

                    <p>
                        By selecting one's name and entering a Beerio Kart
                        Grand Prix, a racer recognizes the authority of this
                        Constitution and accepts all victories, defeats,
                        statistics, rulings, and Bitch List consequences
                        arising therefrom.
                    </p>

                    <div className="constitution-signature">
                        Beerio Kart Racing Commission
                    </div>

                    <span className="constitution-date">
                        In Beer We Trust 🍺
                    </span>

                </section>


                <section className="real-world-note">

                    <strong>
                        Real-world rule:
                    </strong>

                    <span>
                        If one players claims to be getting "fucked-up" on said night and does not perform to the 
                        best of their ability, they may be placed on the Bitch List at the discretion of the other players. This is a real-world rule and is not part of the official Beerio Kart Constitution.
                    </span>

                </section>

            </main>
        </>
    );
}

export default Rules;