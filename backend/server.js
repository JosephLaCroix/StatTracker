const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const grandPrixRoutes = require("./routes/grandPrixRoutes");
const playerRoutes = require("./routes/playerRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Beerio Kart backend is running");
});

app.use("/api/grand-prix", grandPrixRoutes);
app.use("/api/players", playerRoutes);

const PORT = 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});