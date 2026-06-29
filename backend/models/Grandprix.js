const mongoose = require("mongoose");

const grandPrixSchema = new mongoose.Schema(
    {
        grandPrixName: String,
        players: Array,
        races: Array
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("GrandPrix", grandPrixSchema);