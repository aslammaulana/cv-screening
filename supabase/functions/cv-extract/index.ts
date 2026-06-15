// Follow Supabase Edge Function standards (Deno)
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
        if (!applicant_id) throw new Error('Missing applicant_id')

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch applicant and config
        const { data: applicant, error: appError } = await supabaseAdmin
            .from('applicants')
            .select('cv_url, job_position_id')
            .eq('id', applicant_id)
            .single()

        if (appError || !applicant) throw new Error('Applicant not found')

        const { data: config, error: configError } = await supabaseAdmin
            .from('ai_config')
            .select('extraction_prompt')
            .single()

        if (configError || !config) throw new Error('AI Config not found')

        // 2. Download PDF from Supabase Storage
        const filePath = applicant.cv_url
        if (!filePath) throw new Error('CV File Path not found in applicant record')

        const { data: fileData, error: downloadError } = await supabaseAdmin
            .storage
            .from('cv-uploads')
            .download(filePath)

        if (downloadError || !fileData) throw new Error(`Supabase Storage download failed: ${downloadError?.message}`)

        const arrayBuffer = await fileData.arrayBuffer()
        const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

        // 3. Call Gemini
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY_1') ?? '')
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Pdf,
                    mimeType: "application/pdf"
                }
            },
            { text: config.extraction_prompt }
        ])

        const responseText = result.response.text()
        const cleanedJson = responseText.replace(/```json|```/g, '').trim()
        const cvJson = JSON.parse(cleanedJson)

        // 4. Update Supabase
        const { error: updateError } = await supabaseAdmin
            .from('applicants')
            .update({
                cv_json: cvJson,
                status: 'extracted'
            })
            .eq('id', applicant_id)

        if (updateError) throw updateError

        // 5. Trigger next step (Scoring)
        console.log(`[Extract] Triggering cv-score for ${applicant_id}...`);
        const scoringRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/cv-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            },
            body: JSON.stringify({ applicant_id })
        });

        if (!scoringRes.ok) {
            const scoringErr = await scoringRes.text();
            console.error(`[Extract] Failed to trigger cv-score: ${scoringRes.status} ${scoringErr}`);
        } else {
            console.log(`[Extract] Successfully triggered cv-score for ${applicant_id}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Extraction Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
