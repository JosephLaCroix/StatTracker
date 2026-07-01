const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

const generalStatsDiv = document.getElementById("general-stats");
const playerListDiv = document.getElementById("player-list");
const historyListDiv = document.getElementById("history-list");

const playerModal = document.getElementById("player-modal");
const closeModalBtn = document.getElementById("close-modal");
const modalBody = document.getElementById("modal-body");

let grandPrixHistory = [];

tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        const tab = button.dataset.tab;

        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(content => content.classList.remove("active"));

        button.classList.add("active");
        document.getElementById(tab).classList.add("active");
    });
});

async function loadStatsData() {
    try {
        const response = await fetch("http://localhost:3000/api/grand-prix");
        grandPrixHistory = await response.json();

        renderGeneralStats();
        renderPlayerStats();
        renderHistory();
    } catch (error) {
        console.error("Error loading stats:", error);
        historyListDiv.innerHTML = "<p>Could not load stats from database.</p>";
    }
}

function renderGeneralStats() {
    const totalGrandPrix = grandPrixHistory.length;
    const totalRaces = grandPrixHistory.reduce((sum, gp) => sum + gp.races.length, 0);

    const totalPlayersSet = new Set();

    grandPrixHistory.forEach(gp => {
        gp.players.forEach(player => {
            totalPlayersSet.add(player.name);
        });
    });

    generalStatsDiv.innerHTML = `
        <div class="stat-card">
            <h3>Grand Prix Played</h3>
            <p>${totalGrandPrix}</p>
        </div>

        <div class="stat-card">
            <h3>Total Races</h3>
            <p>${totalRaces}</p>
        </div>

        <div class="stat-card">
            <h3>Players Tracked</h3>
            <p>${totalPlayersSet.size}</p>
        </div>
    `;
}

function calculatePlayerStats() {
    const stats = {};

    grandPrixHistory.forEach(gp => {
        gp.finalStandings.forEach((standing, index) => {
            if (!stats[standing.name]) {
                stats[standing.name] = {
                    name: standing.name,
                    character: standing.character,
                    gpWins: 0,
                    totalPoints: 0,
                    grandPrixPlayed: 0,
                    raceWins: 0,
                    totalRacePlacements: 0,
                    totalRaces: 0
                };
            }

            stats[standing.name].grandPrixPlayed++;
            stats[standing.name].totalPoints += standing.points;

            if (index === 0) {
                stats[standing.name].gpWins++;
            }
        });

        gp.races.forEach(race => {
            race.results.forEach(result => {
                if (!stats[result.playerName]) {
                    stats[result.playerName] = {
                        name: result.playerName,
                        character: result.character,
                        gpWins: 0,
                        totalPoints: 0,
                        grandPrixPlayed: 0,
                        raceWins: 0,
                        totalRacePlacements: 0,
                        totalRaces: 0
                    };
                }

                stats[result.playerName].totalRaces++;
                stats[result.playerName].totalRacePlacements += result.placement;

                if (result.placement === 1) {
                    stats[result.playerName].raceWins++;
                }
            });
        });
    });

    return Object.values(stats);
}

function renderPlayerStats() {
    const playerStats = calculatePlayerStats();

    playerListDiv.innerHTML = playerStats.map(player => `
        <div class="player-card" data-player="${player.name}">
            <div class="character">${player.character}</div>
            <h3>${player.name}</h3>
            <p>${player.gpWins} GP Wins</p>
        </div>
    `).join("");

    document.querySelectorAll(".player-card").forEach(card => {
        card.addEventListener("click", () => {
            const playerName = card.dataset.player;
            const player = playerStats.find(p => p.name === playerName);
            openPlayerModal(player);
        });
    });
}

function openPlayerModal(player) {
    const averageFinish = player.totalRaces
        ? (player.totalRacePlacements / player.totalRaces).toFixed(2)
        : "N/A";

    modalBody.innerHTML = `
        <h2>${player.character} ${player.name}</h2>

        <div class="stat-grid">
            <div class="stat-card">
                <h3>GP Wins</h3>
                <p>${player.gpWins}</p>
            </div>

            <div class="stat-card">
                <h3>Race Wins</h3>
                <p>${player.raceWins}</p>
            </div>

            <div class="stat-card">
                <h3>Total Points</h3>
                <p>${player.totalPoints}</p>
            </div>

            <div class="stat-card">
                <h3>GP Played</h3>
                <p>${player.grandPrixPlayed}</p>
            </div>

            <div class="stat-card">
                <h3>Total Races</h3>
                <p>${player.totalRaces}</p>
            </div>

            <div class="stat-card">
                <h3>Avg Finish</h3>
                <p>${averageFinish}</p>
            </div>
        </div>
    `;

    playerModal.classList.remove("hidden");
}

closeModalBtn.addEventListener("click", () => {
    playerModal.classList.add("hidden");
});

playerModal.addEventListener("click", event => {
    if (event.target === playerModal) {
        playerModal.classList.add("hidden");
    }
});

function renderHistory() {
    if (grandPrixHistory.length === 0) {
        historyListDiv.innerHTML = "<p>No Grand Prix history yet.</p>";
        return;
    }

    historyListDiv.innerHTML = grandPrixHistory.map(gp => {
        const date = new Date(gp.datePlayed || gp.createdAt).toLocaleDateString();

        return `
            <div class="history-card">
                <h3>🏁 ${gp.grandPrixName}</h3>
                <p>📅 ${date}</p>
                <p>👥 ${gp.totalPlayers} Players</p>
                <p>🏆 Winner: ${gp.winner.character} ${gp.winner.name || gp.winner.playerName}</p>

                <div class="history-standings">
                    ${gp.finalStandings.map((player, index) => `
                        <div class="history-row">
                            <span>${getMedal(index)} ${player.character} ${player.name}</span>
                            <strong>${player.points} pts</strong>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }).join("");
}

function getMedal(index) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
}

loadStatsData();