# Sprint Plan — Qualifications UI (`/dashboard/qualification`)

> **Scope:** UI-only, no Supabase. Data menggunakan static/mock.
> **Stack:** Next.js 15 · Tailwind CSS · react-icons
> **Desain:** Minimalis, konsisten dengan dashboard

---

## 1. Overview

Halaman ini memungkinkan admin mengkonfigurasi posisi pekerjaan dan kriteria scoring-nya. Terdiri dari:
- Daftar position cards (list)
- Tombol Add Position
- Modal Add/Edit Position dengan form lengkap

---

## 2. Layout Halaman

```
┌─────────────────────────────────────────────────────────────┐
│  Qualifications                                 [Admin]     │
├─────────────────────────────────────────────────────────────┤
│                                          [+ Add Position]   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Web Developer                        [● Active]    │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Must Have:                                         │   │
│  │  · Min. D3/S1 Informatics · 1 year experience       │   │
│  │                                                     │   │
│  │  Nice to Have:  React, Laravel                      │   │
│  │                                                     │   │
│  │  Score Thresholds:  Reject < 50  |  MR: 51–85  |  Approve > 86 │
│  │  Weights:  Skill 30%  Exp 35%  Project 20%  Edu 15% │   │
│  │                              [Edit]  [Deactivate]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Accountant                           [● Active]    │   │
│  │  ...                                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Komponen

### 3.1 `PositionCard.tsx`
Menampilkan satu posisi pekerjaan dalam sebuah card.

| Elemen | Detail |
|---|---|
| Header | Judul posisi (font-semibold) + badge status (Active/Inactive) |
| Body | Must Have, Nice to Have (text kecil abu) |
| Thresholds | 3 nilai: Auto Reject, Manual Review range, Auto Approve |
| Weights | 4 baris: Skill, Experience, Project, Education + persen |
| Footer | Tombol `[Edit]` + `[Deactivate / Activate]` |

**Mock data:**
```typescript
const mockPositions = [
  {
    id: "1",
    title: "Web Developer",
    is_active: true,
    must_have: "Min. D3/S1 Informatika, 1 tahun pengalaman",
    nice_to_have: "React, Laravel",
    auto_reject_below: 50,
    manual_review_min: 51,
    manual_review_max: 85,
    auto_approve_above: 86,
    weight_skill: 30,
    weight_experience: 35,
    weight_project: 20,
    weight_education: 15,
    focus_points: "Portfolio projects, real-world experience",
    red_flags: "No practical experience, plagiarized portfolio",
  },
  {
    id: "2",
    title: "Accountant",
    is_active: true,
    must_have: "Min. S1 Akuntansi, berpengalaman dengan laporan keuangan",
    nice_to_have: "MYOB, SAP",
    auto_reject_below: 50,
    manual_review_min: 51,
    manual_review_max: 85,
    auto_approve_above: 86,
    weight_skill: 25,
    weight_experience: 40,
    weight_project: 15,
    weight_education: 20,
    focus_points: "Financial reporting accuracy",
    red_flags: "Gaps in employment, no relevant certifications",
  },
];
```

### 3.2 `PositionModal.tsx`
Modal Add/Edit posisi. State dikelola di parent page.

**Fields dalam form:**
| Field | Type | Default |
|---|---|---|
| Position Title | text input | "" |
| Status | toggle switch | Active |
| Must Have | textarea | "" |
| Nice to Have | textarea | "" |
| Auto Reject Below | number input | 50 |
| Manual Review Min | number input | 51 |
| Manual Review Max | number input | 85 |
| Auto Approve Above | number input | 86 |
| Weight Skill (%) | number input | 30 |
| Weight Experience (%) | number input | 35 |
| Weight Project (%) | number input | 20 |
| Weight Education (%) | number input | 15 |
| Focus Points | textarea | "" |
| Red Flags | textarea | "" |

**Validasi (UI-only, tidak submit ke server):**
- Weights harus total 100% — tampilkan warning inline jika tidak
- Thresholds harus sequential: reject < MR min < MR max < approve
- Tombol Save disabled jika validasi gagal

**Layout modal:**
```
┌────────────────────────────────────────┐
│  Add Position                     [✕]  │
├────────────────────────────────────────┤
│  Position Title  [________________]    │
│  Status          [● Active ○ Inactive] │
│                                        │
│  Must Have       [________________]    │
│                  [________________]    │
│  Nice to Have    [________________]    │
│                                        │
│  Score Thresholds                      │
│  Auto Reject < [50]                    │
│  Manual Review  [51] – [85]            │
│  Auto Approve > [86]                   │
│                                        │
│  Scoring Weights (must total 100%)     │
│  Skill [30]%  Exp [35]%               │
│  Project [20]%  Edu [15]%  = 100% ✓   │
│                                        │
│  Focus Points    [________________]    │
│  Red Flags       [________________]    │
│                                        │
│              [Cancel]  [Save Position] │
└────────────────────────────────────────┘
```

---

## 4. State Management (Client-side only)

```typescript
// Di page.tsx
const [positions, setPositions] = useState(mockPositions);
const [modalOpen, setModalOpen] = useState(false);
const [editTarget, setEditTarget] = useState<Position | null>(null);

// Add: editTarget = null, buka modal
// Edit: editTarget = position yang dipilih, buka modal
// Save: update positions state, tutup modal
// Deactivate/Activate: toggle is_active di state
```

---

## 5. File Checklist

| File | Status |
|---|---|
| `app/(dashboard)/dashboard/qualification/page.tsx` | ⬜ Update dari placeholder |
| `components/qualification/PositionCard.tsx` | ⬜ Buat baru |
| `components/qualification/PositionModal.tsx` | ⬜ Buat baru |

---

## 6. Notes

- Semua interaksi (add, edit, deactivate) hanya mengubah **local state** — tidak ada API call
- Deactivate dengan pending applicants → tampilkan window confirm biasa (alert)
- Badge status: Active = green dot, Inactive = gray dot
