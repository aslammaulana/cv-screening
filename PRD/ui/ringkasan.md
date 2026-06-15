# Ringkasan Aplikasi: AI-Powered CV Screening System

Sistem ini adalah platform otomasi rekrutmen yang menggunakan AI (Google Gemini) untuk memproses, menganalisis, dan memberikan skor pada CV kandidat secara otomatis.

## 🎯 Tujuan Utama
Mengurangi beban kerja tim HR dengan menyaring ribuan CV secara instan dan memberikan rekomendasi keputusan (Approve/Reject/Review) berdasarkan kriteria yang telah ditentukan.

## 🚀 Fitur Utama

### 1. Public Application Form (`/apply`)
- Halaman bagi kandidat untuk mengisi data diri Dasar (Nama, Email, Gender, Posisi).
- Upload CV dalam format PDF.
- Validasi instan untuk memastikan kelengkapan data.

### 2. Dashboard Admin
- **Overview Metrics:** Statistik total pelamar, jumlah yang perlu direview, dan rasio kelulusan.
- **Qualification Management:** Konfigurasi kriteria per posisi (Must-have, Nice-to-have, Weights scoring, dan Thresholds keputusan).
- **Applicant Tracking:** Tabel master pelamar dengan filter canggih, status badge, dan detail alasan AI (AI Reasoning).
- **Settings:** Pengaturan prompt AI (Persona, Ekstraksi, Scoring) untuk mengontrol perilaku Gemini.

### 3. Otomasi AI (Gemini AI)
- **Ekstraksi Data:** Secara otomatis mengambil informasi pendidikan, pengalaman, skill, dan project dari PDF CV.
- **Scoring:** Memberikan skor 0-100 pada 4 dimensi (Skill, Experience, Project, Education) berdasarkan bobot yang ditentukan HR.
- **Decision Engine:** 
  - **Auto-Approve:** Skor tinggi langsung lolos.
  - **Auto-Reject:** Skor rendah langsung ditolak.
  - **Manual Review:** Skor menengah menunggu keputusan manual HR.
- **AI Reasoning:** Memberikan penjelasan tekstual mengapa kandidat diterima atau ditolak.

### 4. Notifikasi Email
- Pengiriman hasil screening secara otomatis via email kepada kandidat menggunakan **Resend**.

## 🛠️ Stack Teknologi
- **Frontend:** Next.js 15, Tailwind CSS 4, React Icons.
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **AI Model:** Google Gemini 1.5 Pro/Flash.
- **Email Service:** Resend.
