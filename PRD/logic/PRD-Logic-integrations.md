# PRD Logic — CV Screening System
**Project:** AI-Powered CV Screening System  
**Stack:** Next.js · Supabase · Google Drive API · Google Sheets API · Gemini API · Resend  
**Depends on:** PRD-CV-Screening-Admin.md (UI & Database Schema)  
**Last updated:** June 2026

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  NEXT.JS (Vercel Free Tier)                                      │
│  - /apply form (public)                                          │
│  - /dashboard pages (admin)                                      │
│  - API Routes (lightweight, < 10s)                               │
│    · POST /api/apply        → validate + upload + insert         │
│    · POST /api/approve      → manual approve action              │
│    · POST /api/reject       → manual reject action               │
│    · GET  /api/positions    → fetch active positions             │
│    · CRUD /api/qualification → manage job positions              │
│    · CRUD /api/settings     → manage ai_config prompts           │
│    · GET  /api/dashboard    → fetch metric counts                │
│    · GET  /api/applicants   → fetch applicants with filters      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE                                                        │
│  - PostgreSQL database (all tables)                              │
│  - Supabase Auth (admin login)                                   │
│  - Database Trigger → fires on INSERT to applicants             │
│  - Edge Function A: cv-extract                                   │
│  - Edge Function B: cv-score                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
    Google Drive  Gemini API  Resend
    (CV storage)  (AI calls)  (Email)
                     │
                     ▼
               Google Sheets
               (HR report view)
```

---

## 2. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only, never expose to client

# Google APIs (Service Account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_DRIVE_FOLDER_ID=           # folder ID where CVs are uploaded
GOOGLE_SHEET_ID=                  # spreadsheet ID for HR report

# Gemini
GEMINI_API_KEY_1=
GEMINI_API_KEY_2=
GEMINI_API_KEY_3=
GEMINI_API_KEY_4=
GEMINI_API_KEY_5=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=                # e.g. noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=              # e.g. https://yourapp.vercel.app
INTERVIEW_BOOKING_URL=            # Calendly or Google Appointment link
```

---

## 3. Authentication — Supabase Auth

### Admin Login
- Single admin account created manually in Supabase Auth dashboard
- Use Supabase `@supabase/ssr` package for Next.js App Router
- Session managed via cookies (not localStorage)

### Route Protection
All `/dashboard/*` routes are protected via Next.js middleware:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // If accessing /dashboard, check session
  // If no session → redirect to /login
  // If session exists → allow through
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

### Login Page — `/login`
- Email + password form
- On success → redirect to `/dashboard`
- On fail → show inline error: "Invalid email or password"
- No signup page (admin account pre-created)

---

## 4. API Route — POST `/api/apply`

**Called by:** Public form `/apply` on submit  
**Runs on:** Vercel (must complete < 10 seconds)

### Step-by-step Logic

```
1. Parse multipart form data (name, email, gender, position_id, cv file)

2. VALIDATE
   a. All fields present?
   b. Email format valid? (regex)
   c. File is PDF? (check MIME type: application/pdf)
   d. File size ≤ 5MB? (check buffer.length)
   e. Position exists and is_active = true? (query job_positions)
   f. Duplicate? (query applicants WHERE email = ? AND job_position_id = ?)
   → Any fail: return 400 with specific error message

3. UPLOAD CV TO GOOGLE DRIVE
   - Authenticate using Service Account credentials
   - Upload file to folder: GOOGLE_DRIVE_FOLDER_ID
   - Filename format: {sanitized_name}_{position_title}_{timestamp}.pdf
   - Get back: fileId, webViewLink
   → On fail: return 500 "Failed to upload CV, please try again"

4. INSERT TO SUPABASE
   INSERT INTO applicants (
     job_position_id, nama, email, gender,
     cv_url, status, created_at
   ) VALUES (
     position_id, name, email, gender,
     webViewLink, 'pending', NOW()
   )
   → On fail: return 500

5. RETURN 200
   { message: "CV received successfully" }
```

### Duplicate Check Logic
```typescript
const existing = await supabase
  .from('applicants')
  .select('id')
  .eq('email', email)
  .eq('job_position_id', positionId)
  .single()

if (existing.data) {
  return { error: "You have already applied for this position." }
}
```

### Google Drive Upload
```typescript
import { google } from 'googleapis'

const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/drive']
)

const drive = google.drive({ version: 'v3', auth })

const response = await drive.files.create({
  requestBody: {
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
  },
  media: {
    mimeType: 'application/pdf',
    body: fileStream,
  },
  fields: 'id, webViewLink',
})
```

---

## 5. Supabase Database Trigger

After INSERT into `applicants`, a PostgreSQL trigger fires immediately and invokes Edge Function A.

### SQL Trigger Definition
```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_cv_extract()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/cv-extract',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <service-role-key>"}'::jsonb,
    body := json_build_object('applicant_id', NEW.id)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to applicants table
CREATE TRIGGER on_applicant_insert
  AFTER INSERT ON applicants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cv_extract();
```

> Requires `pg_net` extension enabled in Supabase.

---

## 6. Edge Function A — `cv-extract`

**Trigger:** Database trigger on applicant INSERT  
**Timeout:** 150 seconds (Supabase Edge Function limit)  
**Purpose:** Download PDF from Google Drive → Gemini extracts to structured JSON → save to Supabase

### Logic

```
1. Receive { applicant_id } from trigger

2. Fetch applicant row from Supabase
   - Get cv_url, job_position_id

3. UPDATE applicants SET status = 'extracted' (optimistic, marks as in-progress)

4. Download PDF from Google Drive
   - Use Service Account auth
   - Get file as binary buffer

5. Fetch extraction_prompt from ai_config table

6. Call Gemini API
   - Model: gemini-1.5-flash
   - Input: PDF binary (base64) + extraction_prompt
   - Instruction: "Return ONLY valid JSON, no markdown, no preamble"

7. Parse Gemini response → validate JSON structure

8. UPDATE applicants SET
     cv_json = parsed_json,
     status = 'extracted'

9. Invoke Edge Function B (cv-score) by HTTP call
   - Pass applicant_id
```

### Gemini Extraction Call
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: 'application/pdf',
              data: pdfBase64
            }
          },
          {
            text: extractionPrompt
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,   // low temp for consistent extraction
        maxOutputTokens: 2048
      }
    })
  }
)
```

### Expected cv_json Structure
```json
{
  "personal": {
    "nama": "John Doe",
    "email": "john@email.com",
    "domisili": "Jakarta",
    "phone": "08xx"
  },
  "pendidikan": [
    {
      "institusi": "Universitas X",
      "jurusan": "Teknik Informatika",
      "jenjang": "S1",
      "tahun_lulus": 2020
    }
  ],
  "pengalaman": [
    {
      "perusahaan": "PT Tokopedia",
      "posisi": "Frontend Developer",
      "periode_mulai": "2021-01",
      "periode_selesai": "2023-06",
      "is_real_company": true,
      "deskripsi": "Developed React components..."
    }
  ],
  "project": [
    {
      "nama": "E-commerce Platform",
      "deskripsi": "...",
      "type": "real | freelance | personal | playground",
      "tech_stack": ["React", "Node.js"]
    }
  ],
  "skill": ["React", "TypeScript", "Laravel"],
  "sertifikasi": ["AWS Cloud Practitioner"]
}
```

### Error Handling
```
- Gemini API fail → retry once with different API key (round-robin)
- JSON parse fail → retry once with stricter prompt
- All retries fail → UPDATE applicants SET status = 'failed'
- Log error detail to a separate errors table or console
```

---

## 7. Gemini API Key Rotation

Since there are 5 API keys, use round-robin rotation per request. Store current index in memory (Edge Function scope) or use a simple modulo on applicant ID.

```typescript
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
]

function getApiKey(applicantId: string): string {
  // Use last char of UUID as numeric seed for distribution
  const seed = parseInt(applicantId.replace(/-/g, '').slice(-4), 16)
  return API_KEYS[seed % API_KEYS.length]
}
```

If a key returns a 429 (rate limit), automatically retry with the next key in the array.

---

## 8. Edge Function B — `cv-score`

**Trigger:** Called by Edge Function A on completion  
**Timeout:** 150 seconds  
**Purpose:** Score the extracted cv_json against position criteria → calculate weighted total → route by score

### Logic

```
1. Receive { applicant_id }

2. Fetch from Supabase:
   - applicants row (cv_json, job_position_id)
   - job_positions row (all criteria + weights + thresholds)
   - ai_config row (persona_prompt + scoring_prompt)

3. UPDATE applicants SET status = 'scoring'

4. Build scoring prompt:
   - Combine persona_prompt + scoring_prompt
   - Inject: position title, must_have, nice_to_have,
             focus_points, red_flags, cv_json

5. Call Gemini API
   - Input: combined prompt + cv_json
   - Instruction: return ONLY JSON with exact structure below
   - Temperature: 0.1

6. Parse Gemini response:
   {
     score_skill: 85,
     score_experience: 90,
     score_project: 70,
     score_education: 80,
     ai_reason_accept: "...",
     ai_reason_reject: "..."
   }

7. CALCULATE score_total (backend, not AI)
   score_total = Math.round(
     (score_skill      * weight_skill      / 100) +
     (score_experience * weight_experience / 100) +
     (score_project    * weight_project    / 100) +
     (score_education  * weight_education  / 100)
   )

8. UPDATE applicants SET
     score_skill, score_experience,
     score_project, score_education,
     score_total, ai_reason_accept,
     ai_reason_reject

9. WRITE TO GOOGLE SHEETS (async, non-blocking)
   - Append row to HR report sheet

10. ROUTE BY score_total:
    - score_total < auto_reject_below  → send_reject_email() → status: auto_rejected
    - score_total between thresholds   → status: manual_review
    - score_total > auto_approve_above → send_approve_email() → status: auto_approved
```

### Score Calculation Example
```typescript
const scoreTotal = Math.round(
  (scoreSkill      * position.weight_skill      / 100) +
  (scoreExperience * position.weight_experience / 100) +
  (scoreProject    * position.weight_project    / 100) +
  (scoreEducation  * position.weight_education  / 100)
)
```

---

## 9. Google Sheets Integration

**Called by:** Edge Function B after scoring  
**Purpose:** Append applicant record to HR report sheet for non-admin visibility

### Columns Written (in order)
```
A: Timestamp (created_at)
B: Nama
C: Email
D: Gender
E: Posisi
F: Score Total
G: Score Skill
H: Score Experience
I: Score Project
J: Score Education
K: Status
L: AI Reason Accept
M: AI Reason Reject
N: CV Link (Google Drive webViewLink)
```

### Implementation
```typescript
const sheets = google.sheets({ version: 'v4', auth })

await sheets.spreadsheets.values.append({
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  range: 'Applicants!A:N',
  valueInputOption: 'USER_ENTERED',
  requestBody: {
    values: [[
      new Date().toISOString(),
      applicant.nama,
      applicant.email,
      applicant.gender,
      position.title,
      scoreTotal,
      scoreSkill,
      scoreExperience,
      scoreProject,
      scoreEducation,
      status,
      aiReasonAccept,
      aiReasonReject,
      applicant.cv_url
    ]]
  }
})
```

> Sheets write failure should NOT block the main scoring flow. Wrap in try/catch, log error, continue.

---

## 10. Email Logic — Resend

### Auto Reject (score_total < auto_reject_below)
```typescript
await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: applicant.email,
  subject: `Update on your application for ${position.title}`,
  html: `
    <p>Hi ${applicant.nama},</p>
    <p>Thank you for applying for the <strong>${position.title}</strong> position.</p>
    <p>After reviewing your CV, we're unable to move forward at this time.</p>
    <p><strong>Feedback:</strong><br/>${applicant.ai_reason_reject}</p>
    <p>We encourage you to apply again in the future.</p>
  `
})
```

### Auto Approve (score_total > auto_approve_above)
```typescript
await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: applicant.email,
  subject: `Congratulations — You passed the CV screening for ${position.title}`,
  html: `
    <p>Hi ${applicant.nama},</p>
    <p>Your CV for the <strong>${position.title}</strong> position has passed our initial screening.</p>
    <p>Please use the link below to book your interview schedule:</p>
    <p><a href="${process.env.INTERVIEW_BOOKING_URL}">Book Interview Schedule</a></p>
    <p>We look forward to speaking with you.</p>
  `
})
```

### Manual Approve/Reject — API Route POST `/api/approve` & `/api/reject`
Called when admin clicks Approve or Reject button in the dashboard.

```
1. Verify admin session (Supabase Auth)
2. Fetch applicant row by id
3. Confirm status is still 'manual_review' (prevent double-send)
4. Send corresponding email via Resend
5. UPDATE applicants SET
     status = 'approved' | 'rejected',
     email_sent = true,
     email_sent_at = NOW()
6. UPDATE Google Sheets row: update Status column
7. Return 200
```

> Step 3 is critical — always check status before sending to prevent sending duplicate emails if admin clicks twice.

---

## 11. API Route — `/api/positions` (GET)

**Called by:** `/apply` form on page load to populate position dropdown

```typescript
const { data } = await supabase
  .from('job_positions')
  .select('id, title')
  .eq('is_active', true)
  .order('title', { ascending: true })

return data // [{ id, title }, ...]
```

---

## 12. API Routes — `/api/qualification` (CRUD)

All routes require admin session.

### GET — fetch all positions
```typescript
SELECT * FROM job_positions ORDER BY created_at DESC
```

### POST — create new position
```typescript
INSERT INTO job_positions (...all fields...) VALUES (...)
```
Validation before insert:
- weight_skill + weight_experience + weight_project + weight_education = 100
- auto_reject_below < manual_review_min < manual_review_max < auto_approve_above

### PATCH — update position
```typescript
UPDATE job_positions SET ...fields WHERE id = ?
```
Same validations as POST.

### PATCH — toggle active/inactive
```typescript
UPDATE job_positions SET is_active = ? WHERE id = ?
```
If deactivating: check if any applicants have `status = 'pending'` or `status = 'manual_review'` for this position. If yes, return warning but still allow deactivation.

---

## 13. API Routes — `/api/settings` (CRUD)

All routes require admin session.

### GET — fetch current prompts
```typescript
SELECT * FROM ai_config LIMIT 1
```

### PATCH — update prompts
```typescript
// 1. Fetch current values first (for history)
const current = await supabase.from('ai_config').select('*').single()

// 2. For each changed prompt, insert history row
if (body.persona_prompt !== current.persona_prompt) {
  await supabase.from('ai_config_history').insert({
    prompt_type: 'persona',
    previous_value: current.persona_prompt,
    new_value: body.persona_prompt,
    changed_at: new Date()
  })
}
// repeat for extraction_prompt and scoring_prompt

// 3. Update ai_config
await supabase.from('ai_config').update({
  persona_prompt: body.persona_prompt,
  extraction_prompt: body.extraction_prompt,
  scoring_prompt: body.scoring_prompt,
  updated_at: new Date()
}).eq('id', current.id)
```

---

## 14. API Routes — `/api/dashboard` (GET)

Returns all metric counts in a single query for efficiency.

```typescript
// Single RPC call or parallel queries
const [total, today, needReview, autoApproved, autoRejected, failed] = 
  await Promise.all([
    supabase.from('applicants').select('id', { count: 'exact', head: true }),
    supabase.from('applicants').select('id', { count: 'exact', head: true })
      .gte('created_at', startOfToday),
    supabase.from('applicants').select('id', { count: 'exact', head: true })
      .eq('status', 'manual_review'),
    supabase.from('applicants').select('id', { count: 'exact', head: true })
      .in('status', ['auto_approved', 'approved']),
    supabase.from('applicants').select('id', { count: 'exact', head: true })
      .in('status', ['auto_rejected', 'rejected']),
    supabase.from('applicants').select('id', { count: 'exact', head: true })
      .eq('status', 'failed'),
  ])
```

---

## 15. API Routes — `/api/applicants` (GET)

Returns paginated, filtered applicant list for the all-applicants table.

### Query Parameters
```
?position=uuid       filter by job_position_id
?status=string       filter by status
?from=date           filter created_at >= date
?to=date             filter created_at <= date
?search=string       search nama OR email (ilike)
?page=number         pagination (default: 1)
?limit=number        rows per page (default: 20)
```

### Query
```typescript
let query = supabase
  .from('applicants')
  .select(`
    id, nama, email, gender, cv_url,
    score_total, status, email_sent,
    ai_reason_accept, ai_reason_reject,
    created_at,
    job_positions (title)
  `)

if (position) query = query.eq('job_position_id', position)
if (status)   query = query.eq('status', status)
if (from)     query = query.gte('created_at', from)
if (to)       query = query.lte('created_at', to)
if (search)   query = query.or(`nama.ilike.%${search}%,email.ilike.%${search}%`)

query = query
  .order('created_at', { ascending: false })
  .range((page - 1) * limit, page * limit - 1)
```

---

## 16. Error Handling Strategy

### Status: `failed`
Any unrecoverable error in Edge Function A or B sets `status = 'failed'`.

Failed applicants are visible in the dashboard (Failed card) and filterable in all-applicants table. Admin can see them but there is no auto-retry in v1.

### Retry on Gemini Rate Limit (429)
```typescript
async function callGeminiWithRetry(prompt, pdfData, attempt = 0) {
  const key = getApiKey(applicantId, attempt)
  const response = await callGemini(prompt, pdfData, key)
  
  if (response.status === 429 && attempt < 4) {
    return callGeminiWithRetry(prompt, pdfData, attempt + 1)
  }
  
  if (!response.ok) throw new Error(`Gemini failed: ${response.status}`)
  return response
}
```

### Idempotency
Before processing, always check current status:
```typescript
if (applicant.status !== 'pending') {
  // Already processed or being processed, skip
  return
}
```
This prevents duplicate processing if the trigger fires twice.

---

## 17. Supabase Row Level Security (RLS)

```sql
-- applicants table: no public read/write
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- Only service role (Edge Functions) can read/write
-- Admin reads via server-side API routes using service_role key
-- Public /api/apply uses service_role key server-side only

-- job_positions: public can read active positions only
CREATE POLICY "Public read active positions"
  ON job_positions FOR SELECT
  USING (is_active = true);

-- ai_config: no public access
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
```

---

## 18. Processing Flow — Complete Sequence

```
[User]                [Vercel]              [Supabase]           [External]
  │                      │                      │                     │
  │── submit form ──────►│                      │                     │
  │                      │── validate ──────────►│                     │
  │                      │── upload PDF ────────────────────────────►│ Google Drive
  │                      │◄─ fileId, webViewLink ──────────────────────│
  │                      │── INSERT applicant ──►│                     │
  │◄─ "CV received" ─────│                      │                     │
  │                      │                      │── trigger fires      │
  │                      │                      │── Edge Fn A ────────►│ Gemini (extract)
  │                      │                      │◄─ cv_json ───────────│
  │                      │                      │── save cv_json       │
  │                      │                      │── Edge Fn B ────────►│ Gemini (score)
  │                      │                      │◄─ scores + reasons ──│
  │                      │                      │── calc score_total   │
  │                      │                      │── update status      │
  │                      │                      │── write Sheets ─────►│ Google Sheets
  │                      │                      │── send email ───────►│ Resend
  │◄─────────────────────────────────────────── email arrives ─────────│
```

---

## 19. Out of Scope (v1)

- Webhook retry queue (failed emails)
- Real-time dashboard updates (use manual refresh or polling)
- CV parsing fallback to OCR for scanned PDFs
- Bulk approve/reject
- Export applicants to CSV
- Auto-retry for `failed` status applicants
- Cooldown period for re-application
- Google Sheets row update when status changes (only appends on creation)
```