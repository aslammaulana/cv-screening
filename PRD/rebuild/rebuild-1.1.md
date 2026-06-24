# Brainstorming: CV Screening Rebuild v1.1

> Dokumen ini adalah catatan brainstorming sebelum development dimulai.
> Tidak ada kode yang diubah. Tujuannya untuk memetakan alur, masalah lama, dan rencana baru.

---

## 🔍 Kondisi Saat Ini (cv-screening lama)

### Yang Bermasalah
| Masalah | Detail |
|---|---|
| **Supabase Storage** | CV disimpan di Supabase Storage yang private. Untuk AI bisa membaca PDF-nya, sistem harus download dulu file-nya ke server, baru dikirim ke Gemini sebagai `inlineData` base64. Ini tidak efisien dan menambah payload. |
| **Nama file tidak bermakna** | Format nama: `Nama_Posisi_timestamp.pdf` → tidak terhubung langsung ke ID applicant di database. Susah di-trace manual. |
| **AI pipeline non-blocking tapi rapuh** | AI dipanggil via `fetch()` fire-and-forget setelah submit. Kalau server busy atau cold start, bisa gagal tanpa ada retry mechanism. |
| **Tidak ada `extracted_cv` (plain text)** | Teks PDF tidak pernah di-extract jadi string. AI hanya bisa membaca via binary PDF. Jika suatu saat PDF corrupt atau AI tidak support file, tidak ada fallback. |
| **cv_url bukan public URL** | Yang disimpan di DB hanya path file Supabase (`nama_posisi_timestamp.pdf`), bukan URL publik yang langsung bisa dibuka. Dashboard harus construct URL-nya sendiri dan tetap bergantung pada Supabase Storage. |

### Yang Sudah Bagus (Dipertahankan)
- ✅ Sistem scoring berbasis bobot (weight_skill, weight_experience, dll)
- ✅ AI key rotation (5 keys Gemini)
- ✅ Auto approve/reject berdasarkan threshold
- ✅ Must-have enforcement (force reject jika tidak lolos)
- ✅ Google Sheets sync untuk rekap eksternal
- ✅ Duplicate check (email + posisi)
- ✅ `ai_config` tabel untuk manage prompt dari DB (tidak hardcode)

---

## ✅ Alur Baru (Mengacu ke form-drive)

### Submit Flow (`/api/apply`)

```
FormData masuk
   │
   ├─ Validasi (nama, email, gender, posisi, file PDF)
   │
   ├─ Cek posisi aktif di DB (job_positions)
   │
   ├─ Cek duplikat (email + job_position_id)
   │
   ├─ Convert file → Buffer
   │
   ├─ 🆕 Extract teks PDF dengan pdf-parse → extractedText
   │
   ├─ Insert ke Supabase → dapat id_applicant
   │    { nama, email, gender, job_position_id, extracted_cv: extractedText,
   │      cv_url: "", status: "pending" }
   │
   ├─ Upload PDF ke Google Drive (OAuth2)
   │    nama file: {id}-{nama-slug}-{posisi-slug}.pdf
   │    contoh: 12-ahmad-maysura-web-developer.pdf
   │
   ├─ Set permission Drive: anyone with link can view
   │
   ├─ Update Supabase → tambah cv_url (webViewLink dari Drive)
   │
   └─ Trigger AI processing (async / non-blocking)
```

### AI Process Flow (`/api/ai/process`)

```
Terima applicant_id
   │
   ├─ Fetch applicant dari DB (sudah ada extracted_cv + cv_url)
   │
   ├─ AI Step 1: Ekstraksi terstruktur
   │    Kirim extracted_cv (plain text) sebagai konteks ke Gemini
   │    → parse JSON: nama, skills, pengalaman, pendidikan, dll
   │    → simpan ke cv_json di DB
   │
   ├─ AI Step 2: Scoring
   │    Bandingkan cv_json dengan must_have, nice_to_have, focus_points posisi
   │    → score_skill, score_experience, score_project, score_education
   │    → meets_all_must_haves (boolean)
   │    → ai_reason_accept, ai_reason_reject (bahasa Indonesia)
   │
   ├─ Hitung score_total (weighted)
   │
   ├─ Tentukan status: auto_approved / auto_rejected / manual_review
   │
   ├─ Update DB applicants (scores + status)
   │
   └─ Sync ke Google Sheets
```

---

## 💡 Pendapat & Catatan Penting

### 1. `extracted_cv` adalah kunci
Dengan menyimpan plain text PDF di DB, kita punya **tiga keuntungan besar**:
- AI tidak perlu download file lagi → lebih cepat, lebih hemat
- Bisa dijadikan fallback jika Google Drive link expired
- Bisa di-search/index langsung dari Supabase

### 2. Google Drive vs Supabase Storage
| | Supabase Storage | Google Drive (OAuth) |
|---|---|---|
| Akses file | Private, perlu signed URL | Public link (anyone viewer) |
| URL stabil | Hanya signed (expire) | Permanen |
| Bisa dibuka user | Susah tanpa auth | Ya, langsung dari link |
| Dashboard admin | Construct URL manual | Langsung pakai `webViewLink` |

→ **Google Drive lebih masuk akal** untuk use case ini karena admin dashboard bisa langsung klik link CV.

### 3. Rename PDF sebelum upload ke Drive
Format: `{id}-{nama-slug}-{posisi-slug}.pdf`

Keuntungan:
- File di Drive terorganisir dan mudah dicari manual
- ID applicant terhubung langsung ke file tanpa perlu buka DB
- Tidak ada collision nama file

### 4. AI membaca `extracted_cv`, bukan PDF langsung
Ini berbeda dari sistem lama yang kirim PDF binary ke Gemini.

**Pendapat saya**: Lebih baik kirim `extracted_cv` (plain text) karena:
- `pdf-parse` sudah cukup baik untuk CV berbasis teks
- Kirim PDF binary ke Gemini pakai kuota lebih besar
- Lebih predictable hasilnya

**Namun ada trade-off**: Jika CV dibuat dalam format gambar/scan (bukan teks digital), `pdf-parse` akan gagal extract dan `extracted_cv` akan kosong. Solusinya:
- Jika `extracted_cv` kosong, fallback ke kirim PDF buffer ke Gemini seperti sistem lama
- Atau tampilkan warning di form bahwa CV harus berbasis teks (bukan scan)

### 5. Trigger AI: Tetap async atau inline?
Sistem lama: fire-and-forget `fetch()` → risiko gagal senyap.

**Opsi A (Recommended):** Tetap async tapi tambah status tracking
- Setelah submit, status = `"pending"`
- AI process berjalan di background
- Dashboard refresh untuk lihat hasil

**Opsi B:** AI process inline (synchronous) di `/api/apply`
- Lebih simple, tidak ada fire-and-forget
- Tapi response form jadi lambat (5–15 detik)
- User mungkin pikir form hang

→ Saya rekomendasikan **Opsi A**, seperti sistem lama, tapi dengan lebih robust handling.

### 6. Spreadsheet sync
Saat ini Google Sheets sync menggunakan **Service Account** (bukan OAuth). Ini sudah tepat untuk Sheets karena tidak perlu user consent.

Untuk rebuild, bisa pisahkan concern:
- Google Drive → OAuth (untuk upload file — sudah dibuktikan di form-drive)
- Google Sheets → Service Account (tetap, tidak perlu diubah)

---

## ✅ Keputusan Final (Sudah Dikonfirmasi)

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | **form-drive vs cv-screening** | `form-drive` hanya playground/referensi. Dashboard tetap di `cv-screening`. Satu project. |
| 2 | **Redesign UI apply?** | Tidak — hanya backend yang diubah. UI `/apply` menyesuaikan perubahan backend. |
| 3 | **Fitur retry AI di dashboard?** | ✅ Tetap ada |
| 4 | **Folder Drive structure?** | Dipisah per posisi → `/{posisi-slug}/{id}-{nama-slug}-{posisi-slug}.pdf` |

### Contoh nama file & path di Drive:
```
/web-developer/12-ahmad-maysura-web-developer.pdf
/ui-ux-designer/7-budi-santoso-ui-ux-designer.pdf
/accountant/3-siti-rahayu-accountant.pdf
```

---

## 📋 Ringkasan Perubahan Utama vs Sistem Lama

| Aspek | Sistem Lama | Rebuild |
|---|---|---|
| Storage | Supabase Storage | Google Drive (OAuth) |
| Nama file | `Nama_Posisi_timestamp.pdf` | `{id}-{nama}-{posisi}.pdf` |
| Plain text PDF | ❌ Tidak ada | ✅ `extracted_cv` via pdf-parse |
| AI input | PDF binary (base64) | `extracted_cv` (plain text) + fallback ke PDF |
| cv_url di DB | Path file Supabase | Google Drive `webViewLink` (langsung bisa dibuka) |
| AI trigger | Fire-and-forget fetch | Fire-and-forget (tetap, tapi review robustness) |
| Sheets auth | Service Account | Service Account (tidak berubah) |
| Drive auth | Service Account | OAuth2 Refresh Token |
