
const fs = require("fs");
const path = require("path");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const voice = "en-US-AndrewMultilingualNeural";
const chunkSize = 500;
const textFile = "text1.txt";

const outputFolder =
    "C:\\Users\\Aldred\\Documents\\codes\\Project\\JavaScript-TTS\\TTS";
const START_AUDIO_NUMBER = 1;

fs.mkdirSync(outputFolder, { recursive: true });

const text = fs.readFileSync(textFile, "utf8").split(/\s+/).filter(Boolean);

const chunks = [];

for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize).join(" "));
}

async function generateMP3s() {

    for (
        let chunkIndex = START_AUDIO_NUMBER - 1;
        chunkIndex < chunks.length;
        chunkIndex++
    ) {

        const audioNum = chunkIndex + 1;

        const tts = new MsEdgeTTS();

        await tts.setMetadata(
            voice,
            OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
        );

        const outputPath = path.join(
            outputFolder,
            `audio${audioNum}.mp3`
        );

        
        const { audioStream } = await tts.toStream(chunks[chunkIndex]);

        const writeStream = fs.createWriteStream(outputPath);

        await new Promise((resolve, reject) => {
            audioStream.pipe(writeStream);

            audioStream.on("error", reject);
            writeStream.on("error", reject);
            writeStream.on("finish", resolve);
        });


        console.log(`Saved audio${audioNum}.mp3`);
    }
}

generateMP3s().catch(console.error);
