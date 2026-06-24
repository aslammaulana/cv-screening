# Implementation Plan: CV Screening Rebuild

> Referensi: [`rebuild-1.1.md`](./rebuild-1.1.md)
> Status: Draft — belum mulai development

---

## Ringkasan Perubahan

Rebuild ini **hanya menyentuh backend** (API routes + lib utilities). UI tidak diubah kecuali penyesuaian minor pada `/apply` untuk menyesuaikan response baru. Perubahan inti:

1. Ganti **Supabase Storage → Google Drive (OAuth2)** untuk penyimpanan CV
2. Tambah **PDF text extraction** via `pdf-parse` sebelum upload
3. Update **AI pipeline** agar baca `extracted_cv` (plain text) bukan download dari Storage
4. Update **Google Sheets sync** agar pakai Drive `webViewLink` bukan Supabase Storage URL
5. Tambah **`lib/google/drive.ts`** sebagai helper terpusat untuk Google Drive OAuth

---

## Estimasi Sprint

> 1 sprint = sesi kerja terfokus (satu atau beberapa jam coding)

| Sprint | Fokus | Estimasi |
|---|---|---|
| Sprint 1 | Setup & Fondasi | 1 sesi |
| Sprint 2 | Backend Submit (`/api/apply`) | 1 sesi |
| Sprint 3 | AI Pipeline (`/api/ai/process`) | 1 sesi |
| Sprint 4 | Verifikasi & Stabilisasi | 1 sesi |

**Total: ~4 sprint**

---

## Sprint 1 — Setup & Fondasi

### Tujuan
Siapkan library, helper, dan schema DB sebelum menyentuh API routes.

### 1.1 Install Dependencies

```bash
npm install pdf-parse
npm install --save-dev @types/pdf-parse
```

> `googleapis` sudah terinstall di `cv-screening`. Pastikan versinya mendukung OAuth2.

### 1.2 Tambah Environment Variables

Tambahkan ke `.env.local`:

```env
# Google Drive OAuth2 (untuk upload CV)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=

# Google Drive Folder IDs per posisi (contoh)
GOOGLE_DRIVE_FOLDER_UI_UX_DESIGNER=
GOOGLE_DRIVE_FOLDER_WEB_DEVELOPER=
GOOGLE_DRIVE_FOLDER_ACCOUNTANT=

# Google Sheets tetap pakai Service Account (tidak berubah)
GOOGLE_SERVICE_ACCOUNT_EMAIL=  (sudah ada)
GOOGLE_PRIVATE_KEY=            (sudah ada)
GOOGLE_SHEET_ID=               (sudah ada)
```

> **Catatan**: Folder Drive per posisi harus dibuat manual di Google Drive terlebih dahulu, lalu ID-nya dimasukkan ke env.

### 1.3 Buat `lib/google/drive.ts` — Helper Google Drive

#### [NEW] `lib/google/drive.ts`

```
Fungsi yang dibuat:
- getOAuthClient()         → inisialisasi OAuth2 client dengan refresh_token
- getDriveFolderIdByPosition(posisi: string) → mapping posisi → folder ID dari env
- sanitizeFileName(str: string) → lowercase, spasi jadi dash, hapus karakter aneh
- uploadFileToDrive(options) → upload buffer ke Drive, set permission viewer, return webViewLink
```

### 1.4 Migrasi Schema Supabase

Tambahkan kolom `extracted_cv` ke tabel `applicants` jika belum ada:

```sql
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS extracted_cv TEXT;
```

> Kolom `cv_url` tetap ada, nilainya akan diubah dari Supabase Storage path → Google Drive `webViewLink`.

---

## Sprint 2 — Backend Submit (`/api/apply`)

### Tujuan
Refactor `/api/apply/route.ts` untuk mengganti Supabase Storage dengan Google Drive + tambah pdf-parse extraction.

### File yang Diubah

#### [MODIFY] `app/api/apply/route.ts`

**Alur baru (urutan eksekusi):**

```
1. Parse FormData & Validasi (sama seperti sekarang)
2. Cek posisi aktif di DB (sama)
3. Cek duplikat email + posisi (sama)
4. Convert file → Buffer (BARU)
5. Ekstrak teks PDF via pdf-parse → extractedText (BARU)
6. Insert ke Supabase → dapat id (sama, tapi tambah extracted_cv)
   { nama, email, gender, job_position_id, extracted_cv, cv_url: "", status: "pending" }
7. Tentukan folder Drive berdasarkan posisi (BARU)
8. Upload ke Google Drive dengan nama: {id}-{nama-slug}-{posisi-slug}.pdf (BARU)
9. Set permission: anyone with link can view (BARU)
10. Update Supabase → cv_url = webViewLink dari Drive (BARU)
11. Trigger AI process (async, sama seperti sekarang)
12. Return success
```

**Hal yang DIHAPUS:**
- Import dan penggunaan `supabase.storage.from('cv-uploads').upload()`
- Konstruksi nama file lama (`Nama_Posisi_timestamp.pdf`)

**Hal yang DITAMBAHKAN:**
- `import pdf from 'pdf-parse'`
- `import { uploadFileToDrive, getDriveFolderIdByPosition, sanitizeFileName } from '@/lib/google/drive'`
- Logic ekstraksi teks sebelum insert
- Logic upload Google Drive setelah insert (untuk dapat `id`)

---

## Sprint 3 — AI Pipeline (`/api/ai/process`)

### Tujuan
Refactor `/api/ai/process/route.ts` agar tidak lagi download file dari Supabase Storage. Gunakan `extracted_cv` dari DB sebagai input utama AI.

### File yang Diubah

#### [MODIFY] `app/api/ai/process/route.ts`

**Perubahan di Step 1 (Extraction):**

```
SEBELUM:
  → Download file dari Supabase Storage
  → Convert ke buffer
  → Kirim PDF binary (base64) ke Gemini untuk ekstraksi

SESUDAH:
  → Baca applicant.extracted_cv dari DB (sudah ada, plain text)
  → Jika extracted_cv tidak kosong:
      Kirim plain text ke Gemini untuk parsing terstruktur → cv_json
  → Jika extracted_cv kosong (fallback):
      Ambil cv_url (Drive link), beri warning di log
      Tetap proses dengan prompt saja tanpa file
```

**Hal yang DIHAPUS:**
- `supabase.storage.from('cv-uploads').download(applicant.cv_url)`
- Konversi `fileData.arrayBuffer()` ke `pdfBuffer`
- Passing `fileBuffer` ke `genAIWithRotation` untuk extraction step

**Update Sheets sync (Step 3 di AI process):**
```
SEBELUM:
  const cvUrl = applicant.cv_url.startsWith('http')
    ? applicant.cv_url
    : `${SUPABASE_URL}/storage/v1/object/public/cv-uploads/${applicant.cv_url}`

SESUDAH:
  const cvUrl = applicant.cv_url  // sudah berupa webViewLink Drive
```

---

## Sprint 4 — Verifikasi & Stabilisasi

### 4.1 Cek & Hapus Supabase Storage

Setelah semua berjalan, Supabase Storage bucket `cv-uploads` tidak lagi digunakan. Bisa di-disable atau tetap dibiarkan (tidak ada biaya ekstra sampai ada data).

### 4.2 Uji End-to-End

Langkah uji manual:

1. Buka `/apply`
2. Submit form dengan data valid + file PDF teks (bukan scan)
3. Cek Supabase → row baru harus ada dengan:
   - `extracted_cv` terisi teks
   - `cv_url` berupa URL Google Drive (`https://drive.google.com/...`)
4. Cek Google Drive → file ada di folder posisi yang sesuai, nama file format `{id}-{nama}-{posisi}.pdf`
5. Tunggu beberapa detik → cek Supabase lagi, kolom `score_*` dan `status` harus terisi
6. Cek Google Sheets → baris baru harus muncul dengan link Drive yang benar

### 4.3 Uji Edge Cases

| Skenario | Ekspektasi |
|---|---|
| PDF scan (tidak ada teks) | `extracted_cv` kosong, AI tetap proses dengan prompt, status `manual_review` |
| File bukan PDF | Validation error 400 |
| File >5MB | Validation error 400 |
| Email duplikat di posisi sama | Error "already applied" |
| Semua Gemini API key habis kuota | Error 500, status tetap `pending` di DB |

---

## Ringkasan File yang Berubah

| File | Aksi | Sprint |
|---|---|---|
| `lib/google/drive.ts` | **[NEW]** Helper Google Drive OAuth | 1 |
| `.env.local` | **[MODIFY]** Tambah env vars Drive OAuth | 1 |
| `app/api/apply/route.ts` | **[MODIFY]** Ganti Storage → Drive, tambah pdf-parse | 2 |
| `app/api/ai/process/route.ts` | **[MODIFY]** Baca `extracted_cv` dari DB, hapus download Storage | 3 |

> File lain (`/api/applicants`, `/api/positions`, `/api/dashboard`, dashboard components) **tidak berubah**.
