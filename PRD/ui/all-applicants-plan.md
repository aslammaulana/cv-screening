# Sprint Plan — All Applicants UI (`/dashboard/all-applicants`)

> **Scope:** UI-only, no Supabase. Data menggunakan static/mock.
> **Stack:** Next.js 15 · Tailwind CSS · react-icons
> **Desain:** Minimalis, tabel bersih dengan filter bar di atas

---

## 1. Overview

Halaman master view semua pelamar. Fitur utama:
- Tabel data lengkap dengan kolom-kolom sesuai PRD
- Filter bar (posisi, status, search)
- Popover AI Reasoning per baris
- Tombol Approve/Reject untuk status `manual_review`

---

## 2. Layout Halaman

```
┌──────────────────────────────────────────────────────────────┐
│  All Applicants                                   [Admin]    │
├──────────────────────────────────────────────────────────────┤
│  [All Positions ▾]  [All Status ▾]  [🔍 Search name/email]  │
├──────────────────────────────────────────────────────────────┤
│ Name     │ Email           │ Gender │ Position  │ Score │ CV │ Status      │ AI Reason │ Action   │
├──────────────────────────────────────────────────────────────┤
│ John Doe │ john@email.com  │   M    │ Web Dev   │  92   │ ↗  │ ✅ Approved │  [View]   │    —     │
│ Jane S.  │ jane@email.com  │   F    │ Accountant│  73   │ ↗  │ 🔶 Review   │  [View]   │ [✓] [✗]  │
│ Bob K.   │ bob@email.com   │   M    │ Web Dev   │  31   │ ↗  │ ❌ Rejected │  [View]   │    —     │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Komponen

### 3.1 Mock Data

```typescript
const mockApplicants = [
  {
    id: "1", nama: "John Doe", email: "john@email.com", gender: "Male",
    position: "Web Developer", score_total: 92, cv_url: "#",
    status: "auto_approved",
    score_skill: 88, score_experience: 95, score_project: 90, score_education: 85,
    ai_reason_accept: "Kandidat memiliki 3+ tahun pengalaman nyata di perusahaan produk, background React yang kuat, dan portfolio yang solid.",
    ai_reason_reject: "Tidak ada kelemahan signifikan yang ditemukan.",
  },
  {
    id: "2", nama: "Jane Smith", email: "jane@email.com", gender: "Female",
    position: "Accountant", score_total: 73, cv_url: "#",
    status: "manual_review",
    score_skill: 70, score_experience: 75, score_project: 68, score_education: 80,
    ai_reason_accept: "Pengalaman relevan 2 tahun di bidang akuntansi, familiar dengan laporan keuangan.",
    ai_reason_reject: "Belum memiliki sertifikasi profesional yang disyaratkan.",
  },
  {
    id: "3", nama: "Bob Kusuma", email: "bob@email.com", gender: "Male",
    position: "Web Developer", score_total: 31, cv_url: "#",
    status: "auto_rejected",
    score_skill: 30, score_experience: 25, score_project: 35, score_education: 40,
    ai_reason_accept: "Memiliki gelar di bidang terkait.",
    ai_reason_reject: "Tidak ada pengalaman kerja profesional. Portfolio tidak relevan dengan posisi yang dilamar.",
  },
  {
    id: "4", nama: "Siti Rahayu", email: "siti@email.com", gender: "Female",
    position: "Web Developer", score_total: 58, cv_url: "#",
    status: "manual_review",
    score_skill: 55, score_experience: 60, score_project: 52, score_education: 65,
    ai_reason_accept: "Pengalaman 1 tahun sebagai junior dev, familiar dengan React dasar.",
    ai_reason_reject: "Pengalaman masih minim, portfolio kurang lengkap.",
  },
  {
    id: "5", nama: "Ahmad Fauzi", email: "ahmad@email.com", gender: "Male",
    position: "Accountant", score_total: 89, cv_url: "#",
    status: "auto_approved",
    score_skill: 85, score_experience: 92, score_project: 88, score_education: 90,
    ai_reason_accept: "5 tahun pengalaman di Big 4, memiliki sertifikasi CPA, track record yang sangat baik.",
    ai_reason_reject: "Tidak ada kelemahan signifikan.",
  },
  {
    id: "6", nama: "Dewi Anjani", email: "dewi@email.com", gender: "Female",
    position: "Web Developer", score_total: 0, cv_url: "#",
    status: "failed",
    score_skill: 0, score_experience: 0, score_project: 0, score_education: 0,
    ai_reason_accept: "",
    ai_reason_reject: "Gagal ekstrak CV — file corrupt atau format tidak didukung.",
  },
];
```

### 3.2 `ApplicantTable.tsx`

Tabel dengan kolom:
| Kolom | Lebar | Detail |
|---|---|---|
| Name | auto | Teks biasa |
| Email | auto | Teks abu kecil |
| Gender | 60px | "M" / "F" centered |
| Position | auto | Nama posisi |
| Score | 70px | Angka centered, bold |
| CV | 50px | Icon link `RiExternalLinkLine` — opens cv_url |
| Status | 140px | `StatusBadge` component |
| AI Reason | 100px | Tombol `[View]` — trigger popover |
| Action | 120px | Approve/Reject buttons (manual_review only) |

### 3.3 `StatusBadge.tsx`

| status | bg | text | label |
|---|---|---|---|
| `auto_approved` | green-100 | green-700 | Auto Approved |
| `manual_review` | amber-100 | amber-700 | Needs Review |
| `auto_rejected` | red-100 | red-700 | Auto Rejected |
| `approved` | green-100 | green-700 | Approved |
| `rejected` | red-100 | red-700 | Rejected |
| `pending` | gray-100 | gray-600 | Processing |
| `failed` | white | red-600 | Failed (border red) |

### 3.4 `AIReasonPopover.tsx`

Popover muncul saat tombol `[View]` diklik. Menggunakan posisi relative/absolute.
```
┌─────────────────────────────────────┐
│ AI Reasoning                   [✕]  │
│ ─────────────────────────────────── │
│ ✅ Diterima karena:                 │
│ [ai_reason_accept text]             │
│                                     │
│ ❌ Catatan negatif:                 │
│ [ai_reason_reject text]             │
│                                     │
│ Score Breakdown:                    │
│ Skill       [====bar====]  88       │
│ Experience  [========= ]  95       │
│ Project     [======    ]  90       │
│ Education   [=======   ]  85       │
└─────────────────────────────────────┘
```

Bar divisualisasikan dengan `div` width % sesuai nilai score.

### 3.5 Filter Bar

```typescript
// State di page.tsx
const [filterPosition, setFilterPosition] = useState("all");
const [filterStatus, setFilterStatus]     = useState("all");
const [searchQuery, setSearchQuery]       = useState("");

// Filter logic (client-side)
const filtered = mockApplicants.filter(a =>
  (filterPosition === "all" || a.position === filterPosition) &&
  (filterStatus   === "all" || a.status   === filterStatus)  &&
  (a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
   a.email.toLowerCase().includes(searchQuery.toLowerCase()))
);
```

### 3.6 Action Buttons

Untuk baris `manual_review`:
- **Approve** → set status ke `"approved"` di local state
- **Reject** → set status ke `"rejected"` di local state
- Setelah action: status badge berubah, tombol hilang

---

## 4. File Checklist

| File | Status |
|---|---|
| `app/(dashboard)/dashboard/all-applicants/page.tsx` | ⬜ Update dari placeholder |
| `components/applicants/ApplicantTable.tsx` | ⬜ Buat baru |
| `components/applicants/StatusBadge.tsx` | ⬜ Buat baru |
| `components/applicants/AIReasonPopover.tsx` | ⬜ Buat baru |

---

## 5. Notes

- Filter date range **dilewatkan** di sprint ini (kompleksitas tinggi, bisa ditambah nanti)
- Popover ditutup saat klik di luar area popover (click-outside handler)
- URL query param (`?status=manual_review`) dibaca via `useSearchParams()` untuk set filter default dari link dashboard
- Tabel **tidak paginated** di sprint ini — semua data tampil sekaligus
