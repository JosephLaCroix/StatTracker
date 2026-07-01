const mongoose = require("mongoose");

const grandPrixSchema = new mongoose.Schema(
    {
        grandPrixName: {
            type: String,
            default: "Untitled Grand Prix"
        },

        datePlayed: {
            type: Date,
            default: Date.now
        },

        winner: {
            playerId: Number,
            playerName: String,
            character: String,
            points: Number
        },

        totalPlayers: Number,

        players: Array,

        races: Array,

        finalStandings: Array
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("GrandPrix", grandPrixSchema);