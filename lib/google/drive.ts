import { google } from "googleapis";
import { Readable } from "stream";

/**
 * Inisialisasi Google OAuth2 client menggunakan refresh_token.
 * Digunakan untuk upload file ke Google Drive.
 */
export function getOAuthClient() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    });
    return oauth2Client;
}

/**
 * Sanitize string untuk nama file:
 * lowercase, spasi → dash, hapus karakter selain huruf/angka/dash
 * Contoh: "Web Developer" → "web-developer"
 */
export function sanitizeSlug(str: string): string {
    return str
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
}

/**
 * Mapping posisi (title) → Google Drive Folder ID dari environment variables.
 * Folder harus sudah dibuat manual di Google Drive.
 */
export function getDriveFolderIdByPosition(posisi: string): string {
    const slug = sanitizeSlug(posisi);

    const folderMap: Record<string, string | undefined> = {
        "ui-ux-designer": process.env.GOOGLE_DRIVE_FOLDER_UI_UX_DESIGNER,
        "web-developer": process.env.GOOGLE_DRIVE_FOLDER_WEB_DEVELOPER,
        "accountant": process.env.GOOGLE_DRIVE_FOLDER_ACCOUNTANT,
    };

    const folderId = folderMap[slug] ?? process.env.GOOGLE_DRIVE_FOLDER_DEFAULT;

    if (!folderId) {
        throw new Error(
            `[Drive] Folder ID not found for position: "${posisi}" (slug: "${slug}"). ` +
            `Set GOOGLE_DRIVE_FOLDER_${slug.toUpperCase().replace(/-/g, "_")} in .env.local`
        );
    }

    return folderId;
}

export interface UploadFileToDriveOptions {
    buffer: Buffer;
    fileName: string;       // nama file final, sudah di-sanitize
    folderId: string;       // Google Drive folder ID tujuan
    mimeType?: string;      // default: application/pdf
}

/**
 * Upload file buffer ke Google Drive menggunakan OAuth2.
 * Setelah upload, set permission agar anyone with link bisa view.
 *
 * @returns webViewLink — URL Google Drive yang bisa langsung dibuka
 */
export async function uploadFileToDrive({
    buffer,
    fileName,
    folderId,
    mimeType = "application/pdf",
}: UploadFileToDriveOptions): Promise<string> {
    const auth = getOAuthClient();
    const drive = google.drive({ version: "v3", auth });

    const stream = Readable.from(buffer);

    // 1. Upload file
    const driveResponse = await drive.files.create({
        requestBody: {
            name: fileName,
            parents: [folderId],
        },
        media: {
            mimeType,
            body: stream,
        },
        fields: "id,webViewLink",
    });

    const fileId = driveResponse.data.id;
    const webViewLink = driveResponse.data.webViewLink;

    if (!fileId || !webViewLink) {
        throw new Error("[Drive] Upload succeeded but fileId or webViewLink is missing.");
    }

    // 2. Set permission: anyone can view
    await drive.permissions.create({
        fileId,
        requestBody: {
            type: "anyone",
            role: "reader",
        },
    });

    return webViewLink;
}
