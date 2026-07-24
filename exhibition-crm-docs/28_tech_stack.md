# 28. Tech Stack Recommendations

| Layer | Recommendation | Rationale |
|---|---|---|
| Frontend | Next.js (React), mobile-first PWA | No app-store install friction (per earlier app-vs-website decision); matches developer's existing stack familiarity |
| Backend | Next.js API Routes | Single deployable unit with the frontend; sufficient for MVP scale, avoids a separate backend service to operate |
| Database | Supabase (Postgres) | Generous free tier, built-in Auth + Storage + RLS, matches developer's existing stack |
| Vector Database | None (not required — see Memory Architecture) | Avoids unjustified infrastructure for a scale that doesn't need semantic search |
| Queue | Table-based polling (Supabase + Vercel Cron) | Sufficient at MVP job volume; avoids operating Redis/SQS for hundreds of total jobs |
| Agent Framework | LangGraph | Matches developer's existing focus/roadmap; explicit state machine fits this pipeline's fixed, well-defined flow |
| Authentication | Supabase Auth | Avoid building custom auth; integrates directly with the chosen database/RLS model |
| Cloud Provider | Vercel (app) + Supabase (data) | Both have free tiers covering MVP entirely; minimal DevOps overhead for a solo developer |
| Monitoring | Vercel built-in logs + Sentry (free tier) | Proportionate to MVP scale; avoids premature observability infrastructure |
| Analytics | None dedicated for MVP — dashboard metrics come directly from the `leads`/`followups` tables | A dedicated analytics platform isn't justified at this data volume |
| CI/CD | Vercel Git integration | No separate CI/CD tool needed |
| LLM Provider | Anthropic Claude (Sonnet + Haiku) | See Section 13 for per-agent model selection rationale |
| Transcription | OpenAI Whisper API | Cheap, reliable, multilingual-capable if needed later |
| CRM | Zoho CRM (primary), Google Sheets (fallback) | Client's chosen CRM; Sheets de-risks the timeline against CRM-access delays |
| Email | Resend or SendGrid (either has a workable free tier) | Final choice can be made at build time based on deliverability testing, not a hard architectural decision |
| WhatsApp (Phase 2) | Gupshup, AiSensy, or 360dialog (BSP) | Any Meta-approved BSP works; final choice driven by India-market rate competitiveness and platform fee, evaluated at Phase 2 kickoff |
