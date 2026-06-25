import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET — fetch current AI config
export async function GET() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("ai_config")
            .select("id, persona_prompt, updated_at")
            .single();

        if (error) {
            // If the table is empty, return a default one rather than crashing
            if (error.code === 'PGRST116') { // code for "no rows found"
                return NextResponse.json({
                    id: 'default',
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
    const { id, persona_prompt } = await req.json();
    if (!id || !persona_prompt) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Use upsert to handle both creating the first row and updating existing ones
    // We target by ID if it's a real UUID, otherwise we just upsert the first row
    const payload: any = {
        persona_prompt,
        updated_at: new Date().toISOString()
    };

    if (id && id !== 'default') {
        payload.id = id;
    }

    const { error } = await supabase
        .from("ai_config")
        .upsert(payload);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
