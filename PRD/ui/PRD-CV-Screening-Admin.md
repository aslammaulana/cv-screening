# PRD — CV Screening Admin Panel
**Project:** AI-Powered CV Screening System  
**Stack:** Next.js · Supabase · Google Drive · Google Sheets · Gemini API · Resend  
**Last updated:** June 2026

---

## 1. Overview

A single-admin web dashboard to manage automated CV screening. The system receives applicant submissions, extracts CV data via Gemini, scores candidates per position criteria, and routes email responses automatically. The admin panel provides visibility into all applicants, position configuration, and AI prompt management.

---

## 2. User Roles

| Role | Access |
|---|---|
| Admin (single user) | Full access to all pages and settings |
| Public (applicant) | Only the public submission form `/apply` |

Authentication via Supabase Auth. Single admin account, no role management needed.

---

## 3. Pages & Routes

| Route | Page Name |
|---|---|
| `/apply` | Public applicant form |
| `/dashboard` | Dashboard overview |
| `/dashboard/qualification` | Position & qualification management |
| `/dashboard/all-applicants` | All applicants table |
| `/dashboard/settings` | AI prompt configuration |

---

## 4. Public Form — `/apply`

### Purpose
Entry point for all applicants. Simple, minimal form.

### Fields
| Field | Type | Validation |
|---|---|---|
| Full Name | Text input | Required |
| Email | Email input | Required, valid format |
| Gender | Select | Male / Female |
| Position | Select | Pulled from active positions in `job_positions` table |
| CV | File upload | Required, PDF only, max 5MB |

### Behavior
- Position dropdown only shows positions where `is_active = true`
- On submit: validate → upload CV to Google Drive → insert to Supabase with `status: pending` → show success message
- Success message: *"Your CV has been received. We'll send the result to your email."*
- Error states: duplicate email+position, invalid file type, file too large — each show specific inline error messages
- Note displayed near upload field: *"Please upload your CV in standard single-column PDF format for best results."*

---

## 5. Dashboard — `/dashboard`

### Purpose
At-a-glance overview of system activity.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Dashboard"                         [Admin] [Logout]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────┐ │
│  │  Total Applicants│ │  Apply Today     │ │ Need Review │ │
│  │       124        │ │       12         │ │      8      │ │
│  └──────────────────┘ └──────────────────┘ └─────────────┘ │
│                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────┐ │
│  │  Auto Approved   │ │  Auto Rejected   │ │   Failed    │ │
│  │       45         │ │       63         │ │      2      │ │
│  └──────────────────┘ └──────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Metric Cards
- **Total Applicants** — all time count from `applicants` table
- **Apply Today** — count where `created_at` = today
- **Need Review** — count where `status = manual_review`
- **Auto Approved** — count where `status = auto_approved`
- **Auto Rejected** — count where `status = auto_rejected`
- **Failed** — count where `status = failed`, with link to filter all-applicants by failed

---

## 6. Qualification — `/dashboard/qualification`

### Purpose
Admin configures open positions and their scoring criteria. Changes here directly affect the applicant form (which positions appear) and AI scoring behavior.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  "Qualification Setup"                   [+ Add Position]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Web Developer                          [Active ●]  │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Must Have:                                         │   │
│  │  · Min. D3/S1 Informatics                           │   │
│  │  · 1 year experience                                │   │
│  │                                                     │   │
│  │  Nice to Have:                                      │   │
│  │  · React, Laravel                                   │   │
│  │                                                     │   │
│  │  Score Threshold:                                   │   │
│  │  Auto Reject below  [ 50 ]                          │   │
│  │  Manual Review      [ 51 ] – [ 85 ]                 │   │
│  │  Auto Approve above [ 86 ]                          │   │
│  │                                                     │   │
│  │  Scoring Weight:                                    │   │
│  │  Technical Skill   [ 30 ]%                          │   │
│  │  Experience        [ 35 ]%                          │   │
│  │  Project Quality   [ 20 ]%                          │   │
│  │  Education         [ 15 ]%                          │   │
│  │                              [Edit]  [Deactivate]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Accountant                             [Active ●]  │   │
│  │  ...                                                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Add / Edit Position Modal
Fields:
| Field | Type | Notes |
|---|---|---|
| Position Title | Text | e.g. "Web Developer" |
| Status | Toggle | Active / Inactive |
| Must Have | Textarea | Freetext, shown on position card |
| Nice to Have | Textarea | Freetext, shown on position card |
| Auto Reject Below | Number input | Default: 50 |
| Manual Review Range | Two number inputs | Default: 51–85 |
| Auto Approve Above | Number input | Default: 86 |
| Weight: Skill | Number input (%) | Must total 100% with others |
| Weight: Experience | Number input (%) | |
| Weight: Project | Number input (%) | |
| Weight: Education | Number input (%) | |
| Focus Points | Textarea | What AI should look for |
| Red Flags | Textarea | What AI should watch out for |

### Validation
- Weights must sum to exactly 100%
- Thresholds must be sequential: auto_reject < manual_review_min < manual_review_max < auto_approve
- Deactivating a position with pending applicants shows a warning

---

## 7. All Applicants — `/dashboard/all-applicants`

### Purpose
Master view of every applicant. Admin can review AI reasoning and take action on manual_review cases.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  "All Applicants"                                                 │
├──────────────────────────────────────────────────────────────────┤
│  [All Positions ▾]  [All Status ▾]  [Date ▾]  [🔍 Search...]    │
├──────────────────────────────────────────────────────────────────┤
│ Name   │ Email │Gender│Position │Score│ CV │Status│AI Reason│Action│
├──────────────────────────────────────────────────────────────────┤
│ John D │...    │  M   │Web Dev  │ 92  │[↗] │ ✅   │ [View]  │  —   │
│ Jane S │...    │  F   │Accnt    │ 73  │[↗] │ 🔶   │ [View]  │[✓][✗]│
│ Bob K  │...    │  M   │Web Dev  │ 31  │[↗] │ ❌   │ [View]  │  —   │
└──────────────────────────────────────────────────────────────────┘
```

### Columns
| Column | Description |
|---|---|
| Name | Full name |
| Email | Applicant email |
| Gender | Male / Female |
| Position | Applied position |
| Score | Total score (0–100), shown as a number |
| CV | Icon link that opens the file in Google Drive |
| Status | Badge: Auto Approved / Manual Review / Auto Rejected / Failed |
| AI Reason | "View" button that expands a popover showing `ai_reason_accept` and `ai_reason_reject` from Gemini |
| Action | Shown only for `manual_review` rows: [Approve] [Reject] buttons. Empty for all other statuses. |

### Status Badges
| Status | Badge Color | Label |
|---|---|---|
| `auto_approved` | Green | Auto Approved |
| `manual_review` | Amber | Needs Review |
| `auto_rejected` | Red | Auto Rejected |
| `approved` | Green | Approved |
| `rejected` | Red | Rejected |
| `pending` | Gray | Processing |
| `failed` | Red (outlined) | Failed |

### Filters
- **Position:** dropdown, all active + inactive positions
- **Status:** dropdown, all status values
- **Date:** date range picker (from–to)
- **Search:** free text, searches name and email

### AI Reason Popover
Clicking "View" in the AI Reason column opens an inline popover with:
```
┌─────────────────────────────────┐
│ AI Reasoning                    │
│ ─────────────────────────────── │
│ ✅ Why accepted:                │
│ Candidate has 3 years of real   │
│ experience at a product company,│
│ strong React background...      │
│                                 │
│ ❌ Why rejected:                │
│ No formal education in the      │
│ required field...               │
│                                 │
│ Score breakdown:                │
│ Skill       ████████░░  82      │
│ Experience  █████████░  91      │
│ Project     ██████░░░░  63      │
│ Education   ████████░░  80      │
└─────────────────────────────────┘
```

### Action Behavior
- **Approve** → set `status: approved`, trigger email send via Resend, set `email_sent: true`
- **Reject** → set `status: rejected`, trigger email send via Resend, set `email_sent: true`
- After action: row status badge updates immediately, action buttons disappear

---

## 8. Settings — `/dashboard/settings`

### Purpose
Admin edits the AI prompts that control extraction and scoring behavior. No code deployment required for prompt changes.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  "AI Configuration"                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Persona Prompt                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ You are a senior HR professional with 10 years of     │  │
│  │ experience across various industries. Your role is    │  │
│  │ to evaluate CVs objectively based on the criteria     │  │
│  │ provided...                                           │  │
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
│  │ {position}. Using the criteria and CV data provided,  │  │
│  │ score the candidate on each dimension...              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│                                          [Save Changes]      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Change History                                              │
│  ─────────────────────────────────────────────────────────  │
│  Jun 10, 2026 14:32  — Persona prompt updated               │
│  Jun 08, 2026 09:15  — Scoring prompt updated               │
└─────────────────────────────────────────────────────────────┘
```

### Behavior
- All three textareas pull current values from `ai_config` table on page load
- "Save Changes" updates all three in a single transaction and appends a row to change history
- Change history shows: timestamp, which prompt was changed, saved by (admin)
- No preview/test feature in v1 — keep scope minimal

---

## 9. Email Templates (Automated)

### Auto Approved (score > 86)
```
Subject: Congratulations — You passed the CV screening for [Position]

Hi [Name],

Your CV for the [Position] position has passed our initial screening.

Please use the link below to book your interview schedule:
[Booking Link]

We look forward to speaking with you.
```

### Auto Rejected (score < 50)
```
Subject: Update on your application for [Position]

Hi [Name],

Thank you for applying for the [Position] position.

After reviewing your CV, we're unable to move forward at this time.

Feedback from our review:
[ai_reason_reject]

We encourage you to apply again in the future.
```

### Manual Approved (admin clicks Approve)
Same template as Auto Approved.

### Manual Rejected (admin clicks Reject)
Same template as Auto Rejected.

---

## 10. Database Schema (Supabase)

### `job_positions`
```
id                  uuid PK
title               text
is_active           boolean default true
must_have           text
nice_to_have        text
auto_reject_below   integer default 50
manual_review_min   integer default 51
manual_review_max   integer default 85
auto_approve_above  integer default 86
weight_skill        integer default 30
weight_experience   integer default 35
weight_project      integer default 20
weight_education    integer default 15
focus_points        text
red_flags           text
created_at          timestamptz
updated_at          timestamptz
```

### `applicants`
```
id                  uuid PK
job_position_id     uuid FK → job_positions.id
nama                text
email               text
gender              text
cv_url              text (Google Drive link)
cv_json             jsonb (extracted CV data)
score_total         integer
score_skill         integer
score_experience    integer
score_project       integer
score_education     integer
ai_reason_accept    text
ai_reason_reject    text
status              text (enum — see below)
email_sent          boolean default false
email_sent_at       timestamptz
created_at          timestamptz
updated_at          timestamptz
```

**Status enum values:**
`pending` · `extracted` · `scoring` · `auto_rejected` · `manual_review` · `auto_approved` · `rejected` · `approved` · `failed`

### `ai_config`
```
id                  uuid PK
persona_prompt      text
extraction_prompt   text
scoring_prompt      text
updated_at          timestamptz
```

### `ai_config_history`
```
id                  uuid PK
prompt_type         text (persona / extraction / scoring)
previous_value      text
new_value           text
changed_at          timestamptz
```

---

## 11. Backend Flow Summary

```
[/apply form submit]
  → Validate (format, duplicate, file size, active position)
  → Upload PDF → Google Drive
  → Insert → Supabase (status: pending)
  → Return: "CV received" message

[Supabase trigger on insert]
  → Edge Function A: Extract
      · Download PDF from Drive
      · Gemini reads PDF → structured JSON
      · Save cv_json to Supabase
      · Update status: extracted

  → Edge Function B: Score
      · Read cv_json + job criteria + ai_config prompts
      · Gemini scores per dimension
      · Backend calculates weighted score_total
      · Update Supabase + Google Sheets
      · Route by score:
          < 50   → send reject email → status: auto_rejected
          51–85  → status: manual_review (admin notified via dashboard)
          > 86   → send approve email → status: auto_approved
```

---

## 12. Out of Scope (v1)

- Multi-admin or role-based access
- Email template editor in admin panel
- Applicant re-apply after cooldown period
- CV format validation beyond file type and size
- Bulk approve/reject actions
- Export to CSV
- Mobile-optimized admin panel (desktop only in v1)

---

## 13. Open Questions

| # | Question | Impact |
|---|---|---|
| 1 | What is the booking link for the approved email? (Calendly, Google Appointments, etc.) | Email template |
| 2 | Should failed jobs auto-retry, or require manual retry from admin? | Edge function + status logic |
| 3 | Which Google Sheet columns should be included for HR visibility? | Sheets integration |
| 4 | Is there a cooldown period before the same email can re-apply to the same position? | Duplicate validation logic |
