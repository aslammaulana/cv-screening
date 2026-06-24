/**
 * Script satu kali untuk mendapatkan OAuth2 Refresh Token dari Google.
 * Jalankan: node scripts/get-google-token.mjs
 */

import { createServer } from "http";
import { google } from "googleapis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// ── Ambil dari environment variables ───────────────────────────
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3333/callback";
// ───────────────────────────────────────────────────────────────

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("❌ ERROR: Harap isi GOOGLE_OAUTH_CLIENT_ID dan GOOGLE_OAUTH_CLIENT_SECRET di .env.local");
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("\n─────────────────────────────────────────────");
console.log("1. Buka URL ini di browser:");
console.log("\n" + authUrl + "\n");
console.log("2. Login & izinkan akses Google Drive.");
console.log("3. Tunggu, refresh token akan muncul di terminal ini.");
console.log("─────────────────────────────────────────────\n");

// Server sementara untuk tangkap callback dari Google
const server = createServer(async (req, res) => {
    if (!req.url?.startsWith("/callback")) return;

    const url = new URL(req.url, "http://localhost:3333");
    const code = url.searchParams.get("code");

    if (!code) {
        res.end("Error: code tidak ditemukan.");
        return;
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        res.end("<h2>Berhasil! Tutup tab ini dan lihat terminal.</h2>");
        server.close();

        console.log("\n✅ BERHASIL! Salin nilai-nilai ini ke .env.local:\n");
        console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log("\n─────────────────────────────────────────────\n");
    } catch (err) {
        res.end("Error mendapatkan token: " + err);
        server.close();
    }
});

server.listen(3333);
