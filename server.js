
const express = require("express");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream/promises");

// =========================
// INITIALIZATION
// =========================

const app = express();
const PORT = 3000;

const outputFolder = path.join(__dirname, "TTS");
const publicFolder = path.join(__dirname, "public");

fs.mkdirSync(outputFolder, { recursive: true });

app.use(express.json({ limit: "2mb" }));
app.use(express.static(publicFolder));

// =========================
// DEFAULT SETTINGS
// =========================

const DEFAULT_VOICE = "en-US-AndrewMultilingualNeural";

// =========================
// TEXT CHUNKING
// =========================

function splitText(text, chunkSize) {
    const words = text.trim().split(/\s+/);
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(" "));
    }

    return chunks;
}

// =========================
// AUDIO NUMBERING
// =========================

function getNextAudioNumber() {
    let number = 1;

    while (fs.existsSync(path.join(outputFolder, `audio${number}.mp3`))) {
        number++;
    }

    return number;
}

// =========================
// GENERATE MP3
// =========================

app.post("/api/generate", async (req, res) => {
    const { text, voice, chunkSize } = req.body;

    if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({
            success: false,
            error: "Please provide some text."
        });
    }

    const size = Number(chunkSize) || 750;

    if (!Number.isInteger(size) || size < 1 || size > 5000) {
        return res.status(400).json({
            success: false,
            error: "Chunk size must be between 1 and 5000."
        });
    }

    const selectedVoice = voice || DEFAULT_VOICE;
    const chunks = splitText(text, size);
    const startNumber = getNextAudioNumber();
    const generatedFiles = [];

    try {
        for (let i = 0; i < chunks.length; i++) {
            const filename = `audio${startNumber + i}.mp3`;
            const outputPath = path.join(outputFolder, filename);
            const tts = new MsEdgeTTS();

            try {
                await tts.setMetadata(
                    selectedVoice,
                    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
                );

                const { audioStream } = await tts.toStream(chunks[i]);

                await pipeline(
                    audioStream,
                    fs.createWriteStream(outputPath)
                );

                generatedFiles.push(filename);
                console.log(`Saved ${filename}`);

            } catch (error) {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }

                throw error;

            } finally {
                tts.close();
            }
        }

        res.json({
            success: true,
            message: "Audio generation completed!",
            files: generatedFiles
        });

    } catch (error) {
        console.error("TTS Error:", error);

        res.status(500).json({
            success: false,
            error: error.message,
            files: generatedFiles
        });
    }
});

// =========================
// SERVE GENERATED AUDIO
// =========================

app.get("/api/audio/:filename", (req, res) => {
    const filename = req.params.filename;

    if (!/^audio\d+\.mp3$/.test(filename)) {
        return res.status(400).json({
            error: "Invalid audio filename."
        });
    }

    const filePath = path.join(outputFolder, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            error: "Audio file not found."
        });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.sendFile(filePath);
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
    console.log(`TTS App running at http://localhost:${PORT}`);
});
