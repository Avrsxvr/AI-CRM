# 9. API Specification (Internal Application API)

*Assumption: internal API is a Next.js route handler / REST-style API consumed by the frontend, backed by Supabase.*

## Authentication
Supabase Auth session (JWT), passed as a bearer token on every request. Rep and admin roles enforced via row-level security policies in Supabase, keyed on `organization_id`.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/leads/recording/start` | Register a new in-progress recording session |
| POST | `/api/leads/recording/stop` | Upload final audio, trigger transcription job |
| POST | `/api/leads/card-scan` | Upload card image, trigger OCR job |
| GET | `/api/leads/:id` | Fetch current lead state (for polling extraction progress) |
| POST | `/api/leads/:id/confirm-fields` | Rep-confirmed contact fields |
| POST | `/api/leads/:id/approve-followup` | Rep-approved follow-up draft, triggers CRM sync + scheduling |
| GET | `/api/leads` | List leads for the dashboard (admin/rep) |
| POST | `/api/webhooks/email-status` | Inbound delivery/bounce webhook from email provider |

## Request Format
JSON bodies; file uploads (audio/image) via multipart or pre-signed upload URL to object storage, with the API receiving only the resulting storage reference.

## Response Format
```json
{ "data": { ... }, "error": null }
```
Errors:
```json
{ "data": null, "error": { "code": "STRING_CODE", "message": "human-readable" } }
```

## Error Codes
| Code | Meaning |
|---|---|
| `AUTH_REQUIRED` | Missing/invalid session |
| `RECORDING_IN_PROGRESS` | Duplicate start-recording attempt |
| `TRANSCRIPTION_FAILED` | Retries exhausted, lead flagged `needs_attention` |
| `CRM_SYNC_FAILED` | Zoho + Sheets fallback both failed |
| `VALIDATION_ERROR` | Malformed request body |

## Retry Policy
Client-side: idempotent POSTs (e.g., recording upload) retried up to 3x with exponential backoff on network failure, using an idempotency key to avoid duplicate lead creation.

## Pagination
`GET /api/leads` uses cursor-based pagination (`?cursor=&limit=`), appropriate given append-only, chronological lead data.

## Webhooks
Inbound: email provider delivery/bounce events → `/api/webhooks/email-status`, signature-verified against the provider's webhook secret.
Outbound (Phase 2): none planned for MVP.

## Rate Limits
Internal API is rate-limited per organization (e.g., 60 req/min) primarily as abuse protection — MVP usage volume never approaches this.

## Caching Strategy
Lead list/dashboard reads cached client-side with short TTL (30s) and invalidated on mutation; no server-side response caching needed at MVP scale.
