import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * CRON Job Endpoint: Keep Supabase Active
 * This endpoint inserts a heartbeat into the database to prevent the project from pausing.
 * Triggered daily via GitHub Actions or Vercel Cron.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    // 1. Basic Security Check
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        // 2. Perform a write operation to keep DB active
        const { error } = await supabase
            .from("projects_keep_alive")
            .insert({
                last_ping: new Date().toISOString(),
                note: "Daily heartbeat from GitHub Action"
            });

        if (error) {
            console.error("[Keep-Alive] DB Error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("[Keep-Alive] Heartbeat sent successfully.");
        return NextResponse.json({ success: true, message: "Heartbeat recorded" });
    } catch (err: any) {
        console.error("[Keep-Alive] Fatal Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
