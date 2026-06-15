# Sprint Plan — Dashboard UI (`/dashboard`)

> **Scope:** UI-only, no Supabase integration. All data menggunakan static/mock values.
> **Stack:** Next.js 15 (App Router) · Tailwind CSS · shadcn/ui · react-icons
> **Desain:** Minimalis/simple — sidebar putih, active state hijau, kartu polos tanpa icon

---

## 0. Project Setup & Design System

### 0.1 Install Dependencies
```bash
npx shadcn@latest init
npx shadcn@latest add card badge button avatar separator
npm install react-icons
```

### 0.2 Folder Structure
```
app/
├── (dashboard)/                  # Route group untuk layout dashboard
│   ├── layout.tsx                # Dashboard layout (sidebar + main content)
│   ├── dashboard/
│   │   └── page.tsx              # /dashboard — Overview page
│   │   
│   ├── dashboard/qualification/
│   │   └── page.tsx              # (sprint berikutnya)
│   │
│   ├── dashboard/all-applicants/
│   │   └── page.tsx              # (sprint berikutnya)
│   │
│   └── dashboard/settings/
│       └── page.tsx              # (sprint berikutnya)
│
├── apply/
│   └── page.tsx                  # (sprint berikutnya)
│
components/
├── layout/
│   ├── AppSidebar.tsx            # Main sidebar component
│   └── DashboardHeader.tsx       # Top header per halaman
├── dashboard/
│   ├── MetricCard.tsx            # Reusable stat card
│   └── StatusBadge.tsx           # Reusable status badge
└── ui/                           # shadcn components (auto-generated)
```

### 0.3 Color & Theme Tokens
Minimalis, light-only. Tidak ada dark mode di sprint ini.
- **Primary accent:** Blue (`#2563eb`)
- **Active nav:** Green (`#16a34a`) background + white text
- **Sidebar bg:** White (`#ffffff`), border-right `#e5e7eb`
- **Page bg:** Gray-100 (`#f3f4f6`)
- **Card bg:** White, border `#e5e7eb`, border-radius `0.75rem`
- Status colors: lihat tabel di bawah

---

## 1. Main Sidebar — `AppSidebar.tsx`

### 1.1 Struktur Sidebar
```
┌─────────────────────┐
│  [icon] X Indonesia │  ← Logo + app name (dari react-icons)
├─────────────────────┤
│  [icon] Dashboard   │  ← active: bg hijau, teks putih
│  [icon] Qualifications│
│  [icon] All Applicants│
│  [icon] Settings    │
└─────────────────────┘
```

### 1.2 Icon Mapping (react-icons/ri)
| Nav Item | Icon |
|---|---|
| Logo | `RiSparklingLine` atau `RiApps2Line` |
| Dashboard | `RiDashboardLine` |
| Qualifications | `RiAwardLine` |
| All Applicants | `RiGroupLine` |
| Settings | `RiSettings3Line` |

### 1.3 Komponen Detail
| Bagian | Detail |
|---|---|
| Logo area | Icon kecil + nama app, padding y-5, border-bottom |
| Nav items | Icon (20px) + label, full-width, rounded-md |
| Active state | `bg-green-600 text-white`, non-active: `text-gray-600 hover:bg-gray-100` |
| Width | Fixed 240px, tidak collapsible (sesuai screenshot) |

### 1.4 Behavior
- Link menggunakan `next/link` dengan `usePathname()` untuk active state
- Sidebar fixed full-height di kiri
- **Tidak ada collapse** di sprint ini — sesuai screenshot

---

## 2. Dashboard Header — `DashboardHeader.tsx`

Komponen header yang dipakai di setiap halaman dashboard:
```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                          [Admin] │
└─────────────────────────────────────────────────────────────┘
```
| Bagian | Detail |
|---|---|
| Left | Judul halaman (props `title`) — font-semibold, text-lg |
| Right | Badge/pill "Admin" — bg biru, teks putih, rounded-md |
| Bg | Putih, border-bottom `#e5e7eb`, padding x-6 y-4 |

---

## 3. Dashboard Overview Page — `/dashboard`

### 3.1 Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                          [Admin] │
├─────────────────────────────────────────────────────────────┤
│  [padding/margin top]                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │Total Applicants│ │ Apply Today │ │ Need Review  │        │
│  │    124       │ │     13       │ │     8        │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Auto Approved│ │ Auto Rejected│ │   Failed     │        │
│  │     45       │ │     63       │ │     2        │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 MetricCard Component Props
```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  href?: string; // optional — wrap dengan Link jika ada
}
```

### 3.3 Mock Data (Static)
```typescript
const metrics = [
  { title: "Total Applicants", value: 124 },
  { title: "Apply Today",      value: 13 },
  { title: "Need Review",      value: 8,  href: "/dashboard/all-applicants?status=manual_review" },
  { title: "Auto Approved",    value: 45 },
  { title: "Auto Rejected",    value: 63 },
  { title: "Failed",           value: 2,  href: "/dashboard/all-applicants?status=failed" },
];
```

### 3.4 Visual Style MetricCard
- Background: putih, border `1px solid #e5e7eb`, border-radius `0.75rem`
- Padding: `p-6`
- Title: `text-sm text-gray-500 font-medium` di atas
- Value: `text-4xl font-bold text-gray-900` di bawah
- **Tidak ada icon, tidak ada deskripsi** — sesuai screenshot
- Hover: subtle `shadow-sm` saja, tidak ada animasi berlebihan

---

## 4. File Checklist Sprint

| File | Status |
|---|---|
| `app/(dashboard)/layout.tsx` | ⬜ Buat baru |
| `components/layout/AppSidebar.tsx` | ⬜ Buat baru |
| `components/layout/DashboardHeader.tsx` | ⬜ Buat baru |
| `components/dashboard/MetricCard.tsx` | ⬜ Buat baru |
| `app/(dashboard)/dashboard/page.tsx` | ⬜ Buat baru |
| `app/(dashboard)/dashboard/qualification/page.tsx` | ⬜ Placeholder |
| `app/(dashboard)/dashboard/all-applicants/page.tsx` | ⬜ Placeholder |
| `app/(dashboard)/dashboard/settings/page.tsx` | ⬜ Placeholder |
| `app/globals.css` | ⬜ Update (minimal, light only) |

---

## 5. Status Badge Reference

| Status | Color | Label |
|---|---|---|
| `auto_approved` | Green | Auto Approved |
| `manual_review` | Amber | Needs Review |
| `auto_rejected` | Red | Auto Rejected |
| `approved` | Green | Approved |
| `rejected` | Red | Rejected |
| `pending` | Gray | Processing |
| `failed` | Red (outlined) | Failed |

`StatusBadge` component dibuat sekali, akan digunakan ulang di halaman All Applicants nanti.

---

## 6. Notes

- **Tidak pakai shadcn Sidebar** — sidebar dibuat manual sesuai screenshot (lebih kontrol, lebih simple)
- Icons menggunakan **react-icons** (`ri` prefix — Remix Icons) untuk konsistensi
- Semua angka di MetricCard adalah **hardcoded mock** — nanti diganti Supabase query
- Halaman qualifier, all-applicants, settings dibuat sebagai **placeholder** kosong agar link sidebar bisa diklik
- **Light mode only** di sprint ini, tidak ada dark mode toggle
