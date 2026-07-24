# 5. Workflow Document

## Workflow 1: Lead Capture (Card + Audio → CRM Record)

```mermaid
flowchart TD
    A[Rep starts recording] --> B[Conversation happens]
    B --> C[Rep stops recording]
    C --> D[Audio uploaded]
    D --> E{Upload succeeded?}
    E -- No --> E1[Queue locally, retry on reconnect]
    E1 --> D
    E -- Yes --> F[Transcription job]
    F --> G{Transcription succeeded?}
    G -- No --> G1[Retry up to 3x with backoff]
    G1 --> F
    G1 -- exhausted --> G2[Mark lead 'needs manual review', notify admin]
    G -- Yes --> H[Context Extraction Agent]
    H --> I[Rep scans business card]
    I --> J[Card OCR Agent]
    J --> K{Fields extracted with confidence?}
    K -- Low confidence --> K1[Rep manually corrects fields]
    K -- High confidence --> L[Rep confirms fields]
    K1 --> L
    L --> M[Follow-up Draft Agent generates email]
    M --> N[Rep reviews/edits draft]
    N --> O[Rep approves & saves]
    O --> P[CRM Sync Agent]
    P --> Q{Zoho reachable?}
    Q -- Yes --> R[Write lead + note to Zoho]
    Q -- No --> S[Write to Google Sheets fallback]
    R --> T[Scheduler Agent: queue 1hr follow-up + drip sequence]
    S --> T
    T --> U[Lead flow complete]
```

## Workflow 2: Drip Sequence Execution (per lead, over 3-4 months)

```mermaid
flowchart TD
    A[Lead scheduled] --> B[Wait until next touch date]
    B --> C[Sequence Personalization Agent drafts touch]
    C --> D{Send channel}
    D -- Email --> E[Send via email provider]
    D -- WhatsApp Phase 2 --> F{Opt-in on file?}
    F -- No --> F1[Skip WhatsApp touch, fall back to email]
    F -- Yes --> G[Send via WhatsApp BSP]
    E --> H{Delivery succeeded?}
    G --> H
    H -- No --> H1[Retry 1x after 1hr, then log failure, continue sequence]
    H -- Yes --> I{More touches remaining?}
    I -- Yes --> B
    I -- No --> J[Sequence complete, mark lead 'nurture finished']
```

## Approval Path
The only mandatory human-in-the-loop checkpoint in MVP is the **first follow-up email**, reviewed and approved by the rep before it's queued. All subsequent drip touches send automatically once that first approval establishes the baseline tone/content was acceptable to the rep.

## Exception Path (system-wide)
Any agent failure that exhausts its retry budget marks the lead with a `needs_attention` flag visible on the admin dashboard, rather than silently dropping the lead or blocking the rep's next capture.
