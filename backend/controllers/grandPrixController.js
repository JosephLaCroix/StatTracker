const GrandPrix = require("../models/Grandprix");

async function createGrandPrix(req, res) {
    try {
        const grandPrix = await GrandPrix.create(req.body);
        res.status(201).json(grandPrix);
    } catch (error) {
        res.status(500).json({ message: "Error saving Grand Prix", error });
    }
}

async function getGrandPrixHistory(req, res) {
    try {
        const grandPrixHistory = await GrandPrix.find().sort({ createdAt: -1 });
        res.json(grandPrixHistory);
    } catch (error) {
        res.status(500).json({ message: "Error loading Grand Prix history", error });
    }
}

async function clearGrandPrixHistory(req, res) {

    try {

        await GrandPrix.deleteMany({});

        res.json({
            message: "Grand Prix history cleared"
        });

    } catch (error) {

        console.error("Error clearing Grand Prix history:", error);

        res.status(500).json({
            message: "Failed to clear Grand Prix history"
        });

    }

}

module.exports = {
    createGrandPrix,
    getGrandPrixHistory,
    clearGrandPrixHistory
};