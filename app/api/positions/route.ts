import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("job_positions")
            .select("id, title")
            .eq("is_active", true)
            .order("title", { ascending: true });

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("API error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
