const express = require("express");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Home route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`✅ Server running at ${url}`);
    exec(`start chrome ${url}`);
});
