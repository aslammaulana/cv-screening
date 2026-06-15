import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { applicant_id } = await req.json()
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch data
        const { data: applicant, error: appError } = await supabaseAdmin
            .from('applicants')
            .select('*')
            .eq('id', applicant_id)
            .single()

        if (appError || !applicant) throw new Error('Applicant not found')

        const { data: position, error: posError } = await supabaseAdmin
            .from('job_positions')
            .select('*')
            .eq('id', applicant.job_position_id)
            .single()

        if (posError || !position) throw new Error('Position not found')

        const { data: config, error: configError } = await supabaseAdmin
            .from('ai_config')
            .select('persona_prompt, scoring_prompt')
            .single()

        if (configError || !config) throw new Error('AI Config not found')

        // 2. Build Scoring Prompt
        const scoringPrompt = config.scoring_prompt
            .replace('{position_title}', position.title)
            .replace('{must_have}', position.must_have || 'None')
            .replace('{nice_to_have}', position.nice_to_have || 'None')
            .replace('{focus_points}', position.focus_points || 'None')
            .replace('{red_flags}', position.red_flags || 'None')

        const fullPrompt = `${config.persona_prompt}\n\nCandidate Data:\n${JSON.stringify(applicant.cv_json)}\n\n${scoringPrompt}`

        // 3. Call Gemini
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY_1') ?? '')
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const result = await model.generateContent(fullPrompt)
        const responseText = result.response.text()
        const cleanedJson = responseText.replace(/```json|```/g, '').trim()
        const scores = JSON.parse(cleanedJson)

        // 4. Calculate Weighted Score
        const scoreTotal = Math.round(
            (scores.score_skill * position.weight_skill / 100) +
            (scores.score_experience * position.weight_experience / 100) +
            (scores.score_project * position.weight_project / 100) +
            (scores.score_education * position.weight_education / 100)
        )

        // 5. Determine Final Status
        let finalStatus = 'manual_review'
        if (scoreTotal < position.auto_reject_below) {
            finalStatus = 'auto_rejected'
        } else if (scoreTotal > position.auto_approve_above) {
            finalStatus = 'auto_approved'
        }

        // 6. Update Database
        const { error: updateError } = await supabaseAdmin
            .from('applicants')
            .update({
                score_skill: scores.score_skill,
                score_experience: scores.score_experience,
                score_project: scores.score_project,
                score_education: scores.score_education,
                score_total: scoreTotal,
                ai_reason_accept: scores.ai_reason_accept,
                ai_reason_reject: scores.ai_reason_reject,
                status: finalStatus
            })
            .eq('id', applicant_id)

        if (updateError) throw updateError

        // 7. Write to Google Sheets (Non-blocking)
        appendToSheets(applicant, position, scoreTotal, finalStatus, scores).catch(err => console.error('Sheets Error:', err))

        // 8. Send Email via Resend if Auto Decision
        if (finalStatus === 'auto_approved' || finalStatus === 'auto_rejected') {
            sendEmail(applicant, position, finalStatus, scores.ai_reason_reject).catch(err => console.error('Email Error:', err))
        }

        return new Response(JSON.stringify({ success: true, status: finalStatus, score: scoreTotal }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Scoring Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

async function sendEmail(applicant: any, position: any, status: string, reason: string) {
    const isApprove = status === 'auto_approved'
    const subject = isApprove
        ? `Congratulations — You passed the CV screening for ${position.title}`
        : `Update on your application for ${position.title}`

    const html = isApprove
        ? `<p>Hi ${applicant.nama},</p><p>Your CV for the <strong>${position.title}</strong> position has passed our initial screening.</p><p>Please use the link below to book your interview schedule:</p><p><a href="${Deno.env.get('INTERVIEW_BOOKING_URL') || '#'}">Book Interview Schedule</a></p>`
        : `<p>Hi ${applicant.nama},</p><p>Thank you for applying for the <strong>${position.title}</strong> position.</p><p>After reviewing your CV, we're unable to move forward at this time.</p><p><strong>Feedback:</strong><br/>${reason}</p>`

    await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: Deno.env.get('RESEND_FROM_EMAIL'),
            to: applicant.email,
            subject,
            html
        })
    })
}

async function appendToSheets(applicant: any, position: any, scoreTotal: number, status: string, scores: any) {
    try {
        console.log(`[Sheets] Attempting to append data for ${applicant.email}...`);
        const token = await getGoogleAccessToken()
        const sheetId = Deno.env.get('GOOGLE_SHEET_ID')

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Applicants!A:N:append?valueInputOption=USER_ENTERED`;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
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
                    status,
                    scores.ai_reason_accept,
                    scores.ai_reason_reject,
                    applicant.cv_url.startsWith('http')
                        ? applicant.cv_url
                        : `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/cv-uploads/${applicant.cv_url}`
                ]]
            })
        })

        const resData = await res.json();
        if (!res.ok) {
            console.error(`[Sheets] Error ${res.status}:`, JSON.stringify(resData));
        } else {
            console.log(`[Sheets] Successfully appended data for ${applicant.email}`);
        }
    } catch (err) {
        console.error('[Sheets] Catch block error:', err);
    }
}

async function getGoogleAccessToken() {
    const email = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!
    const key = Deno.env.get('GOOGLE_PRIVATE_KEY')!.replace(/\\n/g, '\n')
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 3600
    const header = { alg: "RS256", typ: "JWT" }
    const payload = {
        iss: email,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: "https://oauth2.googleapis.com/token",
        exp,
        iat,
    }
    const cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        new TextEncoder().encode(key),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    )
    const jwt = await djwt.create(header, payload, cryptoKey)
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })
    const data = await res.json()
    return data.access_token
}
