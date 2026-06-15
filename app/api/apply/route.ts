import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const nama = formData.get("nama") as string;
        const email = formData.get("email") as string;
        const gender = formData.get("gender") as string;
        const posisi = formData.get("posisi") as string; // Title
        const file = formData.get("cv") as File;

        console.log(`[Apply API] New submission: ${nama} (${email}) for ${posisi}`);

        // 1. Basic Validation
        if (!nama || !email || !gender || !posisi || !file) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File size exceeds 5MB" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 2. Fetch Position ID & Check Active
        const { data: posData, error: posError } = await supabase
            .from("job_positions")
            .select("id, title")
            .eq("title", posisi)
            .eq("is_active", true)
            .single();

        if (posError || !posData) {
            console.error(`[Apply API] Position error:`, posError);
            return NextResponse.json({ error: "Position not found or inactive" }, { status: 400 });
        }

        // 3. Duplicate Check
        const { data: existing } = await supabase
            .from("applicants")
            .select("id")
            .eq("email", email)
            .eq("job_position_id", posData.id)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: "You have already applied for this position." },
                { status: 400 }
            );
        }

        // 4. Upload CV to Supabase Storage
        let filePath = "";
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${nama.replace(/\s+/g, "_")}_${posisi.replace(/\s+/g, "_")}_${Date.now()}.${fileExt}`;
            filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from('cv-uploads')
                .upload(fileName, file, {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get the public or signed URL if needed, but for internal use, we just store the path
            // In Next.js, we can also use publicUrl if bucket is public, but it's private.
            // For now, we store the fileName/path.
        } catch (storageErr: unknown) {
            const error = storageErr as Error;
            console.error("[Apply API] Supabase Storage error:", error.message);
            return NextResponse.json(
                { error: `Storage upload failed: ${error.message}` },
                { status: 500 }
            );
        }

        // 5. Insert to Supabase
        const { data: newApplicant, error: insertError } = await supabase
            .from("applicants")
            .insert({
                job_position_id: posData.id,
                nama,
                email,
                gender,
                cv_url: filePath,
                status: "pending",
            })
            .select("id")
            .single();

        if (insertError || !newApplicant) {
            console.error("[Apply API] DB Insert error:", insertError);
            return NextResponse.json({ error: "Failed to save application." }, { status: 500 });
        }

        // 6. Trigger AI Extraction (Non-blocking)
        console.log(`[Apply API] Triggering AI processing for ${newApplicant.id}...`);

        // Use an absolute URL based on the request host
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host");
        const aiUrl = `${protocol}://${host}/api/ai/process`;

        fetch(aiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ applicant_id: newApplicant.id })
        }).catch(err => console.error('[Apply API] Failed to trigger AI process:', err));

        return NextResponse.json({ message: "CV received successfully" });
    } catch (err: unknown) {
        console.error("[Apply API] Unhandled error:", err instanceof Error ? err.message : err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
