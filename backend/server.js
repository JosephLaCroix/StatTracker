const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const GrandPrix = require("./models/GrandPrix");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Beerio Kart backend is running");
});

app.post("/api/grand-prix", async (req, res) => {
    try {
        const grandPrix = await GrandPrix.create(req.body);
        res.status(201).json(grandPrix);
    } catch (error) {
        res.status(500).json({ message: "Error saving Grand Prix", error });
    }
});

app.get("/api/grand-prix", async (req, res) => {
    try {
        const grandPrixHistory = await GrandPrix.find().sort({ createdAt: -1 });
        res.json(grandPrixHistory);
    } catch (error) {
        res.status(500).json({ message: "Error loading Grand Prix history", error });
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(3000, () => {
            console.log("Server running on http://localhost:3000");
        });
    })
    .catch(error => {
        console.error("MongoDB connection error:", error);
    });