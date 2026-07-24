# 31. Executive Implementation Guide

## Recommended Build Order
1. Infra/auth setup (Phase 0)
2. Card scan → CRM sync slice (fastest to de-risk, most external dependency — Zoho — surfaces here first)
3. Audio → transcript → context → follow-up draft (independent, more interesting engineering)
4. Scheduler + drip sequence (ties both together)
5. Real-device testing throughout, not just at the end
6. WhatsApp channel only after email-based MVP is validated with the client

## Critical Path
Zoho API access is the single item most likely to block the timeline if not resolved in week one — everything in the Card Scan → CRM Sync slice depends on it (or the deliberate decision to ship Sheets-first). Confirm this before writing any CRM integration code.

## Common Mistakes (to avoid)
- Building the audio/context pipeline before validating the CRM integration — the CRM integration has the most external-dependency risk and should be de-risked first, not last
- Skipping real-device testing until the end — exhibition-hall conditions (network, noise, lighting for card photos) are meaningfully different from a developer's desk and should be tested from Phase 1
- Auto-sending the very first follow-up email without rep review — the mandatory human-approval checkpoint (Section 6, Agent 3) exists specifically to catch tone/hallucination problems before they reach a real prospect
- Over-building infrastructure (queues, tracing, multi-region deployment) ahead of actual need — this entire document set repeatedly notes "not required at this scale," and that discipline should carry into the actual build, not just the planning

## Best Practices
- Keep every agent stateless and narrowly scoped (Section 6) — makes debugging and future swaps (e.g., different CRM) tractable
- Validate all LLM JSON output against a schema before it touches the database (Section 12)
- Never let an LLM invent facts not present in the source transcript/card — this is the single most important guardrail in the whole system
- Treat the Sheets fallback as a first-class path, not a rushed afterthought, since it's what protects the timeline against Zoho access delays

## Architecture Decisions (summary)
| Decision | Choice | Why |
|---|---|---|
| App vs. website | Web app (PWA) | Zero-install adoption at the booth |
| CRM | Zoho primary, Sheets fallback | De-risks timeline against CRM-access delays |
| Orchestration | LangGraph, fixed graph (no dynamic planner) | Workflow is well-defined and linear at MVP scope |
| Models | Sonnet for reasoning tasks, Haiku for cheap high-volume tasks | Cost-appropriate to each task's complexity |
| Hosting | Vercel + Supabase | Free tiers cover MVP; minimal DevOps for a solo build |

## Deployment Checklist
- [ ] Zoho OAuth credentials configured (or Sheets fallback confirmed as the launch path)
- [ ] All API keys set as encrypted environment variables, none in source
- [ ] RLS policies verified against a cross-organization access test
- [ ] Real-device test pass completed (Android + iPhone, throttled network)
- [ ] Consent script confirmed with client and shown correctly in the UI
- [ ] Email sending domain verified/authenticated with the chosen provider
- [ ] `needs_attention` alerting confirmed working (trigger a deliberate failure and verify the admin notification arrives)
- [ ] Client walkthrough completed before the actual exhibition date

## Production Readiness Checklist
- [ ] Backups confirmed active (Supabase automated backups)
- [ ] Health check endpoint live and monitored
- [ ] Error tracking (Sentry or equivalent) receiving events
- [ ] Data retention policy for audio (90-day default) implemented, not just documented
- [ ] Fallback path (Sheets) tested under a simulated Zoho outage, not just in theory
