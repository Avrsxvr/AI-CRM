# 21. Logging & Observability

*MVP-appropriate scope: enough visibility to catch and fix problems at a single-client, event-driven scale, without over-building enterprise observability infrastructure prematurely.*

## Logs
Structured logs (JSON) at each agent boundary: input reference (not full PII payload in logs — reference IDs only), status, duration, error detail if failed. Shipped to Vercel's built-in logging + optionally forwarded to a lightweight log aggregator if volume grows.

## Metrics
- Capture rate (leads created / conversations attempted, if trackable)
- Time-to-record (capture start → CRM synced)
- Agent success/failure rate per node (surfaces which step is the weakest link)
- Sequence completion rate
- API cost per lead (track actual Claude/Whisper spend against the estimate in Section 24)

## Tracing
Full distributed tracing (OpenTelemetry, etc.) is not justified at MVP scale/complexity — the pipeline is a single LangGraph run per lead, not a sprawling microservice call graph. A simple per-lead "processing log" (timestamped stage transitions, stored alongside the lead record) gives equivalent debuggability for far less infrastructure.

## Dashboards
A minimal internal dashboard (could be as simple as a Supabase view or a small admin page) showing: leads captured today, `needs_attention` count, upcoming scheduled sends — sufficient for a solo developer/small team to monitor exhibition-day health in real time.

## Alerts
- Admin notification (email) when a lead enters `needs_attention`
- Admin notification if CRM sync falls back to Sheets more than N times in a day (signals a Zoho connectivity problem worth investigating, not just individual failures)

## Incident Response
Given the scale, "incident response" is proportionate to: check the admin dashboard, check Vercel/Supabase status pages, check the relevant provider's (Zoho/Claude/Whisper) status page, resolve, re-run the affected lead's pipeline manually if needed. A formal on-call rotation/runbook is disproportionate for this build.

## Health Checks
A simple `/api/health` endpoint verifying DB connectivity and, optionally, that critical external API keys are configured — enough for uptime monitoring (e.g., a free-tier UptimeRobot check) without building a full health-check framework.
