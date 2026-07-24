# 8. Tool Specification

## Tool: Whisper Transcription API
| Aspect | Detail |
|---|---|
| Purpose | Convert meeting audio to text |
| Inputs | Audio file (mp3/m4a/wav), language hint (optional) |
| Outputs | Transcript text, timestamps (optional) |
| Authentication | API key, server-side only |
| Permissions | N/A (single-purpose key) |
| Rate limits | Provider-dependent; MVP volume (dozens/day) is far below any practical ceiling |
| Retries | 3x exponential backoff on transient errors |
| Failure modes | Corrupt audio, unsupported format, silence-only file |
| Fallback strategy | Persist raw audio, flag lead `needs_attention`, allow manual re-submit later |
| Versioning | Pin to a specific model version; test before upgrading |

## Tool: Vision LLM (Card OCR)
| Aspect | Detail |
|---|---|
| Purpose | Extract structured fields from a card photo |
| Inputs | Base64 image |
| Outputs | JSON contact fields + confidence |
| Authentication | API key, server-side |
| Permissions | N/A |
| Rate limits | Provider tier-dependent; MVP volume is trivial |
| Retries | None (see Agent 2 rationale — route to human correction instead) |
| Failure modes | Blurry image, handwriting, non-Latin script |
| Fallback strategy | Human manual entry of 4 core fields |
| Versioning | Pin model version |

## Tool: Zoho CRM API
| Aspect | Detail |
|---|---|
| Purpose | Create/update lead records |
| Inputs | Lead object (contact fields, notes) |
| Outputs | Record ID, status |
| Authentication | OAuth 2.0, refresh token stored server-side |
| Permissions | Scoped to Leads/Contacts modules only (least privilege) |
| Rate limits | <cite index="20-1">5,000 API credits / 24hr on the Free tier</cite> — MVP volume is well within this |
| Retries | 3x exponential backoff |
| Failure modes | Token expiry, API downtime, field-mapping mismatch |
| Fallback strategy | Google Sheets write, flagged for later Zoho re-sync |
| Versioning | Pin to a specific Zoho CRM API version |

## Tool: Google Sheets API (fallback CRM)
| Aspect | Detail |
|---|---|
| Purpose | Fallback lead datastore if Zoho isn't reachable/ready |
| Inputs | Row data matching Zoho schema |
| Outputs | Row confirmation |
| Authentication | Service account JSON key |
| Permissions | Scoped to a single target spreadsheet |
| Rate limits | Google Sheets API default quotas — far above MVP volume |
| Retries | 3x |
| Failure modes | Quota exceeded (unlikely at this scale), sheet schema drift |
| Fallback strategy | Local queue + retry; alert admin if sustained failure |

## Tool: Email Provider API (Resend/SendGrid — TBD)
| Aspect | Detail |
|---|---|
| Purpose | Send follow-up and drip sequence emails |
| Inputs | To, subject, body, send-at time |
| Outputs | Delivery status |
| Authentication | API key |
| Rate limits | Free tier ~100-3,000/month depending on provider — sufficient for MVP volume |
| Retries | 1 retry after 1hr on failure |
| Failure modes | Invalid email, bounce, provider outage |
| Fallback strategy | Log failure, continue sequence at next scheduled touch |

## Tool: WhatsApp Business API via BSP (Phase 2)
| Aspect | Detail |
|---|---|
| Purpose | Send follow-up messages on WhatsApp |
| Inputs | Recipient number, template ID, variables |
| Outputs | Delivery status |
| Authentication | BSP API key + Meta-approved WhatsApp Business Account |
| Permissions | Requires Meta template approval per message category |
| Rate limits | BSP + Meta tiered limits; per-message billing (see Cost Estimation) |
| Retries | 1 retry |
| Failure modes | No opt-in on file, template rejected, quality score degradation |
| Fallback strategy | Skip WhatsApp touch, send via email instead |
