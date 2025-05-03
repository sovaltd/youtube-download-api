const express = require("express");
const ytdl = require("@distube/ytdl-core");
const cors = require("cors");
const fs = require("fs");
const Cookiefile = require("cookiefile");

const app = express();
app.use(cors());

// Load YouTube cookies (must have cookies.txt in root directory)
const cookiefile = new Cookiefile.CookieMap("cookies.txt");
const cookies = cookiefile.toRequestHeader().replace("Cookie: ", "");

// Root health check
app.get("/", (req, res) => {
    const ping = new Date();
    ping.setHours(ping.getHours() - 3);
    console.log(
        `Ping at: ${ping.getUTCHours()}:${ping.getUTCMinutes()}:${ping.getUTCSeconds()}`
    );
    res.sendStatus(200);
});

// /info route
app.get("/info", async (req, res) => {
    const { url } = req.query;

    if (!url) return res.status(400).send("Invalid query");

    if (!ytdl.validateURL(url)) return res.status(400).send("Invalid URL");

    try {
        const info = (await ytdl.getInfo(url)).videoDetails;
        const title = info.title;
        const thumbnail = info.thumbnails[2]?.url || "";

        res.send({ title, thumbnail });
    } catch (error) {
        res.status(500).send("Error fetching video info");
    }
});

// /mp3 route
app.get("/mp3", async (req, res) => {
    const { url } = req.query;

    if (!url || !ytdl.validateURL(url)) return res.status(400).send("Invalid URL");

    try {
        const info = await ytdl.getInfo(url);
        const videoName = info.videoDetails.title;

        res.header("Content-Disposition", `attachment; filename="${videoName}.mp3"`);
        res.header("Content-Type", "audio/mpeg");

        ytdl(url, {
            quality: "highestaudio",
            requestOptions: {
                headers: {
                    Cookie: cookies,
                },
            },
        }).pipe(res);
    } catch (error) {
        res.status(500).send("Error streaming audio");
    }
});

// /mp4 route
app.get("/mp4", async (req, res) => {
    const { url } = req.query;

    if (!url || !ytdl.validateURL(url)) return res.status(400).send("Invalid URL");

    try {
        const info = await ytdl.getInfo(url);
        const videoName = info.videoDetails.title;

        res.header("Content-Disposition", `attachment; filename="${videoName}.mp4"`);

        ytdl(url, {
            quality: "highest",
            requestOptions: {
                headers: {
                    Cookie: cookies,
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
                },
            },
        }).on("error", (err) => {
            console.error("ytdl error:", err);
            res.status(500).send("Streaming failed: " + err.message);
        }).pipe(res);
    } catch (error) {
        console.error("Route error:", error);
        res.status(500).send("Error streaming video");
    }
});


// Proper port handling for Render
const port = process.env.PORT;
if (!port) {
    throw new Error("PORT environment variable is not set.");
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
