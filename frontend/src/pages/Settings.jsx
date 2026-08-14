import {
    useEffect,
    useMemo,
    useState
} from "react";

import { Link } from "react-router";

import "../styles/settings.css";


const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";


// =========================================
// TEMP LOCAL SETTINGS PASSWORD
// =========================================
// We will move this to the backend before
// deployment so it is not exposed publicly.
// =========================================



// =========================================
// PROFILE PICTURES
// =========================================

const PROFILE_IMAGES = [

    "mario.png",
    "luigi.png",
    "peach.png",
    "yoshi.png",
    "blackyoshi.png",
    "bowser.png",
    "babybowser.png",
    "donkeykong.png",
    "waluigi.png",
    "toad.png",
    "metalmario.png",
    "blackshyguy.png",
    "yellowshyguy.png"

];


// =========================================
// SETTINGS COMPONENT
// =========================================

function Settings() {

    // =========================================
    // PASSWORD
    // =========================================

    const [
        unlocked,
        setUnlocked
    ] = useState(false);


    const [
        password,
        setPassword
    ] = useState("");


    const [
        passwordError,
        setPasswordError
    ] = useState(false);


    // =========================================
    // MAIN DATA
    // =========================================

    const [
        players,
        setPlayers
    ] = useState([]);


    const [
        loadingPlayers,
        setLoadingPlayers
    ] = useState(false);


    const [
        activePanel,
        setActivePanel
    ] = useState(null);


    const [
        pageMessage,
        setPageMessage
    ] = useState("");


    // =========================================
    // ADD PLAYER
    // =========================================

    const [
        newPlayerName,
        setNewPlayerName
    ] = useState("");


    const [
        selectedProfileImage,
        setSelectedProfileImage
    ] = useState("mario.png");


    // =========================================
    // EDIT PLAYER
    // =========================================

    const [
        selectedEditPlayerId,
        setSelectedEditPlayerId
    ] = useState(null);


    const [
        selectedEditProfileImage,
        setSelectedEditProfileImage
    ] = useState("mario.png");


    // =========================================
    // DELETE PLAYER
    // =========================================

    const [
        deletingPlayerId,
        setDeletingPlayerId
    ] = useState(null);


    // =========================================
    // BITCH LIST
    // =========================================

    const [
        updatingBitchListId,
        setUpdatingBitchListId
    ] = useState(null);


    // =========================================
    // LOAD PLAYERS
    // =========================================

    async function loadPlayers() {

        try {

            setLoadingPlayers(true);


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


    useEffect(() => {

        if (unlocked) {

            loadPlayers();

        }

    }, [unlocked]);


    // =========================================
    // PASSWORD
    // =========================================

    async function unlockSettings() {

    try {

        setPasswordError(false);


        const response =
            await fetch(
                `${API_BASE_URL}/api/settings/login`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            password
                        })

                }
            );


        if (!response.ok) {

            setPasswordError(true);

            setPassword("");

            return;

        }


        setUnlocked(true);

        setPassword("");

        setPasswordError(false);


    } catch (error) {

        console.error(
            "Settings login error:",
            error
        );


        setPasswordError(true);

        setPassword("");

    }

}


    function handlePasswordKeyDown(
        event
    ) {

        if (
            event.key ===
            "Enter"
        ) {

            unlockSettings();

        }

    }


    // =========================================
    // PANEL HANDLING
    // =========================================

    function togglePanel(panelName) {

        setPageMessage("");


        setActivePanel(
            currentPanel =>
                currentPanel ===
                panelName
                    ? null
                    : panelName
        );


        if (
            panelName !==
            "edit"
        ) {

            setSelectedEditPlayerId(
                null
            );

        }

    }


    // =========================================
    // SELECTED EDIT PLAYER
    // =========================================

    const selectedEditPlayer =
        useMemo(
            () => {

                return players.find(
                    player =>
                        player._id ===
                        selectedEditPlayerId
                ) ||
                null;

            },

            [
                players,
                selectedEditPlayerId
            ]
        );


    function selectPlayerForEdit(
        player
    ) {

        setSelectedEditPlayerId(
            player._id
        );


        setSelectedEditProfileImage(
            player.profileImage ||
            "mario.png"
        );

    }


    // =========================================
    // ADD PLAYER
    // =========================================

    async function addPlayer() {

        const name =
            newPlayerName.trim();


        if (!name) {

            setPageMessage(
                "Enter a player name."
            );

            return;

        }


        try {

            setPageMessage("");


            const nextPlayerId =
                players.length > 0
                    ? Math.max(
                        ...players.map(
                            player =>
                                Number(
                                    player.playerId
                                ) || 0
                        )
                    ) + 1
                    : 1;


            const response =
                await fetch(
                    `${API_BASE_URL}/api/players`,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                playerId:
                                    nextPlayerId,

                                name,

                                profileImage:
                                    selectedProfileImage,

                                onBitchList:
                                    false

                            })

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to create player"
                );

            }


            await response.json();


            setNewPlayerName("");

            setSelectedProfileImage(
                "mario.png"
            );


            setPageMessage(
                `${name} added successfully.`
            );


            await loadPlayers();


        } catch (error) {

            console.error(
                "Error adding player:",
                error
            );


            setPageMessage(
                "Could not add player."
            );

        }

    }


    // =========================================
    // SAVE EDITED PLAYER
    // =========================================

    async function savePlayerChanges() {

        if (
            !selectedEditPlayer
        ) {

            return;

        }


        try {

            setPageMessage("");


            const response =
                await fetch(
                    `${API_BASE_URL}/api/players/${selectedEditPlayer._id}`,
                    {

                        method:
                            "PUT",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

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


            setSelectedEditProfileImage(
                updatedPlayer.profileImage ||
                "mario.png"
            );


            setPageMessage(
                `${updatedPlayer.name} updated successfully.`
            );


            await loadPlayers();


        } catch (error) {

            console.error(
                "Error updating player:",
                error
            );


            setPageMessage(
                "Could not update player."
            );

        }

    }


    // =========================================
    // DELETE PLAYER
    // =========================================

    async function deletePlayer(
        player
    ) {

        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${player.name}?`
            );


        if (!confirmed) {

            return;

        }


        try {

            setDeletingPlayerId(
                player._id
            );


            setPageMessage("");


            const response =
                await fetch(
                    `${API_BASE_URL}/api/players/${player._id}`,
                    {

                        method:
                            "DELETE"

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to delete player"
                );

            }


            setPageMessage(
                `${player.name} deleted.`
            );


            if (
                selectedEditPlayerId ===
                player._id
            ) {

                setSelectedEditPlayerId(
                    null
                );

            }


            await loadPlayers();


        } catch (error) {

            console.error(
                "Error deleting player:",
                error
            );


            setPageMessage(
                "Could not delete player."
            );


        } finally {

            setDeletingPlayerId(
                null
            );

        }

    }


    // =========================================
    // BITCH LIST
    // =========================================

    async function toggleBitchList(
        player
    ) {

        try {

            setUpdatingBitchListId(
                player._id
            );


            setPageMessage("");


            const newStatus =
                !player.onBitchList;


            const response =
                await fetch(
                    `${API_BASE_URL}/api/players/${player._id}`,
                    {

                        method:
                            "PUT",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                onBitchList:
                                    newStatus

                            })

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to update Bitch List"
                );

            }


            const updatedPlayer =
                await response.json();


            setPageMessage(
                updatedPlayer.onBitchList
                    ? `${updatedPlayer.name} has been added to the Bitch List.`
                    : `${updatedPlayer.name} has been removed from the Bitch List.`
            );


            await loadPlayers();


        } catch (error) {

            console.error(
                "Error updating Bitch List:",
                error
            );


            setPageMessage(
                "Could not update the Bitch List."
            );


        } finally {

            setUpdatingBitchListId(
                null
            );

        }

    }


    // =========================================
    // CLEAR HISTORY
    // =========================================

    async function clearHistory() {

        const confirmed =
            window.confirm(
                "Are you sure you want to clear ALL Grand Prix history? This cannot be undone."
            );


        if (!confirmed) {

            return;

        }


        const doubleCheck =
            window.confirm(
                "FINAL WARNING: This will permanently delete every saved Grand Prix. Continue?"
            );


        if (!doubleCheck) {

            return;

        }


        try {

            setPageMessage("");


            const response =
                await fetch(
                    `${API_BASE_URL}/api/grand-prix`,
                    {

                        method:
                            "DELETE"

                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Failed to clear history"
                );

            }


            setPageMessage(
                "Grand Prix history cleared."
            );


        } catch (error) {

            console.error(
                "Error clearing history:",
                error
            );


            setPageMessage(
                "Could not clear Grand Prix history."
            );

        }

    }


    // =========================================
    // PASSWORD SCREEN
    // =========================================

    if (!unlocked) {

        return (

            <div className="password-screen">

                <div className="password-card">

                    <Link
                        to="/"
                        className="password-back-btn"
                    >
                        ← Back to Home
                    </Link>


                    <h2>
                        🔒 Settings Locked
                    </h2>


                    <input
                        type="password"
                        placeholder="Enter password"
                        value={
                            password
                        }
                        onChange={
                            event =>
                                setPassword(
                                    event.target.value
                                )
                        }
                        onKeyDown={
                            handlePasswordKeyDown
                        }
                        autoFocus
                    />


                    <button
                        type="button"
                        onClick={
                            unlockSettings
                        }
                    >
                        Unlock Settings
                    </button>


                    {passwordError && (

                        <p className="password-error">
                            Incorrect password
                        </p>

                    )}

                </div>

            </div>

        );

    }


    // =========================================
    // SETTINGS PAGE
    // =========================================

    return (

        <>

            <nav className="settings-nav">

                <Link to="/">
                    ← Home
                </Link>

                <h1>
                    ⚙️ Settings
                </h1>

            </nav>


            <main className="settings-container">

                <h2>
                    Player Management
                </h2>


                {pageMessage && (

                    <div className="settings-message">
                        {pageMessage}
                    </div>

                )}


                <div className="settings-buttons">


                    <button
                        type="button"
                        className="settings-action add-player-btn"
                        onClick={() =>
                            togglePanel(
                                "add"
                            )
                        }
                    >
                        ➕ Add Player
                    </button>


                    <button
                        type="button"
                        className="settings-action edit-player-btn"
                        onClick={() =>
                            togglePanel(
                                "edit"
                            )
                        }
                    >
                        ✏️ Edit Player
                    </button>


                    <button
                        type="button"
                        className="settings-action bitch-list-btn"
                        onClick={() =>
                            togglePanel(
                                "bitch-list"
                            )
                        }
                    >
                        📜 Manage Bitch List
                    </button>


                    <button
                        type="button"
                        className="settings-action delete-player-btn"
                        onClick={() =>
                            togglePanel(
                                "delete"
                            )
                        }
                    >
                        🗑️ Delete Player
                    </button>


                    <button
                        type="button"
                        className="settings-action clear-history-btn"
                        onClick={
                            clearHistory
                        }
                    >
                        🧹 Clear History
                    </button>

                </div>


                {/* =================================
                    ADD PLAYER
                ================================== */}

                {activePanel ===
                "add" && (

                    <section className="settings-panel">

                        <h2>
                            ➕ Add Player
                        </h2>


                        <label htmlFor="player-name">
                            Player Name
                        </label>


                        <input
                            type="text"
                            id="player-name"
                            placeholder="Enter player name"
                            value={
                                newPlayerName
                            }
                            onChange={
                                event =>
                                    setNewPlayerName(
                                        event.target.value
                                    )
                            }
                        />


                        <label>
                            Profile Picture
                        </label>


                        <div className="profile-picture-grid">

                            {PROFILE_IMAGES.map(
                                image => (

                                    <button
                                        type="button"
                                        className={
                                            `profile-option ${
                                                selectedProfileImage ===
                                                image
                                                    ? "selected"
                                                    : ""
                                            }`
                                        }
                                        data-image={
                                            image
                                        }
                                        key={
                                            image
                                        }
                                        onClick={() =>
                                            setSelectedProfileImage(
                                                image
                                            )
                                        }
                                    >

                                        <img
                                            src={`/images/characters/${image}`}
                                            alt={
                                                image.replace(
                                                    ".png",
                                                    ""
                                                )
                                            }
                                        />

                                    </button>

                                )
                            )}

                        </div>


                        <button
                            id="save-player-btn"
                            type="button"
                            onClick={
                                addPlayer
                            }
                        >
                            Add Player
                        </button>

                    </section>

                )}


                {/* =================================
                    EDIT PLAYER
                ================================== */}

                {activePanel ===
                "edit" && (

                    <section className="settings-panel">

                        <h2>
                            ✏️ Edit Player
                        </h2>


                        <p>
                            Select a player to change their profile picture.
                        </p>


                        {loadingPlayers ? (

                            <p>
                                Loading players...
                            </p>

                        ) : (

                            <div className="edit-player-list">

                                {players.map(
                                    player => (

                                        <button
                                            type="button"
                                            className={
                                                `edit-player-row ${
                                                    selectedEditPlayerId ===
                                                    player._id
                                                        ? "selected-player"
                                                        : ""
                                                }`
                                            }
                                            key={
                                                player._id
                                            }
                                            onClick={() =>
                                                selectPlayerForEdit(
                                                    player
                                                )
                                            }
                                        >

                                            <img
                                                src={`/images/characters/${
                                                    player.profileImage ||
                                                    "mario.png"
                                                }`}
                                                alt={
                                                    player.name
                                                }
                                                className="edit-player-list-image"
                                            />


                                            <span>
                                                {
                                                    player.name
                                                }
                                            </span>

                                        </button>

                                    )
                                )}

                            </div>

                        )}


                        {selectedEditPlayer && (

                            <div id="edit-profile-section">

                                <div className="edit-player-heading">

                                    <img
                                        src={`/images/characters/${selectedEditProfileImage}`}
                                        alt={
                                            selectedEditPlayer.name
                                        }
                                        className="edit-current-image"
                                    />


                                    <div>

                                        <span className="edit-player-label">
                                            Editing Player
                                        </span>

                                        <h3>
                                            {
                                                selectedEditPlayer.name
                                            }
                                        </h3>

                                    </div>

                                </div>


                                <label>
                                    Choose New Profile Picture
                                </label>


                                <div className="profile-picture-grid">

                                    {PROFILE_IMAGES.map(
                                        image => (

                                            <button
                                                type="button"
                                                className={
                                                    `edit-profile-option ${
                                                        selectedEditProfileImage ===
                                                        image
                                                            ? "selected"
                                                            : ""
                                                    }`
                                                }
                                                key={
                                                    image
                                                }
                                                onClick={() =>
                                                    setSelectedEditProfileImage(
                                                        image
                                                    )
                                                }
                                            >

                                                <img
                                                    src={`/images/characters/${image}`}
                                                    alt={
                                                        image.replace(
                                                            ".png",
                                                            ""
                                                        )
                                                    }
                                                />

                                            </button>

                                        )
                                    )}

                                </div>


                                <button
                                    id="save-player-changes-btn"
                                    type="button"
                                    onClick={
                                        savePlayerChanges
                                    }
                                >
                                    Save Changes
                                </button>

                            </div>

                        )}

                    </section>

                )}


                {/* =================================
                    BITCH LIST
                ================================== */}

                {activePanel ===
                "bitch-list" && (

                    <section className="settings-panel bitch-list-panel">

                        <h2>
                            📜 Manage Bitch List
                        </h2>


                        <p>
                            Add or remove racers from the official league record.
                        </p>


                        {loadingPlayers ? (

                            <p>
                                Loading players...
                            </p>

                        ) : players.length ===
                        0 ? (

                            <p>
                                No players available.
                            </p>

                        ) : (

                            <div className="bitch-settings-list">

                                {players.map(
                                    player => {

                                        const listed =
                                            Boolean(
                                                player.onBitchList
                                            );


                                        const updating =
                                            updatingBitchListId ===
                                            player._id;


                                        return (

                                            <div
                                                className={
                                                    `bitch-settings-row ${
                                                        listed
                                                            ? "on-list"
                                                            : ""
                                                    }`
                                                }
                                                key={
                                                    player._id
                                                }
                                            >

                                                <div className="bitch-settings-player">

                                                    <img
                                                        src={`/images/characters/${
                                                            player.profileImage ||
                                                            "mario.png"
                                                        }`}
                                                        alt={
                                                            player.name
                                                        }
                                                        className="bitch-settings-image"
                                                    />


                                                    <div>

                                                        <strong>
                                                            {
                                                                player.name
                                                            }
                                                        </strong>


                                                        <span>
                                                            {
                                                                listed
                                                                    ? "Currently on the Bitch List"
                                                                    : "Record clean"
                                                            }
                                                        </span>

                                                    </div>

                                                </div>


                                                <button
                                                    type="button"
                                                    className={
                                                        listed
                                                            ? "remove-bitch-btn"
                                                            : "add-bitch-btn"
                                                    }
                                                    disabled={
                                                        updating
                                                    }
                                                    onClick={() =>
                                                        toggleBitchList(
                                                            player
                                                        )
                                                    }
                                                >

                                                    {
                                                        updating
                                                            ? "Updating..."
                                                            : listed
                                                                ? "Remove"
                                                                : "Add to List"
                                                    }

                                                </button>

                                            </div>

                                        );

                                    }
                                )}

                            </div>

                        )}

                    </section>

                )}


                {/* =================================
                    DELETE PLAYER
                ================================== */}

                {activePanel ===
                "delete" && (

                    <section className="settings-panel">

                        <h2>
                            🗑️ Delete Player
                        </h2>


                        <p>
                            Select the player you want to permanently remove.
                        </p>


                        {loadingPlayers ? (

                            <p>
                                Loading players...
                            </p>

                        ) : (

                            <div>

                                {players.map(
                                    player => (

                                        <div
                                            className="delete-player-row"
                                            key={
                                                player._id
                                            }
                                        >

                                            <span>

                                                <img
                                                    src={`/images/characters/${
                                                        player.profileImage ||
                                                        "mario.png"
                                                    }`}
                                                    alt={
                                                        player.name
                                                    }
                                                    className="delete-player-image"
                                                />

                                                {
                                                    player.name
                                                }

                                            </span>


                                            <button
                                                type="button"
                                                disabled={
                                                    deletingPlayerId ===
                                                    player._id
                                                }
                                                onClick={() =>
                                                    deletePlayer(
                                                        player
                                                    )
                                                }
                                            >

                                                {
                                                    deletingPlayerId ===
                                                    player._id
                                                        ? "Deleting..."
                                                        : "Delete"
                                                }

                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                )}

            </main>

        </>

    );

}


export default Settings;