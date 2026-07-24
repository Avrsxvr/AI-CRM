# 27. Folder Structure

```
exhibition-crm-agent/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── capture/page.tsx
│   ├── leads/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── settings/page.tsx
│   └── api/
│       ├── leads/
│       │   ├── recording/
│       │   │   ├── start/route.ts
│       │   │   └── stop/route.ts
│       │   ├── card-scan/route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── confirm-fields/route.ts
│       │       └── approve-followup/route.ts
│       ├── webhooks/
│       │   └── email-status/route.ts
│       └── health/route.ts
├── components/
│   ├── RecordButton.tsx
│   ├── CardScanner.tsx
│   ├── ExtractedFieldsForm.tsx
│   ├── FollowupDraftEditor.tsx
│   ├── LeadList.tsx
│   ├── LeadStatusBadge.tsx
│   └── LeadDetailPanel.tsx
├── lib/
│   ├── agents/
│   │   ├── contextExtraction.ts
│   │   ├── cardOcr.ts
│   │   ├── followupDraft.ts
│   │   ├── crmSync.ts
│   │   ├── scheduler.ts
│   │   ├── sequencePersonalization.ts
│   │   └── graph.ts              # LangGraph pipeline definition
│   ├── services/
│   │   ├── zoho.ts
│   │   ├── sheets.ts
│   │   ├── whisper.ts
│   │   ├── claude.ts
│   │   ├── email.ts
│   │   └── whatsapp.ts           # Phase 2
│   ├── repositories/
│   │   ├── leads.ts
│   │   ├── followups.ts
│   │   └── crmSyncLog.ts
│   └── prompts/
│       ├── contextExtraction.prompt.ts
│       ├── cardOcr.prompt.ts
│       ├── followupDraft.prompt.ts
│       └── sequencePersonalization.prompt.ts
├── worker/
│   └── scheduler-poll.ts         # cron entrypoint for due followups
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── supabase/
│   └── migrations/
├── docs/                          # this document set
├── .env.example
├── package.json
└── README.md
```
