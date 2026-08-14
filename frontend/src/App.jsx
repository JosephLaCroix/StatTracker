import { Routes, Route } from "react-router";

import Home from "./pages/Home.jsx";
import Play from "./pages/Play.jsx";
import Stats from "./pages/Stats.jsx";
import Rules from "./pages/Rules.jsx";
import Settings from "./pages/Settings.jsx";

function App() {
    return (
        <Routes>

            <Route
                path="/"
                element={<Home />}
            />

            <Route
                path="/play"
                element={<Play />}
            />

            <Route
                path="/stats"
                element={<Stats />}
            />

            <Route
                path="/rules"
                element={<Rules />}
            />

            <Route
                path="/settings"
                element={<Settings />}
            />

        </Routes>
    );
}

export default App;