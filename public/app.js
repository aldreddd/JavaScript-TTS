
document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // ELEMENTS
    // =========================

    const textInput = document.getElementById("textInput");
    const charCount = document.getElementById("charCount");
    const voiceSelect = document.getElementById("voiceSelect");
    const chunkSize = document.getElementById("chunkSize");

    const generateBtn = document.getElementById("generateBtn");

    const progressSection = document.getElementById("progressSection");
    const progressText = document.getElementById("progressText");
    const progressPercent = document.getElementById("progressPercent");
    const progressFill = document.getElementById("progressFill");

    const resultsSection = document.getElementById("resultsSection");
    const audioResults = document.getElementById("audioResults");

    // =========================
    // CHARACTER COUNTER
    // =========================

    textInput.addEventListener("input", () => {
        charCount.textContent =
            `${textInput.value.length} characters`;
    });

    // =========================
    // GENERATE MP3
    // =========================

    generateBtn.addEventListener("click", async () => {

        const text = textInput.value.trim();
        const voice = voiceSelect.value;
        const size = Number(chunkSize.value);

        // Validate text
        if (!text) {
            alert("Please enter some text first.");
            textInput.focus();
            return;
        }

        // Validate chunk size
        if (!Number.isInteger(size) || size < 1 || size > 5000) {
            alert("Chunk size must be between 1 and 5000.");
            chunkSize.focus();
            return;
        }

        // Disable button
        generateBtn.disabled = true;
        generateBtn.innerHTML = "<span>Generating...</span>";

        // Reset progress
        progressSection.style.display = "block";
        resultsSection.style.display = "none";

        progressFill.style.width = "0%";
        progressPercent.textContent = "0%";
        progressText.textContent = "Sending text to server...";

        audioResults.innerHTML = "";

        try {

            // Send request to backend
            const response = await fetch("/api/generate", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    text: text,
                    voice: voice,
                    chunkSize: size
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Generation failed.");
            }

            // =========================
            // DISPLAY RESULTS
            // =========================

            progressFill.style.width = "100%";
            progressPercent.textContent = "100%";
            progressText.textContent = "Generation completed!";

            resultsSection.style.display = "block";

            if (data.files && data.files.length > 0) {

                data.files.forEach((filename) => {

                    const audioCard = document.createElement("div");
                    audioCard.style.cssText = `
                        padding: 15px;
                        margin-bottom: 12px;
                        border: 1px solid #eeeeee;
                        border-radius: 8px;
                    `;

                    const title = document.createElement("h4");
                    title.textContent = filename;
                    title.style.marginBottom = "10px";

                    const audio = document.createElement("audio");
                    audio.controls = true;
                    audio.preload = "none";
                    audio.src = `/api/audio/${encodeURIComponent(filename)}`;
                    audio.style.width = "100%";

                    const download = document.createElement("a");
                    download.href = audio.src;
                    download.download = filename;
                    download.textContent = "Download MP3";
                    download.style.cssText = `
                        display: inline-block;
                        margin-top: 10px;
                        color: #635bdb;
                        font-size: 13px;
                        font-weight: bold;
                    `;

                    audioCard.appendChild(title);
                    audioCard.appendChild(audio);
                    audioCard.appendChild(document.createElement("br"));
                    audioCard.appendChild(download);

                    audioResults.appendChild(audioCard);
                });

            } else {
                audioResults.textContent = "No audio files were generated.";
            }

            alert("MP3 generation completed successfully!");

        } catch (error) {

            console.error("Generation error:", error);

            progressText.textContent = "Generation failed.";

            alert("Error: " + error.message);

        } finally {

            // Re-enable button
            generateBtn.disabled = false;
            generateBtn.innerHTML = "<span>Generate MP3</span><span>→</span>";
        }

    });

});
