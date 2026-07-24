# 18. Security Architecture

## Authentication
Supabase Auth (email/password or magic link). Session tokens (JWT) short-lived with refresh; no custom auth implementation (avoid reinventing auth for an MVP).

## Authorization
Role-based (`rep`, `admin`), enforced via Supabase Row-Level Security policies scoped to `organization_id` — even in a single-client MVP, this prevents any accidental cross-tenant data leakage if the product later onboards a second client.

## Encryption
- In transit: HTTPS everywhere (enforced by Vercel/Supabase by default)
- At rest: Supabase encrypts data at rest by default; object storage (audio/card images) similarly encrypted at rest by the platform

## API Security
- All external API keys server-side only, never exposed to the client bundle
- Internal API routes validate the Supabase session on every request
- Webhook endpoints (email delivery status) verify provider signatures

## Secrets
See Infrastructure §Secrets Management.

## Rate Limiting
Basic per-organization rate limiting on internal API routes as abuse protection (Section 9); not a primary concern at MVP traffic levels but cheap to add via Vercel's or a lightweight middleware-based limiter.

## Audit Logs
`crm_sync_log` table (Section 10) doubles as a partial audit trail for CRM writes. For MVP, this level of audit logging is proportionate — full immutable audit logging across every table is not justified at this scale/risk level.

## PII Protection
- Data collected: names, emails, phone numbers, company names, conversation transcripts/audio — all personal data requiring careful handling
- Access restricted to the client's own rep/admin accounts via RLS
- Raw audio retention capped at 90 days by default (Section 10), configurable per client preference
- No PII sent to any third party beyond the explicitly integrated services (Claude, Whisper, Zoho, Sheets, email/WhatsApp providers) — no analytics/ad-tech vendors in the data path

## GDPR
Out of scope for MVP under the stated assumption (non-EU client/audience — see Business Requirements §Compliance). If EU leads become likely, revisit: right-to-erasure flow, data processing agreements with each sub-processor (Anthropic, Zoho, etc.), and a documented lawful basis for processing.

## SOC2 Considerations
Not pursued for MVP (disproportionate for a single-client freelance build). Relevant only if the product is productized into a multi-tenant SaaS serving enterprise clients who require it (Phase 3) — flagged here so it isn't forgotten if that path is pursued.

## Threat Model
| Threat | Mitigation |
|---|---|
| Stolen/leaked Zoho API credentials | Server-side only storage, scoped OAuth permissions, rotation capability |
| Rep's phone lost/stolen mid-event | Session timeout, no locally cached PII beyond the active in-progress capture |
| Malicious card image (prompt injection via image content) | Vision LLM output is schema-validated before any downstream use; extracted fields never executed as instructions |
| Data leakage across organizations (if multi-tenant later) | RLS policies enforced from day one, not retrofitted |
