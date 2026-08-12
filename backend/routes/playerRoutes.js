const express = require("express");
const router = express.Router();


const {
    getPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer
} = require("../controllers/playerController");


// =========================================
// PLAYER ROUTES
// =========================================

// Get all players
router.get("/", getPlayers);

// Create a new player
router.post("/", createPlayer);

// Update an existing player
router.put("/:id", updatePlayer);

// Delete a player
router.delete("/:id", deletePlayer);


module.exports = router;