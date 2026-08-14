const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
    {
        playerId: {
            type: Number,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true
        },

        profileImage: {
            type: String,
            default: "mario.png"
        },

        color: {
            type: String,
            default: "#ffd43b"
        },

        onBitchList: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Player",
    playerSchema
);