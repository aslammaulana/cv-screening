# Sprint Plan — Settings UI (`/dashboard/settings`)

> **Scope:** UI-only, no Supabase. Data menggunakan static/mock.
> **Stack:** Next.js 15 · Tailwind CSS · react-icons
> **Desain:** Minimalis, form bersih dengan change history di bawah

---

## 1. Overview

Halaman konfigurasi AI prompt. Admin bisa mengedit 3 prompt (Persona, Extraction, Scoring) dan melihat riwayat perubahan.

---

## 2. Layout Halaman

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                         [Admin]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AI Configuration                                            │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Persona Prompt                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ You are a senior HR professional with 10 years of     │  │
│  │ experience across various industries...               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Extraction Prompt                                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Extract the following structured information from     │  │
│  │ the CV below. Return ONLY valid JSON...               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Scoring Prompt                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ You are evaluating a candidate for the position of    │  │
│  │ {position}. Using the criteria provided, score...     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                    [Save]   │
│                                                              │
│  Change History                                              │
│  ─────────────────────────────────────────────────────────  │
│  Jun 11, 2026 09:40  Persona prompt updated                 │
│  Jun 08, 2026 14:32  Scoring prompt updated                 │
│  Jun 05, 2026 10:15  Extraction prompt updated              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Komponen

### 3.1 Mock Data (awal form)

```typescript
const defaultPrompts = {
  persona: `You are a senior HR professional with 10 years of experience across various industries. Your role is to evaluate CVs objectively based on the criteria provided. Be fair, consistent, and thorough in your assessment.`,
  extraction: `Extract the following structured information from the CV below. Return ONLY valid JSON with no additional text or markdown:
{
  "name": "",
  "email": "",
  "education": [],
  "experience": [],
  "skills": [],
  "projects": []
}`,
  scoring: `You are evaluating a candidate for the position of {position}. Using the criteria and CV data provided, score the candidate on each dimension from 0 to 100. Return ONLY valid JSON:
{
  "score_skill": 0,
  "score_experience": 0,
  "score_project": 0,
  "score_education": 0,
  "ai_reason_accept": "",
  "ai_reason_reject": ""
}`,
};

const mockHistory = [
  { id: "1", prompt_type: "persona",    changed_at: "2026-06-11T02:40:00Z" },
  { id: "2", prompt_type: "scoring",    changed_at: "2026-06-08T07:32:00Z" },
  { id: "3", prompt_type: "extraction", changed_at: "2026-06-05T03:15:00Z" },
];
```

### 3.2 `PromptEditor.tsx`

Komponen reusable untuk satu prompt:

```typescript
interface PromptEditorProps {
  label: string;        // "Persona Prompt"
  value: string;
  onChange: (val: string) => void;
  rows?: number;        // default: 6
}
```

Elemen:
- Label `text-sm font-medium text-gray-700` di atas
- `<textarea>` dengan border, rounded, full-width, resize-y
- Tidak ada karakter counter di sprint ini

### 3.3 Save Button Behavior

```typescript
// State di page.tsx
const [prompts, setPrompts] = useState(defaultPrompts);
const [history, setHistory] = useState(mockHistory);
const [saved, setSaved]     = useState(false);

// Saat Save diklik:
// 1. Bandingkan prompts dengan previous state untuk tahu prompt mana yang berubah
// 2. Append entry baru ke history untuk setiap prompt yang berubah
// 3. Tampilkan feedback "Saved!" sementara (2 detik) lalu kembali normal
```

**Save button states:**
- Default: `[Save Changes]` — bg-blue-600 text-white
- Saved: `[✓ Saved!]` — bg-green-600 text-white, setelah 2 detik kembali ke default

### 3.4 Change History Section

Tabel/list sederhana:
| Kolom | Detail |
|---|---|
| Timestamp | Format: "Jun 11, 2026 09:40" |
| Description | "{Persona / Extraction / Scoring} prompt updated" |

Ditampilkan sebagai list dengan separator, bukan tabel formal. Yang paling baru di atas.

---

## 4. File Checklist

| File | Status |
|---|---|
| `app/(dashboard)/dashboard/settings/page.tsx` | ⬜ Update dari placeholder |
| `components/settings/PromptEditor.tsx` | ⬜ Buat baru |

---

## 5. Notes

- Tidak ada preview/test prompt di sprint ini (out of scope v1)
- History hanya bertambah di local state — tidak persistent saat refresh
- Setiap textarea `resize-y` agar admin bisa expand jika prompt panjang
- Section divider antara "AI Configuration" dan "Change History" menggunakan `<hr>` dengan margin y
