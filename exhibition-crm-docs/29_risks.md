# 29. Risks

## Technical Risks
| Risk | Mitigation |
|---|---|
| Card OCR accuracy on handwritten/non-standard cards | Human confirm step is mandatory (FR8), never auto-trust extraction |
| Transcript quality in noisy exhibition-hall audio | Test with realistic noise samples early (Phase 2 of roadmap); graceful fallback to manual notes |
| Exhibition wifi unreliability | Client-side upload queuing + retry (Section 19) |
| Zoho API access delayed by client | Sheets fallback built in parallel from day one, not as an afterthought |

## Business Risks
| Risk | Mitigation |
|---|---|
| Client's exhibition date arrives before build is complete | Confirm the real date in week one (flagged as an open PRD question); scope MVP tightly to what's achievable in the window |
| Client expectations grow beyond the quoted fixed-fee scope | Scope locked in the PRD/quote; scope-creep items explicitly routed to Phase 2 pricing |
| Rep adoption resistance (new tool, live at a booth) | Keep the flow to under 90 seconds active effort; minimal training required by design |

## AI Risks
| Risk | Mitigation |
|---|---|
| Hallucinated context or contact details | All extraction prompts explicitly forbid inferring ungrounded facts (Section 12); schema validation rejects malformed output |
| Follow-up email reads as generic/"AI-sounding" | Mandatory human review of the first touch; prompt explicitly instructs natural, non-corporate tone |
| LLM/transcription provider outage during a live exhibition | Graceful degradation path (persist raw data, flag for later reprocessing) rather than blocking the rep |

## Operational Risks
| Risk | Mitigation |
|---|---|
| Solo developer bandwidth (no backup if unavailable during exhibition) | Keep the system simple enough to debug quickly under pressure; avoid premature complexity (reflected throughout this doc set's "not required at this scale" calls) |
| No formal on-call/incident process | Proportionate given single-client scale (Section 21); revisit only if productized |

## Legal Risks
| Risk | Mitigation |
|---|---|
| Recording consent not properly disclosed to buyers | Mandatory consent-reminder step in the UI regardless of jurisdiction (Section 3); client to confirm/approve exact script |
| WhatsApp messages sent without valid opt-in (Phase 2) | Opt-in check is a hard gate before any WhatsApp send (Workflow 2); falls back to email if absent |
| PII handling without a clear retention policy | 90-day default audio retention, documented and client-configurable (Section 10, Section 18) |
