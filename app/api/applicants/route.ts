import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    try {
        let query = supabase
            .from("applicants")
            .select("*, job_positions(title)")
            .order("created_at", { ascending: false });

        if (status && status !== "All Status") {
            const statusValue = status === 'Needs Review' ? 'manual_review' : status.toLowerCase().replace(/\s+/g, "_");
            query = query.eq("status", statusValue);
        }

        const { data, error } = await query;

        if (error) {
            console.error("[Applicants API] Error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const applicants = (data || []).map(a => ({
            ...a,
            position: Array.isArray(a.job_positions)
                ? a.job_positions[0]?.title
                : (a.job_positions as any)?.title || "Unknown"
        }));

        return NextResponse.json(applicants);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const supabase = createAdminClient();
    const { id, status } = await req.json();

    if (!id || !status) {
        return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const { error } = await supabase
        .from("applicants")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
