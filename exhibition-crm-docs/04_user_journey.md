# 4. Complete User Journey

## User Onboarding
1. Client admin receives a link + login for the web app (PWA — no install required)
2. Rep opens the link on their phone at the booth, logs in once, grants mic + camera permission when prompted
3. 5-minute walkthrough (in-app tooltip tour, not a training session) covers: start/stop recording, scan card, confirm & save

## Authentication
*Assumption: MVP uses simple email/password or magic-link auth (Supabase Auth), scoped per client organization. No SSO required for a single-client MVP.*
- Rep logs in once per exhibition day; session persists across the event
- Back-office manager gets a separate role with dashboard-only access (no recording capability needed)

## Setup
- Admin configures: Zoho API credentials (or confirms Sheets fallback), drip sequence templates, consent script text
- No per-lead setup — the flow is designed to require zero configuration during live use

## Integrations
- Zoho CRM (OAuth, API credential setup by admin, one-time)
- Google Sheets (service account, fallback path)
- Email sending provider (Resend/SendGrid, one-time API key setup)
- (Phase 2) WhatsApp BSP account

## Daily Workflow (Exhibition Day)
1. Rep opens app, confirms mic/camera access
2. For each booth conversation: start recording → converse → stop recording → scan card → confirm extracted fields → confirm/edit AI follow-up draft → save
3. Repeat for next conversation (target: ready for next lead within seconds of saving the last)
4. End of day: rep can review a simple list of today's captured leads

## Edge Cases
- Card fails OCR (blurry photo, handwritten card) → rep manually types the 4 core fields (name, company, email, phone)
- Recording fails/audio corrupted → card + manual note still saved; lead isn't lost, just missing conversation context
- No wifi at moment of save → capture queues locally and retries when connectivity returns
- Rep accidentally starts a second recording before stopping the first → app blocks it, shows "recording in progress"

## Offboarding
- Post-event: admin reviews the full lead list, can bulk-edit/pause sequences for any lead
- No formal "offboarding" flow needed for reps — access simply isn't renewed for the next event if the client doesn't continue
