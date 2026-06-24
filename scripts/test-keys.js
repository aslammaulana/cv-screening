/**
 * Script untuk mengetes apakah API Key Gemini aktif dan model apa yang valid.
 * Jalankan dengan: node scripts/test-keys.js
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

// Load .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const apiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
].filter(Boolean);

async function testKey(apiKey, index, modelId) {
    console.log(`\n--- Testing Key #${index + 1} with model: ${modelId} ---`);
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelId });

        const start = Date.now();
        const result = await model.generateContent("Say 'API is working' in Indonesian.");
        const text = result.response.text();
        const duration = Date.now() - start;

        console.log(`✅ Success! Response: "${text.trim()}" (${duration}ms)`);
        return true;
    } catch (err) {
        console.error(`❌ Failed: ${err.message}`);
        // Jika error 503 dan model name aneh, beri info tambahan
        if (err.message.includes("503") || err.message.includes("high demand") || err.message.includes("404")) {
            console.log(`💡 Tip: Error ini sering muncul jika modelId "${modelId}" tidak valid atau sedang down.`);
        }
        return false;
    }
}

async function run() {
    if (apiKeys.length === 0) {
        console.error("❌ No API Keys found in .env.local. Pastikan ada GEMINI_API_KEY_1 s/d 5.");
        return;
    }

    console.log(`Found ${apiKeys.length} keys. Starting tests...`);

    // Ganti ini ke model yang ingin Anda tes
    const modelsToTest = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-3.0-flash-preview", "gemini-3.5-flash"];

    for (const modelId of modelsToTest) {
        for (let i = 0; i < apiKeys.length; i++) {
            await testKey(apiKeys[i], i, modelId);
        }
    }
}

run();
