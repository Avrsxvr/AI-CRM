# 19. Error Handling

| Scenario | Cause | Detection | Recovery | Retry | Escalation | User Message | Logging |
|---|---|---|---|---|---|---|---|
| Audio upload fails | Poor exhibition wifi | Upload promise rejects | Local queue, retry on reconnect | 3x backoff | None (auto-recovers) | "Saving... will retry automatically" | Log attempt count |
| Transcription fails | Corrupt/silent audio, provider outage | Job returns error/empty | Fallback: persist raw audio only | 3x backoff | Flag `needs_attention`, notify admin | "We couldn't process this recording — you can add notes manually" | Log full error + audio ref |
| Card OCR low confidence | Blurry/handwritten card | Confidence score below threshold | Route to manual entry form | None (retry on same image is pointless) | None (expected path) | "Please confirm these details" (fields pre-filled where possible) | Log confidence scores |
| Zoho API failure | Token expired, outage, rate limit | API error response | Fallback to Sheets write | 3x backoff before fallback | Admin notified if fallback also used | (Rep sees no error — fallback is silent to them) | Log full API error, flag for re-sync |
| Both Zoho and Sheets fail | Both providers down (rare) | Both write attempts error | Persist lead locally, mark `needs_attention` | Already exhausted both paths' retries | Immediate admin alert | "Lead saved locally, will sync shortly" | Log both failures |
| Follow-up draft generation fails | LLM error, malformed output | Schema validation fails | Retry once with stricter prompt; fallback to a minimal template | 1x | None (template fallback is acceptable) | Rep still gets an editable draft, just less personalized | Log raw output that failed validation |
| Email send fails | Invalid address, provider outage | Provider error/bounce webhook | Skip, continue sequence at next scheduled touch | 1x after 1hr | Admin notified if bounce | N/A (async, no rep-facing message) | Log bounce reason |
| Duplicate lead submission | Rep double-taps save | Idempotency key match | Return existing lead, no duplicate created | N/A | None | No error shown — behaves as normal success | Log idempotency hit |
| Session expired mid-capture | Long gap between login and save | Auth check fails on save | Prompt re-login, preserve in-progress capture state client-side if possible | N/A | None | "Please log in again to save this lead" | Log session expiry event |
