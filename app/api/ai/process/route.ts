import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { google } from "googleapis";

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

        async function genAIWithRotation(prompt: string, fileName?: string, fileBuffer?: Buffer) {
            for (let i = 0; i < apiKeys.length; i++) {
                const key = apiKeys[i];
                console.log(`[AI Process] Attempting AI with Key #${i + 1}...`);

                try {
                    const genAI = new GoogleGenerativeAI(key);
                    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                    if (fileBuffer && fileName) {
                        return await model.generateContent([
                            {
                                inlineData: {
                                    data: fileBuffer.toString("base64"),
                                    mimeType: "application/pdf",
                                },
                            },
                            { text: prompt },
                        ]);
                    } else {
                        return await model.generateContent(prompt);
                    }
                } catch (err: any) {
                    const isQuotaError = err.message?.includes("429") || err.message?.includes("quota");
                    if (isQuotaError && i < apiKeys.length - 1) {
                        console.warn(`[AI Process] Key #${i + 1} quota exceeded. Rotating to Key #${i + 2}...`);
                        continue;
                    }
                    throw err; // Real error or last key exhausted
                }
            }
            throw new Error("All Gemini API keys exhausted their quota.");
        }

        // Download CV from Storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("cv-uploads")
            .download(applicant.cv_url);

        if (downloadError || !fileData) throw new Error(`CV Download failed: ${downloadError?.message}`);

        const arrayBuffer = await fileData.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);

        // Step 1: Extraction
        console.log(`[AI Process] Step 1: Extracting CV data via Gemini...`);
        const extractResult = await genAIWithRotation(config.extraction_prompt, "cv.pdf", pdfBuffer);
        const extText = extractResult.response.text();
        const cvJson = JSON.parse(extText.replace(/```json|```/g, "").trim());

        // Update DB with extracted data
        await supabase.from("applicants").update({ cv_json: cvJson }).eq("id", applicant_id);
        console.log(`[AI Process] Step 1 Complete: CV extracted.`);

        // 3. Scoring
        console.log(`[AI Process] Step 2: Scoring applicant...`);
        const scoringPrompt = config.scoring_prompt
            .replace("{position_title}", position.title)
            .replace("{must_have}", position.must_have || "None")
            .replace("{nice_to_have}", position.nice_to_have || "None")
            .replace("{focus_points}", position.focus_points || "None")
            .replace("{red_flags}", position.red_flags || "None");

        const fullScoringPrompt = `${config.persona_prompt}\n\nTARGET POSITION: ${position.title}\n\nCandidate Data:\n${JSON.stringify(cvJson)}\n\n${scoringPrompt}\n\nCRITICAL CONTEXT:\nYou are hiring for the specific role of **${position.title}**. \n\nSCORING REFINEMENT:\n- **Projects:** If the candidate does not have a dedicated "Projects" section, do NOT automatically give a low score. Instead, look for specific project achievements (e.g., "Led the migration of...", "Built a system for...") within their "Experience" section and use that to inform the Project score.\n- **Indonesian:** Respond strictly in Indonesian language for ai_reason_accept and ai_reason_reject.\n- **Failure Condition:** If the candidate's career track is in a completely different industry (e.g. IT CV for Accountant role), set "meets_all_must_haves" to false.\n\nJSON Output keys: score_skill, score_experience, score_project, score_education, ai_reason_accept, ai_reason_reject, meets_all_must_haves (boolean).`;

        let scores: any;
        try {
            console.log(`[AI Process] Calling Gemini for Scoring...`);
            const scoreResult = await genAIWithRotation(fullScoringPrompt);
            const scoreText = scoreResult.response.text();

            const cleanedScoreJson = scoreText.replace(/```json|```/g, "").trim();
            scores = JSON.parse(cleanedScoreJson);
            console.log(`[AI Process] Score JSON parsed. Meets all must-haves: ${scores.meets_all_must_haves}`);
        } catch (scoreParseErr: any) {
            console.error(`[AI Process] Scoring Logic/Parsing Error:`, scoreParseErr.message);
            throw new Error(`Scoring failed: ${scoreParseErr.message}`);
        }

        // Calculate weighted score
        let scoreTotal = Math.round(
            (scores.score_skill * position.weight_skill / 100) +
            (scores.score_experience * position.weight_experience / 100) +
            (scores.score_project * position.weight_project / 100) +
            (scores.score_education * position.weight_education / 100)
        );

        // STRICTOR MUST-HAVE ENFORCEMENT
        let finalStatus = "manual_review";
        if (scores.meets_all_must_haves === false) {
            console.log(`[AI Process] MUST-HAVE failed. Forcing auto_rejected status.`);
            finalStatus = "auto_rejected";
            // Optional: cap the score if failed must-have
            if (scoreTotal > 40) scoreTotal = 40;
        } else if (scoreTotal >= position.auto_approve_above) {
            finalStatus = "auto_approved";
        } else if (scoreTotal < position.auto_reject_below) {
            finalStatus = "auto_rejected";
        }

        await supabase.from("applicants").update({
            score_skill: scores.score_skill,
            score_experience: scores.score_experience,
            score_project: scores.score_project,
            score_education: scores.score_education,
            score_total: scoreTotal,
            ai_reason_accept: scores.ai_reason_accept,
            ai_reason_reject: scores.ai_reason_reject,
            status: finalStatus
        }).eq("id", applicant_id);

        console.log(`[AI Process] Step 2 Complete: Status determined as ${finalStatus} (Score: ${scoreTotal})`);

        // 4. Google Sheets Sync
        try {
            console.log(`[AI Process] Step 3: Syncing to Google Sheets...`);
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
                },
                scopes: ["https://www.googleapis.com/auth/spreadsheets"],
            });

            const sheets = google.sheets({ version: "v4", auth });
            const cvUrl = applicant.cv_url.startsWith('http')
                ? applicant.cv_url
                : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cv-uploads/${applicant.cv_url}`;

            await sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: "Applicants!A:N",
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [[
                        new Date().toISOString(),
                        applicant.nama,
                        applicant.email,
                        applicant.gender,
                        position.title,
                        scoreTotal,
                        scores.score_skill,
                        scores.score_experience,
                        scores.score_project,
                        scores.score_education,
                        finalStatus,
                        scores.ai_reason_accept,
                        scores.ai_reason_reject,
                        cvUrl
                    ]]
                }
            });
            console.log(`[AI Process] Step 3 Complete: Sheets updated.`);
        } catch (sheetErr: any) {
            console.error(`[AI Process] Sheets sync error:`, sheetErr.message);
        }

        return NextResponse.json({ success: true, status: finalStatus, score: scoreTotal });

    } catch (err: any) {
        console.error(`[AI Process] Critical Failure:`, err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
