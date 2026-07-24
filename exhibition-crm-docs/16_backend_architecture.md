# 16. Backend Architecture

## Folder Structure (backend portion — see Section 27 for full repo layout)
```
/app/api/
  leads/
    recording/start/route.ts
    recording/stop/route.ts
    card-scan/route.ts
    [id]/route.ts
    [id]/confirm-fields/route.ts
    [id]/approve-followup/route.ts
  webhooks/
    email-status/route.ts
/lib/
  agents/          # LangGraph node implementations
  services/        # Zoho, Sheets, Whisper, Email clients
  repositories/    # DB access layer (leads, followups, sync log)
  scheduler/       # drip sequence job logic
```

## Modules
- **Capture module**: recording + card-scan endpoints, kicks off the agent pipeline
- **Lead module**: read/list/detail endpoints, dashboard support
- **Sync module**: Zoho/Sheets write logic + fallback handling
- **Scheduler module**: computes and persists followup send times, triggered by a cron/queue worker

## Services
Each external integration (Whisper, Claude, Zoho, Sheets, Email, WhatsApp) is wrapped in a dedicated service class with a narrow interface (e.g., `ZohoService.createLead(fields)`), isolating API-specific quirks from the rest of the codebase.

## Repositories
Thin data-access layer over Supabase — `LeadsRepository`, `FollowupsRepository`, `CrmSyncLogRepository` — keeps SQL/query logic out of route handlers and agent code.

## Controllers
Next.js API route handlers act as controllers: parse/validate request, call the relevant service/agent, return the standardized response envelope (Section 9).

## Dependency Injection
Given the project's scale (single deployment, no complex test-double requirements beyond mocking external APIs in tests), a full DI framework is unnecessary overhead — services are instantiated via simple factory functions and passed explicitly, which keeps the codebase easy for a solo/AI-assisted developer to reason about.

## Event Bus
Not required at MVP scale — the LangGraph state machine already provides the sequencing/coordination role an event bus would otherwise fill. Revisit only if independent services need to react to lead-lifecycle events without direct coupling (Phase 3).

## Queue Workers
A single worker process (or Vercel Cron + a lightweight table-based job queue, given deployment on Vercel) polls `followups` for due sends and triggers the Sequence Personalization + send flow. At MVP volume (hundreds of scheduled jobs total), a dedicated queue infrastructure (SQS, BullMQ + Redis) is not justified — a `scheduled_for` timestamp column with a polling cron job is sufficient and simpler to operate.
