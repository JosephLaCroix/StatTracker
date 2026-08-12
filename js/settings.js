const API_BASE_URL = "http://localhost:3000";

const SETTINGS_PASSWORD = "mashley123";


// =========================================
// PASSWORD ELEMENTS
// =========================================

const passwordScreen = document.getElementById("password-screen");
const settingsContent = document.getElementById("settings-content");

const passwordInput = document.getElementById("settings-password");
const unlockSettingsBtn = document.getElementById("unlock-settings-btn");
const passwordError = document.getElementById("password-error");


// =========================================
// SETTINGS BUTTONS
// =========================================

const addPlayerBtn = document.getElementById("add-player-btn");
const editPlayerBtn = document.getElementById("edit-player-btn");
const deletePlayerBtn = document.getElementById("delete-player-btn");
const clearHistoryBtn = document.getElementById("clear-history-btn");


// =========================================
// SETTINGS SECTIONS
// =========================================

const addPlayerSection = document.getElementById("add-player-section");
const editPlayerSection = document.getElementById("edit-player-section");
const deletePlayerSection = document.getElementById("delete-player-section");


// =========================================
// ADD PLAYER ELEMENTS
// =========================================

const savePlayerBtn = document.getElementById("save-player-btn");
const playerNameInput = document.getElementById("player-name");

const profileOptions = document.querySelectorAll(".profile-option");

let selectedProfileImage = "mario.png";


// =========================================
// EDIT PLAYER ELEMENTS
// =========================================

const editPlayerList = document.getElementById("edit-player-list");
const editProfileSection = document.getElementById("edit-profile-section");

const editCurrentImage = document.getElementById("edit-current-image");
const editPlayerName = document.getElementById("edit-player-name");

const editProfileOptions =
    document.querySelectorAll(".edit-profile-option");

const savePlayerChangesBtn =
    document.getElementById("save-player-changes-btn");

let selectedEditPlayer = null;
let selectedEditProfileImage = null;


// =========================================
// DELETE PLAYER ELEMENTS
// =========================================

const deletePlayerList = document.getElementById("delete-player-list");


// =========================================
// PASSWORD
// =========================================

unlockSettingsBtn.addEventListener("click", unlockSettings);

passwordInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        unlockSettings();
    }

});


function unlockSettings() {

    if (passwordInput.value === SETTINGS_PASSWORD) {

        passwordScreen.style.display = "none";

        settingsContent.classList.remove("hidden");

        passwordError.classList.add("hidden");

    } else {

        passwordError.classList.remove("hidden");

        passwordInput.value = "";

        passwordInput.focus();

    }

}


// =========================================
// CLOSE ALL SETTINGS PANELS
// =========================================

function closeAllSettingsPanels() {

    addPlayerSection.classList.add("hidden");
    editPlayerSection.classList.add("hidden");
    deletePlayerSection.classList.add("hidden");

}


// =========================================
// OPEN ADD PLAYER
// =========================================

addPlayerBtn.addEventListener("click", () => {

    const wasHidden =
        addPlayerSection.classList.contains("hidden");

    closeAllSettingsPanels();

    if (wasHidden) {
        addPlayerSection.classList.remove("hidden");
    }

});


// =========================================
// OPEN EDIT PLAYER
// =========================================

editPlayerBtn.addEventListener("click", () => {

    const wasHidden =
        editPlayerSection.classList.contains("hidden");

    closeAllSettingsPanels();

    if (wasHidden) {

        editPlayerSection.classList.remove("hidden");

        loadPlayersForEdit();

    }

});


// =========================================
// OPEN DELETE PLAYER
// =========================================

deletePlayerBtn.addEventListener("click", () => {

    const wasHidden =
        deletePlayerSection.classList.contains("hidden");

    closeAllSettingsPanels();

    if (wasHidden) {

        deletePlayerSection.classList.remove("hidden");

        loadPlayersForDelete();

    }

});


// =========================================
// ADD PLAYER PROFILE PICTURE SELECTION
// =========================================

profileOptions.forEach(option => {

    option.addEventListener("click", () => {

        profileOptions.forEach(button => {
            button.classList.remove("selected");
        });

        option.classList.add("selected");

        selectedProfileImage =
            option.dataset.image;

        console.log(
            "Selected profile image:",
            selectedProfileImage
        );

    });

});


// =========================================
// ADD PLAYER
// =========================================

savePlayerBtn.addEventListener("click", async () => {

    const name =
        playerNameInput.value.trim();

    if (!name) {
        return;
    }


    try {

        const playersResponse = await fetch(
            `${API_BASE_URL}/api/players`
        );


        if (!playersResponse.ok) {

            throw new Error(
                "Failed to load players"
            );

        }


        const players =
            await playersResponse.json();


        const nextPlayerId =
            players.length > 0
                ? Math.max(
                    ...players.map(
                        player =>
                            player.playerId
                    )
                ) + 1
                : 1;


        const response = await fetch(
            `${API_BASE_URL}/api/players`,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    playerId:
                        nextPlayerId,

                    name:
                        name,

                    profileImage:
                        selectedProfileImage

                })

            }
        );


        if (!response.ok) {

            throw new Error(
                "Failed to create player"
            );

        }


        const newPlayer =
            await response.json();


        console.log(
            "Player added:",
            newPlayer
        );


        playerNameInput.value = "";


        selectedProfileImage =
            "mario.png";


        profileOptions.forEach(
            button => {

                button.classList.remove(
                    "selected"
                );

            }
        );


        const marioOption =
            document.querySelector(
                '.profile-option[data-image="mario.png"]'
            );


        if (marioOption) {

            marioOption.classList.add(
                "selected"
            );

        }


    } catch (error) {

        console.error(
            "Error adding player:",
            error
        );

    }

});


// =========================================
// LOAD PLAYERS FOR EDIT
// =========================================

async function loadPlayersForEdit() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/players`
        );


        if (!response.ok) {

            throw new Error(
                "Failed to load players"
            );

        }


        const players =
            await response.json();


        editPlayerList.innerHTML =
            players.map(player => `

                <button
                    type="button"
                    class="edit-player-row"
                    data-player-id="${player._id}"
                >

                    <img
                        src="../images/characters/${player.profileImage}"
                        alt="${player.name}"
                        class="edit-player-list-image"
                    >

                    <span>
                        ${player.name}
                    </span>

                </button>

            `).join("");


        document
            .querySelectorAll(
                ".edit-player-row"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const mongoId =
                            button.dataset.playerId;


                        const player =
                            players.find(
                                player =>
                                    player._id ===
                                    mongoId
                            );


                        if (player) {

                            selectPlayerForEdit(
                                player
                            );

                        }

                    }
                );

            });


    } catch (error) {

        console.error(
            "Error loading players for edit:",
            error
        );

    }

}


// =========================================
// SELECT PLAYER FOR EDIT
// =========================================

function selectPlayerForEdit(player) {

    selectedEditPlayer =
        player;


    selectedEditProfileImage =
        player.profileImage ||
        "mario.png";


    editPlayerName.textContent =
        player.name;


    editCurrentImage.src =
        `../images/characters/${selectedEditProfileImage}`;


    editCurrentImage.alt =
        player.name;


    editProfileOptions.forEach(
        option => {

            option.classList.remove(
                "selected"
            );


            if (
                option.dataset.image ===
                selectedEditProfileImage
            ) {

                option.classList.add(
                    "selected"
                );

            }

        }
    );


    document
        .querySelectorAll(
            ".edit-player-row"
        )
        .forEach(row => {

            row.classList.remove(
                "selected-player"
            );

        });


    const selectedRow =
        document.querySelector(
            `.edit-player-row[data-player-id="${player._id}"]`
        );


    if (selectedRow) {

        selectedRow.classList.add(
            "selected-player"
        );

    }


    editProfileSection.classList.remove(
        "hidden"
    );

}


// =========================================
// EDIT PROFILE PICTURE SELECTION
// =========================================

editProfileOptions.forEach(option => {

    option.addEventListener("click", () => {

        if (!selectedEditPlayer) {
            return;
        }


        editProfileOptions.forEach(
            button => {

                button.classList.remove(
                    "selected"
                );

            }
        );


        option.classList.add(
            "selected"
        );


        selectedEditProfileImage =
            option.dataset.image;


        editCurrentImage.src =
            `../images/characters/${selectedEditProfileImage}`;


        console.log(
            "New edit profile image:",
            selectedEditProfileImage
        );

    });

});


// =========================================
// SAVE EDITED PLAYER
// =========================================

savePlayerChangesBtn.addEventListener(
    "click",
    async () => {

        if (
            !selectedEditPlayer ||
            !selectedEditProfileImage
        ) {

            return;

        }


        try {

            const response = await fetch(
                `${API_BASE_URL}/api/players/${selectedEditPlayer._id}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        profileImage:
                            selectedEditProfileImage

                    })

                }
            );


            if (!response.ok) {

                throw new Error(
                    "Failed to update player"
                );

            }


            const updatedPlayer =
                await response.json();


            console.log(
                "Player updated:",
                updatedPlayer
            );


            selectedEditPlayer =
                updatedPlayer;


            editCurrentImage.src =
                `../images/characters/${updatedPlayer.profileImage}`;


            // Refresh the player list so
            // the new image shows immediately.
            await loadPlayersForEdit();


            // Re-select the player after refresh.
            selectPlayerForEdit(
                updatedPlayer
            );


        } catch (error) {

            console.error(
                "Error updating player:",
                error
            );

        }

    }
);


// =========================================
// LOAD PLAYERS FOR DELETE
// =========================================

async function loadPlayersForDelete() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/players`
        );


        if (!response.ok) {

            throw new Error(
                "Failed to load players"
            );

        }


        const players =
            await response.json();


        deletePlayerList.innerHTML =
            players.map(player => `

                <div class="delete-player-row">

                    <span>

                        <img
                            src="../images/characters/${player.profileImage}"
                            alt="${player.name}"
                            class="delete-player-image"
                        >

                        ${player.name}

                    </span>


                    <button
                        onclick="deletePlayer('${player._id}', '${player.name}')"
                    >
                        Delete
                    </button>

                </div>

            `).join("");


    } catch (error) {

        console.error(
            "Error loading players:",
            error
        );

    }

}


// =========================================
// DELETE PLAYER
// =========================================

async function deletePlayer(
    playerId,
    playerName
) {

    const confirmed =
        confirm(
            `Are you sure you want to delete ${playerName}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/players/${playerId}`,
            {
                method: "DELETE"
            }
        );


        if (!response.ok) {

            throw new Error(
                "Failed to delete player"
            );

        }


        console.log(
            `${playerName} deleted.`
        );


        loadPlayersForDelete();


    } catch (error) {

        console.error(
            "Error deleting player:",
            error
        );

    }

}


// =========================================
// CLEAR GRAND PRIX HISTORY
// =========================================

clearHistoryBtn.addEventListener(
    "click",
    async () => {

        const confirmed =
            confirm(
                "Are you sure you want to clear ALL Grand Prix history? This cannot be undone."
            );


        if (!confirmed) {
            return;
        }


        const doubleCheck =
            confirm(
                "FINAL WARNING: This will permanently delete every saved Grand Prix. Continue?"
            );


        if (!doubleCheck) {
            return;
        }


        try {

            const response = await fetch(
                `${API_BASE_URL}/api/grand-prix`,
                {
                    method: "DELETE"
                }
            );


            if (!response.ok) {

                throw new Error(
                    "Failed to clear history"
                );

            }


            console.log(
                "Grand Prix history cleared."
            );


        } catch (error) {

            console.error(
                "Error clearing history:",
                error
            );

        }

    }
);