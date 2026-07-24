# 17. Infrastructure

## Hosting
Vercel (frontend + API routes) + Supabase (Postgres, Auth, Storage) — both have generous free tiers that cover MVP/prototype usage entirely (see Cost Estimation).

## Docker
Not required for MVP given a Vercel/Supabase managed-services deployment — no self-hosted containers to orchestrate. Revisit if Phase 3 requires a self-hosted worker process for heavier queue/scheduling needs.

## CI/CD
Vercel's native Git integration (auto-deploy on push to `main`, preview deployments per PR) is sufficient — no need for a separate CI/CD pipeline tool at this scale.

## Reverse Proxy
Handled by Vercel's platform — no manual reverse proxy configuration needed.

## Autoscaling
Vercel's serverless functions autoscale by default; Supabase's connection pooling (via its built-in pooler) handles MVP-scale concurrent load without manual tuning.

## Load Balancer
Handled by the platform (Vercel) — not a manual concern at this scale.

## Secrets Management
Vercel environment variables (encrypted at rest) for all API keys (Claude, Whisper, Zoho, Sheets service account, email provider). No secrets committed to the repository; `.env.example` documents required keys without values.

## Monitoring / Logging / Tracing
See Section 21 (Observability) for detail. MVP-appropriate: Vercel's built-in function logs + a lightweight error-tracking tool (e.g., Sentry free tier) is sufficient; full distributed tracing infrastructure is not justified at this scale.

## Backups
Supabase's automatic daily backups (included on most tiers) cover MVP needs; verify retention window against the client's data-retention expectations (see Security §PII Protection).

## Disaster Recovery
At MVP scale, recovery plan is: restore from Supabase's automated backup, redeploy from Git (stateless app code, no server state to rebuild). No formal DR runbook/failover region needed for a single-client tool at this scale — flag as a Phase 3 consideration if the product becomes multi-tenant and mission-critical for many clients simultaneously.
