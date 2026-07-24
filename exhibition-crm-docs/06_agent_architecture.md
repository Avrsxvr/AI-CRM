# 6. Agent Architecture

## Agent 1: Context Extraction Agent
- **Purpose**: turn a raw meeting transcript into structured buyer context
- **Responsibilities**: identify buyer's stated problem/need, budget/timeline hints, action items/promises made
- **Input**: transcript text
- **Output**: JSON `{ problem, needs, action_items[], notable_quotes[], sentiment }`
- **Tools**: none (pure LLM reasoning call)
- **Memory**: none needed beyond the single transcript (stateless call)
- **Prompt responsibilities**: strict JSON schema adherence, avoid hallucinating specifics not present in transcript
- **Dependencies**: Transcription Agent output
- **Failure conditions**: malformed JSON, transcript too short/garbled to extract meaningfully
- **Retry logic**: 1 retry with a stricter "return valid JSON only" instruction; on second failure, fall back to raw transcript summary
- **Human approval**: none required (feeds into a human-reviewed follow-up draft downstream)
- **Success criteria**: output validates against schema, no hallucinated fields (all traceable to transcript)
- **Possible improvements**: add confidence scoring per extracted field

## Agent 2: Card OCR Agent
- **Purpose**: extract structured contact fields from a business card photo
- **Input**: image (base64)
- **Output**: `{ name, company, title, email, phone, confidence }`
- **Tools**: vision-capable LLM call
- **Memory**: none (stateless)
- **Prompt responsibilities**: return null (not guessed values) for illegible fields
- **Dependencies**: none
- **Failure conditions**: blurry/handwritten card, non-Latin script (out of MVP scope)
- **Retry logic**: none — low-confidence output routes straight to human correction, no point retrying the same image
- **Human approval**: required — rep always confirms before save (FR8)
- **Success criteria**: ≥90% field accuracy on printed cards pre-correction
- **Possible improvements**: dedicated OCR engine fallback for handwriting

## Agent 3: Follow-up Draft Agent
- **Purpose**: draft a personalized first follow-up email
- **Input**: Context Extraction Agent output + card contact fields
- **Output**: email subject + body (plain text)
- **Tools**: none
- **Memory**: none (stateless per lead)
- **Prompt responsibilities**: ground every claim in the extracted context, avoid generic template language, keep to a natural, non-"AI-sounding" register
- **Dependencies**: Agents 1 & 2 outputs
- **Failure conditions**: empty/near-empty context (sparse transcript) → falls back to a lighter-touch generic-but-honest draft
- **Retry logic**: 1 retry if output fails basic length/format checks
- **Human approval**: **required** — this is the mandatory review checkpoint (see Workflow 1)
- **Success criteria**: rep approves without heavy edits (tracked as a quality signal over time)
- **Possible improvements**: learn from rep edits to tune future drafts (Phase 2 — requires persistent memory, see Section 11)

## Agent 4: CRM Sync Agent
- **Purpose**: write the confirmed lead record to Zoho (or Sheets fallback)
- **Input**: confirmed contact fields + context summary + follow-up draft
- **Output**: CRM record ID / confirmation
- **Tools**: Zoho CRM API, Google Sheets API
- **Memory**: none
- **Dependencies**: Zoho OAuth credentials
- **Failure conditions**: Zoho API unreachable/auth expired/rate limited
- **Retry logic**: 3x exponential backoff, then automatic fallback to Sheets write, with a flag for later Zoho re-sync
- **Human approval**: none
- **Success criteria**: record appears in target system within seconds
- **Possible improvements**: bidirectional sync (if Sheets fallback was used, auto-migrate to Zoho once available)

## Agent 5: Scheduler Agent
- **Purpose**: create the 1-hour follow-up job and the 3-4 month drip sequence jobs for a lead
- **Input**: lead record, sequence template set
- **Output**: scheduled jobs in the queue
- **Tools**: job queue (see Infrastructure)
- **Failure conditions**: queue unavailable
- **Retry logic**: 3x, then alert admin
- **Human approval**: none (schedule only; content generation for each touch is a separate downstream agent)

## Agent 6: Sequence Personalization Agent
- **Purpose**: lightly personalize each drip-sequence touch using the lead's stored context, without a full re-generation
- **Input**: touch template + lead context
- **Output**: personalized message text
- **Tools**: none
- **Memory**: reads the lead's persisted context (long-term memory, see Section 11)
- **Failure conditions**: context missing → falls back to template as-is
- **Retry logic**: 1 retry, then template fallback
- **Human approval**: none (established as automated once the first-touch pattern was approved)
- **Success criteria**: message reads as more specific than a raw template, without hallucinating new facts
