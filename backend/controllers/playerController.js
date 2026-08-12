const Player = require("../models/Player");


// =========================================
// GET ALL PLAYERS
// =========================================

async function getPlayers(req, res) {
    try {

        const players = await Player
            .find()
            .sort({ playerId: 1 });

        res.json(players);

    } catch (error) {

        res.status(500).json({
            message: "Error loading players",
            error
        });

    }
}


// =========================================
// CREATE PLAYER
// =========================================

async function createPlayer(req, res) {
    try {

        const player = await Player.create(
            req.body
        );

        res.status(201).json(player);

    } catch (error) {

        res.status(500).json({
            message: "Error creating player",
            error
        });

    }
}


// =========================================
// UPDATE PLAYER
// =========================================

async function updatePlayer(req, res) {
    try {

        const player = await Player.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    profileImage: req.body.profileImage
                }
            },
            {
                new: true,
                runValidators: true
            }
        );


        if (!player) {

            return res.status(404).json({
                message: "Player not found"
            });

        }


        res.json(player);


    } catch (error) {

        res.status(500).json({
            message: "Error updating player",
            error
        });

    }
}


// =========================================
// DELETE PLAYER
// =========================================

async function deletePlayer(req, res) {
    try {

        const player = await Player.findByIdAndDelete(
            req.params.id
        );


        if (!player) {

            return res.status(404).json({
                message: "Player not found"
            });

        }


        res.json({
            message: "Player deleted",
            player
        });


    } catch (error) {

        res.status(500).json({
            message: "Error deleting player",
            error
        });

    }
}


// =========================================
// EXPORTS
// =========================================

module.exports = {
    getPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer
};