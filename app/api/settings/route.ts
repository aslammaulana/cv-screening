import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000000";

// GET — fetch current AI config
export async function GET() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("ai_config")
            .select("id, persona_prompt, updated_at")
            .eq("id", SETTINGS_ID)
            .single();

        if (error) {
            // If the specific row is missing, return fallback
            if (error.code === 'PGRST116') {
                return NextResponse.json({
                    id: SETTINGS_ID,
                    persona_prompt: "You are a Technical Recruiter...",
                    updated_at: new Date().toISOString()
                });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH — update AI config
export async function PATCH(req: Request) {
    try {
        const { persona_prompt } = await req.json();
        if (!persona_prompt) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Always upsert to the fixed SETTINGS_ID to ensure exactly ONE row
        const { error } = await supabase
            .from("ai_config")
            .upsert({
                id: SETTINGS_ID,
                persona_prompt,
                updated_at: new Date().toISOString()
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
