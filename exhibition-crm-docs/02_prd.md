# 2. Product Requirements Document (PRD)

## Problem Statement
At exhibitions, valuable buyer-seller conversations and the contact details exchanged are captured inconsistently (memory, paper notes, physical cards) and decay fast. Manual CRM entry is slow, error-prone, and often skipped. Follow-up is late, generic, or forgotten entirely, so leads generated at real cost go cold.

## Objectives
- Capture 100% of booth conversations that the rep chooses to record, with structured output (transcript + summary)
- Digitize business cards into structured CRM records with < 2 minutes of rep effort per lead
- Automate the first follow-up and a multi-month nurture sequence without ongoing manual triggering

## Goals
- Reliable, fast (<90s active rep time) capture flow usable on a phone at a noisy booth
- CRM record created with conversation-grounded context attached
- Drip sequence runs unattended for 3-4 months per lead

## Non-Goals (MVP)
- Fully autonomous sending with no human review (Phase 1 requires rep approval of the first follow-up)
- Multi-language transcription/OCR
- CRM systems other than Zoho
- Native mobile app / offline-first mode
- Engagement-based re-targeting from email/WhatsApp open-tracking (Phase 2)

## Target Audience
B2B service companies (sellers) who exhibit at trade shows and rely on booth conversations to generate qualified leads.

## User Personas
| Persona | Goals | Frustrations |
|---|---|---|
| Booth Rep (Priya, Sales Exec) | Capture leads fast, keep talking to the next prospect | Card piles up, no time to type notes, forgets context by end of day |
| Back-Office Manager (Rohit, Sales Ops) | Leads in CRM promptly, consistent follow-up | Reps under-report leads; follow-up depends on individual diligence |

## Pain Points
- Physical cards get lost or entered days later, if at all
- Conversation context is never recorded — only "we talked to them" survives
- Follow-up quality depends entirely on how good the rep's memory/notes were

## User Stories
- As a booth rep, I want to tap one button to start/stop recording so I don't interrupt the conversation flow.
- As a booth rep, I want to photograph a card and have the details extracted so I don't type anything.
- As a booth rep, I want to see and edit the AI's suggested follow-up before it's queued, so I stay in control of what's sent.
- As a sales ops manager, I want every captured lead to automatically receive a multi-month follow-up sequence so nothing depends on someone remembering.

## Functional Requirements
See PRD FR1–FR15 table in the original scoping document (Section 6 of the initial PRD) — carried forward unchanged:
| ID | Requirement | Priority |
|---|---|---|
| FR1 | Web app requests mic + camera permission, works in mobile browser | P0 |
| FR2 | Audio recording start/stop with visual indicator | P0 |
| FR3 | Audio → transcript via speech-to-text | P0 |
| FR4 | LLM extraction of problem/context/action items | P0 |
| FR5 | LLM-drafted, rep-editable follow-up email | P0 |
| FR6 | Card image capture (camera or upload) | P0 |
| FR7 | LLM/OCR extraction of name, company, title, email, phone | P0 |
| FR8 | Manual correction step for extracted card fields | P0 |
| FR9 | Push confirmed lead + notes into Zoho CRM | P0 |
| FR10 | Fallback write to Google Sheet if Zoho isn't ready | P1 |
| FR11 | Auto-schedule 1-hour first follow-up | P0 |
| FR12 | Auto-schedule 3-4 month drip sequence (6-10 touches) | P0 |
| FR13 | Sequence content pulls in lead-specific context | P1 |
| FR14 | Basic dashboard of captured leads + status | P1 |
| FR15 | (Phase 2) Email/WhatsApp open-tracking → targeting | P2 |
| FR16 | (Phase 2) WhatsApp channel with explicit opt-in capture | P2 |

## Non-Functional Requirements
- Graceful degradation: if transcription fails, still persist raw audio + card for later reprocessing
- Card scan + extraction returns in a few seconds
- Consent: buyer must be informed of recording (see Business Requirements §Compliance)
- Works on flaky exhibition wifi via client-side upload queuing/retry

## Acceptance Criteria
- A rep can go from "start recording" to "lead saved in Zoho with context note" in under 2 minutes, tested on a mid-range Android and iPhone, on throttled 3G-equivalent network
- Card OCR fields are ≥ 90% accurate on printed (non-handwritten) cards before the human-confirm step
- 1-hour follow-up fires within a 10-minute tolerance window; drip sequence fires on schedule ± 1 day

## KPIs
Capture rate, time-to-record, sequence completion rate, reply rate (see Executive Summary).

## MVP Scope
Modules A (audio→context→follow-up draft), B (card scan), C (Zoho/Sheets sync), D (drip scheduling, email only).

## Future Scope
WhatsApp channel, engagement-based targeting, multi-CRM support, multi-tenant SaaS, offline mode.

## Constraints
- Solo developer, AI-assisted (Antigravity/Claude Code) build
- Target build window: ~10-14 working days for MVP
- Must work before a specific exhibition date (client-supplied, TBD)

## Dependencies
- Client's Zoho CRM account + API credentials
- Client's decision on card-scan consent script for reps
- BSP account for WhatsApp (Phase 2 only)

## Risks
See Section 29 (Risks) for full register.
