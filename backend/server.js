const express = require("express");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/db");

const grandPrixRoutes =
    require("./routes/grandPrixRoutes");

const playerRoutes =
    require("./routes/playerRoutes");


const app = express();


// =========================================
// MIDDLEWARE
// =========================================

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests with no browser origin
            // such as Postman or server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Not allowed by CORS")
            );
        }
    })
);

app.use(express.json());


// =========================================
// ROOT TEST ROUTE
// =========================================

app.get("/", (req, res) => {

    res.send(
        "Beerio Kart backend is running"
    );

});


// =========================================
// SETTINGS PASSWORD AUTH
// =========================================

app.post(
    "/api/settings/login",
    (req, res) => {

        const {
            password
        } = req.body;


        if (!password) {

            return res.status(400).json({
                success: false,
                message: "Password required"
            });

        }


        if (
            password !==
            process.env.SETTINGS_PASSWORD
        ) {

            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            });

        }


        res.json({
            success: true
        });

    }
);


// =========================================
// API ROUTES
// =========================================

app.use(
    "/api/grand-prix",
    grandPrixRoutes
);


app.use(
    "/api/players",
    playerRoutes
);


// =========================================
// SERVER
// =========================================

const PORT =
    process.env.PORT ||
    3000;


connectDB().then(() => {

    app.listen(
        PORT,
        () => {

            console.log(
                `Server running on port ${PORT}`
            );

        }
    );

});