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

        // =========================================
        // GAME MODE
        // =========================================

        gameMode: {
            type: String,
            enum: ["individual", "teams"],
            default: "individual"
        },

        // =========================================
        // INDIVIDUAL WINNER
        // =========================================

        winner: {
            playerId: Number,
            playerNameAtTime: String,
            profileImageAtTime: String,
            points: Number
        },

        // =========================================
        // TEAM WINNER
        // =========================================

        winningTeam: {
            teamNumber: Number,
            teamName: String,
            points: Number,

            players: [
                {
                    playerId: Number,
                    playerNameAtTime: String,
                    profileImageAtTime: String
                }
            ]
        },

        totalPlayers: Number,

        // =========================================
        // PLAYERS
        // =========================================

        players: [
            {
                playerId: Number,
                playerNameAtTime: String,
                profileImageAtTime: String,
                teamNumber: Number
            }
        ],

        // =========================================
        // TEAMS
        // =========================================

        teams: [
            {
                teamNumber: Number,

                teamName: String,

                points: {
                    type: Number,
                    default: 0
                },

                players: [
                    {
                        playerId: Number,
                        playerNameAtTime: String,
                        profileImageAtTime: String
                    }
                ]
            }
        ],

        // =========================================
        // RACES
        // =========================================

        races: Array,

        // =========================================
        // FINAL INDIVIDUAL STANDINGS
        // =========================================

        finalStandings: Array,

        // =========================================
        // FINAL TEAM STANDINGS
        // =========================================

        finalTeamStandings: Array
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "GrandPrix",
    grandPrixSchema
);