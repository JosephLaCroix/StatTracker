require("dotenv").config();

const mongoose = require("mongoose");
const Player = require("./models/Player");

const players = [
    {
        playerId: 1,
        name: "Joey",
        currentCharacter: "Mario",
        profileImage: "default.png",
        color: "#E63946"
    },
    {
        playerId: 2,
        name: "Balls",
        currentCharacter: "Luigi",
        profileImage: "default.png",
        color: "#457B9D"
    },
    {
        playerId: 3,
        name: "Jordan",
        currentCharacter: "Peach",
        profileImage: "default.png",
        color: "#F1FAEE"
    },
    {
        playerId: 4,
        name: "Colin",
        currentCharacter: "Bowser",
        profileImage: "default.png",
        color: "#1D3557"
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB");

        // Remove existing players
        await Player.deleteMany({});

        // Add new players
        await Player.insertMany(players);

        console.log("Players successfully seeded!");

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedDatabase();