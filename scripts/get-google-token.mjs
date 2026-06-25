/**
 * One-time script to obtain an OAuth2 Refresh Token from Google.
 * Run: node scripts/get-google-token.mjs
 */

import { createServer } from "http";
import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// ── Read from environment variables ────────────────────────────
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3333/callback";
// ───────────────────────────────────────────────────────────────

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("❌ ERROR: Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env.local");
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("\n─────────────────────────────────────────────");
console.log("1. Open this URL in your browser:");
console.log("\n" + authUrl + "\n");
console.log("2. Log in and grant access to Google Drive.");
console.log("3. Wait — the refresh token will appear in this terminal.");
console.log("─────────────────────────────────────────────\n");

// Temporary server to capture the OAuth callback from Google
const server = createServer(async (req, res) => {
    if (!req.url?.startsWith("/callback")) return;

    const url = new URL(req.url, "http://localhost:3333");
    const code = url.searchParams.get("code");

    if (!code) {
        res.end("Error: authorization code not found.");
        return;
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        res.end("<h2>Success! You can close this tab and check the terminal.</h2>");
        server.close();

        console.log("\n✅ SUCCESS! Copy these values into your .env.local:\n");
        console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log("\n─────────────────────────────────────────────\n");
    } catch (err) {
        res.end("Error retrieving token: " + err);
        server.close();
    }
});

server.listen(3333);
