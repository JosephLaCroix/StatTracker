const express = require("express");
const router = express.Router();

const {
    createGrandPrix,
    getGrandPrixHistory,
    clearGrandPrixHistory
} = require("../controllers/grandPrixController");


// Save a Grand Prix
router.post("/", createGrandPrix);

// Get all Grand Prix history
router.get("/", getGrandPrixHistory);

// Clear all Grand Prix history
router.delete("/", clearGrandPrixHistory);


module.exports = router;