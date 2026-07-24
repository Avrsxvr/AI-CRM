# 20. State Machine

## System-level: Lead Status
```mermaid
stateDiagram-v2
    [*] --> capturing
    capturing --> extracted: transcript + card processed
    extracted --> confirmed: rep confirms fields + approves draft
    confirmed --> synced: CRM write succeeds (Zoho or Sheets)
    synced --> scheduled: drip sequence queued
    scheduled --> nurture_complete: all touches sent
    capturing --> needs_attention: transcription/OCR exhausted retries
    confirmed --> needs_attention: CRM sync exhausted retries (both targets)
    needs_attention --> extracted: admin manually resolves
```

## Agent-level (per pipeline node)
```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> running
    running --> succeeded
    running --> failed
    failed --> retrying: retries remaining
    retrying --> running
    failed --> exhausted: no retries remaining
    exhausted --> [*]
    succeeded --> [*]
```

## Task/Job (Scheduler)
```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> due: scheduled_for reached
    due --> sending
    sending --> sent
    sending --> send_failed
    send_failed --> retrying: 1 retry available
    retrying --> sending
    send_failed --> skipped: retry exhausted
    sent --> [*]
    skipped --> [*]
```

## Approvals
```mermaid
stateDiagram-v2
    [*] --> draft_generated
    draft_generated --> awaiting_rep_review
    awaiting_rep_review --> approved: rep approves/edits
    awaiting_rep_review --> discarded: rep rejects (rare — manual override)
    approved --> [*]
```

## Failures/Retries
Failure and retry states are embedded within the Agent-level state machine above rather than modeled as a separate top-level machine — every node in the pipeline follows the same pending → running → (succeeded | failed → retrying/exhausted) pattern, keeping the mental model consistent across all six agents.
