# 25. Development Roadmap

## Phase 0: Setup (Day 1-2)
- **Goals**: environment ready, Zoho access confirmed or Sheets fallback decided
- **Deliverables**: repo scaffold, Supabase project, Vercel project, Zoho OAuth app registered (or Sheets service account ready)
- **Dependencies**: client provides Zoho access or confirms Sheets-first approach
- **Risks**: Zoho access delay — mitigated by building Sheets fallback in parallel from day one, not as an afterthought

## Phase 1: Card Scan + CRM Sync Slice (Day 3-5)
- **Goals**: fully working thin slice — camera → OCR → confirm → CRM write
- **Deliverables**: `CardScanner` component, Card OCR Agent, CRM Sync Agent (both targets), demoable checkpoint
- **Dependencies**: Phase 0 complete
- **Risks**: OCR accuracy on real-world card samples — mitigated by testing against a varied sample set (different card styles/fonts) early

## Phase 2: Audio Capture + Context Pipeline (Day 6-8)
- **Goals**: recording → transcription → context extraction → follow-up draft
- **Deliverables**: `RecordButton`, Whisper integration, Context Extraction Agent, Follow-up Draft Agent
- **Dependencies**: none beyond Phase 0 (independent of Phase 1's CRM work by design — see Section 7)
- **Risks**: transcript quality in noisy exhibition-hall audio — mitigate by testing with realistic background-noise samples, not just quiet-room recordings

## Phase 3: Drip Sequence + Scheduling (Day 9-10)
- **Goals**: 1-hour + multi-month sequence scheduling and sending
- **Deliverables**: Scheduler Agent, Sequence Personalization Agent, cron/polling worker, email templates
- **Dependencies**: Phases 1 & 2 (needs both contact info and context to schedule a meaningful sequence)
- **Risks**: sequence content quality without client-provided copy — mitigate by getting draft templates reviewed by the client before build, not after

## Phase 4: Testing, Polish, Handoff (Day 11-14)
- **Goals**: real-device testing, bug fixes, admin dashboard basics, client walkthrough
- **Deliverables**: tested on real Android/iPhone under throttled network, `/leads` dashboard, client demo
- **Dependencies**: Phases 1-3 complete
- **Risks**: device/browser quirks discovered late — mitigate by testing on real devices starting Phase 1, not saved for the end

## Phase 5 (Post-MVP): WhatsApp Channel
- **Goals**: add WhatsApp as a second follow-up channel with proper opt-in
- **Deliverables**: BSP integration, opt-in capture UX, template approval process managed
- **Dependencies**: MVP live and validated; BSP account + Meta template approval (1-2 week lead time)
- **Risks**: Meta template rejection/approval delay — start this process early if committed to Phase 5, given the external approval timeline is outside developer control
