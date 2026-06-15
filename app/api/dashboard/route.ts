import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = createAdminClient();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalCount,
            todayCount,
            needReviewCount,
            autoApprovedCount,
            autoRejectedCount,
            failedCount
        ] = await Promise.all([
            supabase.from("applicants").select("id", { count: "exact", head: true }),
            supabase.from("applicants").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
            supabase.from("applicants").select("id", { count: "exact", head: true }).eq("status", "manual_review"),
            supabase.from("applicants").select("id", { count: "exact", head: true }).in("status", ["auto_approved", "approved"]),
            supabase.from("applicants").select("id", { count: "exact", head: true }).in("status", ["auto_rejected", "rejected"]),
            supabase.from("applicants").select("id", { count: "exact", head: true }).eq("status", "failed"),
        ]);

        return NextResponse.json({
            total: totalCount.count || 0,
            today: todayCount.count || 0,
            needReview: needReviewCount.count || 0,
            autoApproved: autoApprovedCount.count || 0,
            autoRejected: autoRejectedCount.count || 0,
            failed: failedCount.count || 0,
        });
    } catch (err) {
        console.error("Dashboard metrics error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
