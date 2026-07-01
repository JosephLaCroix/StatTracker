const express = require("express");
const router = express.Router();

const {
    createGrandPrix,
    getGrandPrixHistory
} = require("../controllers/grandPrixController");

router.post("/", createGrandPrix);
router.get("/", getGrandPrixHistory);

module.exports = router;