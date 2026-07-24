# 10. Database Design

*Platform: Supabase (Postgres). Schema below covers MVP scope; Phase 3 multi-tenant scale would add stricter partitioning (see Partitioning below).*

## ER Diagram

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : has
    ORGANIZATIONS ||--o{ LEADS : owns
    USERS ||--o{ LEADS : captures
    LEADS ||--o| RECORDINGS : has
    LEADS ||--o| CARD_SCANS : has
    LEADS ||--o{ FOLLOWUPS : schedules
    LEADS ||--o| CRM_SYNC_LOG : tracks

    ORGANIZATIONS {
        uuid id PK
        text name
        text zoho_org_id
        timestamptz created_at
    }
    USERS {
        uuid id PK
        uuid organization_id FK
        text role
        text email
    }
    LEADS {
        uuid id PK
        uuid organization_id FK
        uuid captured_by FK
        text status
        jsonb contact_fields
        jsonb context_summary
        text crm_record_id
        timestamptz created_at
    }
    RECORDINGS {
        uuid id PK
        uuid lead_id FK
        text audio_url
        text transcript
        text status
    }
    CARD_SCANS {
        uuid id PK
        uuid lead_id FK
        text image_url
        jsonb extracted_fields
        numeric confidence
    }
    FOLLOWUPS {
        uuid id PK
        uuid lead_id FK
        int sequence_position
        text channel
        text status
        timestamptz scheduled_for
        timestamptz sent_at
    }
    CRM_SYNC_LOG {
        uuid id PK
        uuid lead_id FK
        text target_system
        text status
        timestamptz synced_at
    }
```

## Tables, Columns, Constraints
- `organizations`: one row per client (single row for MVP, structured for future multi-tenant growth)
- `users`: `role` constrained to `('rep','admin')`
- `leads`: `status` constrained to `('capturing','extracted','confirmed','synced','needs_attention')`; `contact_fields`/`context_summary` as `jsonb` for schema flexibility during early iteration
- `recordings`, `card_scans`: 1:1 with `leads` (one recording, one card per lead in MVP scope)
- `followups`: 1:many with `leads` (the drip sequence), `channel` constrained to `('email','whatsapp')`
- `crm_sync_log`: append-only audit trail of every sync attempt (Zoho or Sheets), for debugging fallback behavior

## Indexes
- `leads(organization_id, created_at)` — dashboard listing
- `leads(status)` — finding `needs_attention` leads
- `followups(scheduled_for, status)` — scheduler job pickup
- `leads(crm_record_id)` — dedup/lookup on re-sync

## Relationships
All foreign keys `ON DELETE CASCADE` from `leads` downward (deleting a lead removes its recording/scan/followups) except `crm_sync_log`, which is retained (`ON DELETE SET NULL`) for audit purposes even if a lead is later purged.

## Partitioning
Not required at MVP volume (hundreds of leads). If the product reaches multi-tenant SaaS scale (Section 1 vision), partition `leads` and `followups` by `organization_id` or by month of `created_at` to keep the scheduler's hot-path query fast.

## Archival Strategy
Raw audio files in object storage: retain 90 days post-event by default, then archive to cold storage or delete per client's data-retention preference (ties to Security §PII Protection). Lead/CRM records themselves persist indefinitely unless the client requests deletion.
