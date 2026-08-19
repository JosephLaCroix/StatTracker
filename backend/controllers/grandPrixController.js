const GrandPrix = require("../models/Grandprix");


// =========================================
// CREATE GRAND PRIX
// =========================================

async function createGrandPrix(req, res) {

    try {

        const grandPrixData = {
            ...req.body,

            // Older/front-end requests that do not
            // specify a mode remain individual.
            gameMode:
                req.body.gameMode ||
                "individual"
        };


        const grandPrix =
            await GrandPrix.create(
                grandPrixData
            );


        res.status(201).json(
            grandPrix
        );


    } catch (error) {

        console.error(
            "Error saving Grand Prix:",
            error
        );


        res.status(500).json({
            message:
                "Error saving Grand Prix",
            error
        });

    }

}


// =========================================
// GET GRAND PRIX HISTORY
// =========================================

async function getGrandPrixHistory(
    req,
    res
) {

    try {

        const grandPrixHistory =
            await GrandPrix
                .find()
                .sort({
                    createdAt: -1
                });


        res.json(
            grandPrixHistory
        );


    } catch (error) {

        console.error(
            "Error loading Grand Prix history:",
            error
        );


        res.status(500).json({
            message:
                "Error loading Grand Prix history",
            error
        });

    }

}


// =========================================
// CLEAR GRAND PRIX HISTORY
// =========================================

async function clearGrandPrixHistory(
    req,
    res
) {

    try {

        await GrandPrix.deleteMany({});


        res.json({
            message:
                "Grand Prix history cleared"
        });


    } catch (error) {

        console.error(
            "Error clearing Grand Prix history:",
            error
        );


        res.status(500).json({
            message:
                "Failed to clear Grand Prix history"
        });

    }

}


// =========================================
// EXPORTS
// =========================================

module.exports = {
    createGrandPrix,
    getGrandPrixHistory,
    clearGrandPrixHistory
};