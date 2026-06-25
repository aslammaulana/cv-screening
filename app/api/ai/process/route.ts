import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import { sendApplicantEmail } from "@/lib/resend";
import { PERSONA_PROMPT, SCORING_PROMPT_TEMPLATE } from "@/lib/ai/config";

// Robust JSON parsing (handles backticks and leading/trailing text)
function parseAIResponse(raw: string) {
    try {
        const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");

        if (start === -1 || end === -1) {
            // Check if it's already a simple string that might be parsable
            return JSON.parse(cleaned);
        }

        const jsonStr = cleaned.substring(start, end + 1);
        return JSON.parse(jsonStr);
    } catch (err) {
        console.error("[AI Parse Error] Raw text:", raw);
        throw new Error("Failed to parse AI response as JSON");
    }
}

export async function POST(req: Request) {
    try {
        const { applicant_id } = await req.json();
        if (!applicant_id) throw new Error("Missing applicant_id");

        console.log(`[AI Process] Starting pipeline for applicant: ${applicant_id}`);
        const supabase = createAdminClient();

        // 1. Fetch Applicant, Position, and AI Config
        const { data: applicant, error: appError } = await supabase
            .from("applicants")
            .select("*, job_positions(*)")
            .eq("id", applicant_id)
            .single();

        if (appError || !applicant) throw new Error("Applicant not found");

        const position = applicant.job_positions;
        if (!position) throw new Error("Position data not found");

        const { data: config, error: configError } = await supabase
            .from("ai_config")
            .select("*")
            .single();

        if (configError || !config) throw new Error("AI Config not found");

        // 2. Setup AI with Rotation
        const apiKeys = [
            process.env.GEMINI_API_KEY_1,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3,
            process.env.GEMINI_API_KEY_4,
            process.env.GEMINI_API_KEY_5
        ].filter(Boolean) as string[];

        async function genAIWithRotation(prompt: string) {
            const modelId = "gemini-2.5-flash"; // Model paling hemat & cepat

            for (let i = 0; i < apiKeys.length; i++) {
                const apiKey = apiKeys[i];
                console.log(`[AI Process] Attempting AI with Key #${i + 1} (${modelId})...`);

                try {
                    const client = new GoogleGenAI({ apiKey });
                    const result = await client.models.generateContent({
                        model: modelId,
                        contents: [{ role: "user", parts: [{ text: prompt }] }],
                        config: {
                            temperature: 0.2, // Low temperature for more consistent extraction/scoring
                        }
                    });

                    return result;
                } catch (err: any) {
                    const message = err.message?.toLowerCase() || "";
                    const status = err.status || err.code;
                    const isTransientError =
                        status === 429 ||
                        status === 503 ||
                        status === 500 ||
                        message.includes("quota") ||
                        message.includes("overloaded") ||
                        message.includes("unavailable") ||
                        message.includes("internal error") ||
                        message.includes("demand");

                    if (isTransientError && i < apiKeys.length - 1) {
                        console.warn(`[AI Process] Key #${i + 1} experienced transient error (${status}: ${err.message}). Rotating to Key #${i + 2}...`);
                        continue;
                    }
                    console.error(`[AI Process] Key #${i + 1} failed with non-transient or final error:`, err.message);
                    throw err; // Real error or last key exhausted
                }
            }
            throw new Error("All Gemini API keys exhausted their quota or failed.");
        }

        // Step 1: Scoring langsung dari teks CV mentah (tanpa ekstraksi terpisah)
        // Menghemat 1 API call dengan meneruskan extracted_cv langsung ke prompt scoring
        console.log(`[AI Process] Step 1: Scoring applicant from raw CV text...`);
        const scoringPrompt = SCORING_PROMPT_TEMPLATE
            .replace("{position_title}", position.title)
            .replace("{must_have}", position.must_have || "None")
            .replace("{nice_to_have}", position.nice_to_have || "None")
            .replace("{focus_points}", position.focus_points || "None")
            .replace("{red_flags}", position.red_flags || "None");

        // Bersihkan teks CV dari whitespace berlebih untuk hemat token
        const rawCvText = applicant.extracted_cv || "";
        const cleanedCvText = rawCvText
            .replace(/\s+/g, " ")        // Ganti multiple spaces/newlines jadi satu spasi
            .replace(/\n+/g, " ")        // Ganti multiple newlines jadi satu spasi
            .trim()
            .substring(0, 10000);        // Batasi 10rb karakter (~2000-3000 kata)

        const cvText = cleanedCvText || "(CV text not available)";

        const fullScoringPrompt = `${config.persona_prompt}\n\nTARGET POSITION: ${position.title}\n\nCandidate CV Text (raw):\n${cvText}\n\n${scoringPrompt}\n\nCRITICAL CONTEXT:\nYou are hiring for the specific role of **${position.title}**.\n\nSCORING RULES:\n- Give a single holistic score (0-100) based on how well the candidate meets the must_have, nice_to_have, focus_points, and red_flags criteria.\n- If the candidate's career is in a completely different field, set "meets_all_must_haves" to false and score must be <= 40.\n- ALWAYS respond in English.\n- ai_reason: Format EXACTLY as two labeled sections. Each section has 2-3 bullet points (max 1 sentence each). Be direct and specific.\n\nFormat:\nPOSITIVES:\n- [positive point]\n- [positive point]\n\nNEGATIVES:\n- [negative point or N/A if none]\n- [negative point]\n\nJSON Output keys: score_total (integer 0-100), ai_reason (string following the format above), meets_all_must_haves (boolean).`;

        let scores: any;
        try {
            console.log(`[AI Process] Calling Gemini for Scoring...`);
            const scoreResult = await genAIWithRotation(fullScoringPrompt);
            const scoreText = scoreResult.text || "";

            scores = parseAIResponse(scoreText);
            console.log(`[AI Process] Score JSON parsed. score_total: ${scores.score_total}, meets_all_must_haves: ${scores.meets_all_must_haves}`);
        } catch (scoreParseErr: any) {
            console.error(`[AI Process] Scoring Logic/Parsing Error:`, scoreParseErr.message);
            throw new Error(`Scoring failed: ${scoreParseErr.message}`);
        }

        // AI memberikan score_total langsung (0-100)
        let scoreTotal = Math.min(100, Math.max(0, Math.round(scores.score_total || 0)));

        // MUST-HAVE ENFORCEMENT
        let finalStatus = "manual_review";
        if (scores.meets_all_must_haves === false) {
            console.log(`[AI Process] MUST-HAVE failed. Forcing auto_rejected status.`);
            finalStatus = "auto_rejected";
            if (scoreTotal > 40) scoreTotal = 40;
        } else if (scoreTotal >= position.auto_approve_above) {
            finalStatus = "auto_approved";
        } else if (scoreTotal < position.auto_reject_below) {
            finalStatus = "auto_rejected";
        }

        const sanitizeReason = (reason: any) => {
            if (Array.isArray(reason)) return reason.join("\n");
            if (typeof reason === "object") return JSON.stringify(reason);
            return String(reason || "");
        };

        await supabase.from("applicants").update({
            score_total: scoreTotal,
            ai_reason_accept: sanitizeReason(scores.ai_reason),
            ai_reason_reject: null,
            status: finalStatus
        }).eq("id", applicant_id);

        console.log(`[AI Process] Step 1 Complete: Status determined as ${finalStatus} (Score: ${scoreTotal})`);

        // Trigger automated email notification (non-blocking)
        if (finalStatus === "auto_approved" || finalStatus === "auto_rejected") {
            sendApplicantEmail(
                finalStatus,
                applicant.nama,
                applicant.email,
                position.title
            ).catch(err => console.error("[AI Process Email Error]:", err));
        }

        // 4. Google Sheets Sync — update existing row, or append if not found
        try {
            console.log(`[AI Process] Step 2: Syncing to Google Sheets...`);
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
                },
                scopes: ["https://www.googleapis.com/auth/spreadsheets"],
            });

            const sheets = google.sheets({ version: "v4", auth });

            const cvUrl = applicant.cv_url;
            const aiReason = sanitizeReason(scores.ai_reason);
            const rowData = [
                new Date().toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }).replace(/\//g, "-"),
                applicant.nama,
                applicant.email,
                applicant.gender,
                position.title,
                scoreTotal,
                finalStatus,
                aiReason,
                cvUrl,
                applicant.extracted_cv
            ];

            // Read all existing rows to find a match by email + position
            const existing = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: "Applicants!A:K",
            });
            const rows = existing.data.values || [];
            // Email is col C (index 2), Position is col E (index 4)
            const matchIndex = rows.findIndex(
                (row) => row[2] === applicant.email && row[4] === position.title
            );

            if (matchIndex !== -1) {
                // Overwrite existing row (1-indexed, skip header row at index 0)
                const rowNumber = matchIndex + 1;
                await sheets.spreadsheets.values.update({
                    spreadsheetId: process.env.GOOGLE_SHEET_ID,
                    range: `Applicants!A${rowNumber}:J${rowNumber}`,
                    valueInputOption: "USER_ENTERED",
                    requestBody: { values: [rowData] }
                });
                console.log(`[AI Process] Step 2 Complete: Sheets row ${rowNumber} updated (no duplicate).`);
            } else {
                // No existing row — append new
                await sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.GOOGLE_SHEET_ID,
                    range: "Applicants!A:K",
                    valueInputOption: "USER_ENTERED",
                    requestBody: { values: [rowData] }
                });
                console.log(`[AI Process] Step 2 Complete: Sheets new row appended.`);
            }
        } catch (sheetErr: any) {
            console.error(`[AI Process] Sheets sync error:`, sheetErr.message);
        }

        return NextResponse.json({ success: true, status: finalStatus, score: scoreTotal });

    } catch (err: any) {
        console.error(`[AI Process] Critical Failure:`, err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
