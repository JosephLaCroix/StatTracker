let players = [];
let selectedPlayers = [];

const playerList = document.getElementById("player-list");
const startGrandPrixBtn = document.getElementById("start-grand-prix-btn");
const grandPrixSection = document.getElementById("grand-prix-section");
const racesContainer = document.getElementById("races-container");
const scoreboardList = document.getElementById("scoreboard-list");
const grandPrixForm = document.getElementById("grand-prix-form");

const finalResultsSection = document.getElementById("final-results-section");
const podiumList = document.getElementById("podium-list");
const newGrandPrixBtn = document.getElementById("new-grand-prix-btn");

const pointsByPlace = {
    1: 5,
    2: 3,
    3: 2,
    4: 1
};

async function loadPlayers() {
    const response = await fetch("../data/players.json");
    players = await response.json();
    displayPlayers();
}

function displayPlayers() {
    playerList.innerHTML = "";

    players.forEach(player => {
        const label = document.createElement("label");
        label.classList.add("player-card");
        label.style.borderColor = player.color;

        label.innerHTML = `
            <input type="checkbox" value="${player.id}">
            <span class="player-icon">${player.character}</span>
            <span class="player-name-label">${player.name}</span>
        `;

        playerList.appendChild(label);
    });
}

startGrandPrixBtn.addEventListener("click", () => {
    selectedPlayers = Array.from(
        document.querySelectorAll("#player-list input:checked")
    ).map(input => {
        return players.find(player => player.id === Number(input.value));
    });

    if (selectedPlayers.length < 2) {
        alert("Select at least 2 players.");
        return;
    }

    if (selectedPlayers.length > 4) {
        alert("For this point system, select 4 players or fewer.");
        return;
    }

    racesContainer.innerHTML = "";

    for (let raceNumber = 1; raceNumber <= 4; raceNumber++) {
        createRaceCard(raceNumber);
    }

    grandPrixSection.classList.remove("hidden");
    updateScoreboard();
});

function createRaceCard(raceNumber) {
    const raceCard = document.createElement("div");
    raceCard.classList.add("race-card");

    raceCard.innerHTML = `
        <h3>Race ${raceNumber}</h3>

        <label for="race-${raceNumber}-track">Track Name</label>
        <input type="text" id="race-${raceNumber}-track" placeholder="Ex: Rainbow Road">

        ${selectedPlayers.map(player => `
            <div class="player-result">
                <div class="player-name">
                    ${player.character} ${player.name}
                </div>

                <select 
                    class="placement-select" 
                    data-race="${raceNumber}" 
                    data-player-id="${player.id}"
                >
                    <option value="">Placement</option>
                    ${selectedPlayers.map((_, index) => `
                        <option value="${index + 1}">${index + 1}</option>
                    `).join("")}
                </select>

                <input 
                    type="text" 
                    class="player-note" 
                    data-race="${raceNumber}" 
                    data-player-id="${player.id}" 
                    placeholder="Time (Optional)"
                >
            </div>
        `).join("")}
    `;

    racesContainer.appendChild(raceCard);

    const selects = raceCard.querySelectorAll(".placement-select");

    selects.forEach(select => {
        select.addEventListener("change", () => {
            preventDuplicatePlacements(raceNumber);
            updateScoreboard();
        });
    });
}

function preventDuplicatePlacements(raceNumber) {
    const raceSelects = document.querySelectorAll(
        `.placement-select[data-race="${raceNumber}"]`
    );

    const selectedValues = Array.from(raceSelects)
        .map(select => select.value)
        .filter(value => value !== "");

    raceSelects.forEach(select => {
        const currentValue = select.value;

        Array.from(select.options).forEach(option => {
            if (option.value === "") return;

            option.disabled =
                selectedValues.includes(option.value) &&
                option.value !== currentValue;
        });
    });
}

function updateScoreboard() {
    const scores = {};

    selectedPlayers.forEach(player => {
        scores[player.id] = {
            name: player.name,
            character: player.character,
            points: 0
        };
    });

    document.querySelectorAll(".placement-select").forEach(select => {
        const playerId = Number(select.dataset.playerId);
        const placement = select.value;

        if (placement && scores[playerId]) {
            scores[playerId].points += pointsByPlace[placement] || 0;
        }
    });

    const sortedScores = Object.values(scores).sort((a, b) => b.points - a.points);

    scoreboardList.innerHTML = sortedScores.map(player => `
        <div class="score-row">
            <span>${player.character} ${player.name}</span>
            <strong>${player.points} pts</strong>
        </div>
    `).join("");
}

function buildGrandPrixData() {
    const finalScores = getFinalScores();

    const raceData = {
        grandPrixName: document.getElementById("grand-prix-name").value || "Untitled Grand Prix",
        datePlayed: new Date().toISOString(),
        winner: finalScores[0],
        totalPlayers: selectedPlayers.length,
        players: selectedPlayers,
        races: [],
        finalStandings: finalScores
    };

    for (let raceNumber = 1; raceNumber <= 4; raceNumber++) {
        const race = {
            raceNumber: raceNumber,
            track: document.getElementById(`race-${raceNumber}-track`).value,
            results: []
        };

        selectedPlayers.forEach(player => {
            const placement = document.querySelector(
                `.placement-select[data-race="${raceNumber}"][data-player-id="${player.id}"]`
            ).value;

            const note = document.querySelector(
                `.player-note[data-race="${raceNumber}"][data-player-id="${player.id}"]`
            ).value;

            race.results.push({
                playerId: player.id,
                playerName: player.name,
                character: player.character,
                placement: Number(placement),
                points: pointsByPlace[placement] || 0,
                note: note
            });
        });

        raceData.races.push(race);
    }

    return raceData;
}

grandPrixForm.addEventListener("submit", async event => {
    event.preventDefault();

    const raceData = buildGrandPrixData();

    console.log(raceData);

    await saveGrandPrixToDatabase(raceData);

    showFinalResults(raceData.finalStandings);

    grandPrixSection.classList.add("hidden");
    finalResultsSection.classList.remove("hidden");
});

function getFinalScores() {
    const scores = {};

    selectedPlayers.forEach(player => {
        scores[player.id] = {
            name: player.name,
            character: player.character,
            points: 0
        };
    });

    document.querySelectorAll(".placement-select").forEach(select => {
        const playerId = Number(select.dataset.playerId);
        const placement = select.value;

        if (placement && scores[playerId]) {
            scores[playerId].points += pointsByPlace[placement] || 0;
        }
    });

    return Object.values(scores).sort((a, b) => b.points - a.points);
}

function showFinalResults(finalScores) {
    const medals = ["🥇", "🥈", "🥉", "4️⃣"];

    podiumList.innerHTML = finalScores.map((player, index) => `
        <div class="podium-card ${index === 0 ? "first" : ""}">
            <span class="podium-place">${medals[index]}</span>
            ${player.character} ${player.name}
            <br>
            <strong>${player.points} pts</strong>
        </div>
    `).join("");
}

newGrandPrixBtn.addEventListener("click", () => {
    location.reload();
});

async function saveGrandPrixToDatabase(raceData) {
    try {
        const response = await fetch("http://localhost:3000/api/grand-prix", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(raceData)
        });

        if (!response.ok) {
            throw new Error("Failed to save Grand Prix");
        }

        const savedGrandPrix = await response.json();
        console.log("Saved to MongoDB:", savedGrandPrix);
    } catch (error) {
        console.error("Error saving Grand Prix:", error);
        alert("Grand Prix results showed, but saving to database failed.");
    }
}

loadPlayers();
