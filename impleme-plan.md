# Setup Script "Activate" untuk Supabase (Portofolio Open Source)

Untuk mencegah Supabase mematikan project gratis setiap 2 minggu, kita akan mengimplementasikan sistem "Heartbeat".

## 1. Database Setup
Buat tabel baru di Supabase:
```sql
CREATE TABLE IF NOT EXISTS projects_keep_alive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_ping TIMESTAMPTZ DEFAULT NOW(),
    note TEXT DEFAULT 'Heartbeat to prevent pausing'
);
```

## 2. API Endpoint (Next.js)
Buat route baru di `app/api/cron/keep-alive/route.ts` yang akan menginsert data ke tabel tersebut. Route ini akan diproteksi dengan `CRON_SECRET`.

## 3. Otomatisasi (GitHub Actions)
Karena repo ini open source di GitHub, kita bisa menggunakan **GitHub Actions** (gratis) untuk memanggil API tersebut setiap hari secara otomatis.

Langkah-langkah:
1. Buat file `.github/workflows/keep-alive.yml`.
2. Schedule berjalan setiap hari jam 00:00 UTC.
3. Gunakan `curl` untuk memanggil endpoint API kita.

## 4. Keuntungan
- Project portofolio selalu online 24/7.
- Tidak perlu login manual ke dashboard Supabase untuk klik "Restore".
- Menunjukkan kemampuan otomasi & DevOps di portofolio.
