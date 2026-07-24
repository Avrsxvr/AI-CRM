# 26. Development Sprint Plan

*Given the ~10-14 day total timeline, this is organized as two ~1-week sprints rather than longer Scrum-style sprints — appropriate for a solo, AI-assisted build.*

## Sprint 1 (Days 1-7): Foundation + Capture
**Sprint Goal**: A rep can scan a card and record audio, and both flows produce structured, confirmed data end-to-end (even if CRM sync and drip scheduling aren't wired up yet).

| Task | Story Points | Definition of Done |
|---|---|---|
| Repo/infra setup (Vercel, Supabase, env vars) | 2 | Deploys successfully, health check passes |
| Auth (Supabase Auth, roles) | 3 | Rep/admin can log in, RLS enforced |
| Card capture UI + Card OCR Agent | 5 | Photo → extracted fields shown, confirm/edit works |
| Zoho OAuth + CRM Sync Agent (+ Sheets fallback) | 5 | Confirmed lead lands in Zoho or Sheets |
| Audio recording UI | 3 | Start/stop works reliably on real phone |
| Whisper integration | 3 | Transcript produced from real recording |

**Sprint Deliverable**: demoable card-scan-to-CRM slice, plus working recording capture (transcript visible, even if not yet feeding into follow-up drafting).

## Sprint 2 (Days 8-14): Intelligence + Automation + Polish
**Sprint Goal**: Full pipeline works end-to-end including AI-drafted follow-up and the drip sequence, tested on real devices, ready for client demo.

| Task | Story Points | Definition of Done |
|---|---|---|
| Context Extraction Agent | 3 | Structured context produced from transcript |
| Follow-up Draft Agent + rep review UI | 5 | Editable draft shown, approval triggers sync |
| Scheduler Agent + polling worker | 5 | 1hr followup + drip sequence jobs created and fire on schedule |
| Sequence Personalization Agent | 3 | Later touches reference lead context, not raw template |
| Admin dashboard (`/leads`) | 3 | Lists leads, shows status, surfaces `needs_attention` |
| Real-device testing pass | 3 | Verified on Android + iPhone under throttled network |
| Client walkthrough/demo | 2 | Client has used the app themselves once |

**Sprint Deliverable**: full MVP as scoped in the PRD (Section 2), ready for the client's actual exhibition use.
