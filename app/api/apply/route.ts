import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadFileToDrive, getDriveFolderIdByPosition, sanitizeSlug } from "@/lib/google/drive";
import pdf from "pdf-parse";


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

        // 4. Convert file → Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 5. Ekstrak teks PDF via pdf-parse
        let extractedText = "";
        try {
            const pdfData = await pdf(buffer);
            extractedText = pdfData.text || "";
            console.log(`[Apply API] PDF extracted: ${extractedText.length} characters`);
        } catch (pdfErr) {
            // Tetap lanjut meskipun ekstraksi gagal (PDF scan/gambar)
            console.warn("[Apply API] PDF extraction failed, continuing without extracted text:", pdfErr);
        }

        // 6. Insert ke Supabase → dapat id & id_no
        const { data: newApplicant, error: insertError } = await supabase
            .from("applicants")
            .insert({
                job_position_id: posData.id,
                nama,
                email,
                gender,
                cv_url: "",           // akan diupdate setelah upload Drive
                extracted_cv: extractedText,
                status: "pending",
            })
            .select("id, id_no")
            .single();

        if (insertError || !newApplicant) {
            console.error("[Apply API] DB Insert error:", insertError);
            return NextResponse.json({ error: "Failed to save application." }, { status: 500 });
        }

        const applicantId = newApplicant.id;
        const idNo = newApplicant.id_no;

        // 7. Upload CV ke Google Drive
        // Nama file: {id_no}-{nama-slug}-{posisi-slug}.pdf
        // Contoh: 1-ahmad-maysura-web-developer.pdf
        let cvUrl = "";
        try {
            const fileName = `${idNo}-${sanitizeSlug(nama)}-${sanitizeSlug(posisi)}.pdf`;
            const folderId = getDriveFolderIdByPosition(posisi);

            cvUrl = await uploadFileToDrive({ buffer, fileName, folderId });
            console.log(`[Apply API] CV uploaded to Drive: ${cvUrl}`);
        } catch (driveErr) {
            console.error("[Apply API] Google Drive upload error:", driveErr);
            // Tetap lanjut, cv_url akan kosong — admin bisa re-upload manual
        }

        // 8. Update Supabase dengan cv_url dari Drive
        if (cvUrl) {
            const { error: updateError } = await supabase
                .from("applicants")
                .update({ cv_url: cvUrl })
                .eq("id", applicantId);

            if (updateError) {
                console.error("[Apply API] Failed to update cv_url:", updateError);
            }
        }

        // 9. Trigger AI Processing (Non-blocking)
        console.log(`[Apply API] Triggering AI processing for ${applicantId}...`);

        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host");
        const aiUrl = `${protocol}://${host}/api/ai/process`;

        fetch(aiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ applicant_id: applicantId }),
        }).catch(err => console.error("[Apply API] Failed to trigger AI process:", err));

        return NextResponse.json({ message: "CV received successfully" });
    } catch (err: unknown) {
        console.error("[Apply API] Unhandled error:", err instanceof Error ? err.message : err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
