const express = require("express");
const ytdl = require("@distube/ytdl-core");
const cors = require("cors");
const fs = require("fs");
const Cookiefile = require("cookiefile");
const app = express();
app.use(cors());
const cookiefile = new Cookiefile.CookieMap("cookies.txt");
const cookies = cookiefile.toRequestHeader().replace("Cookie: ", "");
app.get("/", (req, res) => {
    const ping = new Date();
    ping.setHours(ping.getHours() - 3);
    console.log(
        `Ping at: ${ping.getUTCHours()}:${ping.getUTCMinutes()}:${ping.getUTCSeconds()}`
    );
    res.sendStatus(200);
});

app.get("/info", async (req, res) => {
    const { url } = req.query;

    if (url) {
        const isValid = ytdl.validateURL(url);

        if (isValid) {
            const info = (await ytdl.getInfo(url)).videoDetails;

            const title = info.title;
            const thumbnail = info.thumbnails[2].url;

            res.send({ title: title, thumbnail: thumbnail });
        } else {
            res.status(400).send("Invalid url");
        }
    } else {
        res.status(400).send("Invalid query");
    }
});


app.get("/mp3", async (req, res) => {
    const { url } = req.query;

    if (url) {
        const isValid = ytdl.validateURL(url);

        if (isValid) {
            const info = await ytdl.getInfo(url);
            const videoName = info.videoDetails.title;

            res.header(
                "Content-Disposition",
                `attachment; filename="${videoName}.mp3"`
            );
            res.header("Content-Type", "audio/mpeg");

            ytdl(url, {
                quality: "highestaudio",
                requestOptions: {
                    headers: {
                        Cookie: cookies,
                    },
                },
            }).pipe(res);
        } else {
            res.status(400).send("Invalid URL");
        }
    } else {
        res.status(400).send("Invalid query");
    }
});

app.listen(process.env.PORT || 3500, () => {
    console.log("Server is running");
});

app.get("/mp4", async (req, res) => {
    const { url } = req.query;

    if (url) {
        const isValid = ytdl.validateURL(url);

        if (isValid) {
            const videoName = (await ytdl.getInfo(url)).videoDetails.title;

            res.header(
                "Content-Disposition",
                `attachment; filename="${videoName}.mp4"`
            );

            ytdl(url, {
                quality: "highest",
                format: "mp4",
            }).pipe(res);
        } else {
            res.status(400).send("Invalid url");
        }
    } else {
        res.status(400).send("Invalid query");
    }
});

app.listen(process.env.PORT || 3500, () => {
    console.log("Server on");
});
