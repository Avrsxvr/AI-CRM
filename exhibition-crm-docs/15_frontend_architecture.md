# 15. Frontend Architecture

## Pages
| Route | Purpose |
|---|---|
| `/login` | Auth entry |
| `/capture` | Primary rep flow: record, scan card, confirm, approve |
| `/leads` | Dashboard list (rep: own leads; admin: all org leads) |
| `/leads/[id]` | Lead detail, `needs_attention` resolution |
| `/settings` | Admin: Zoho credentials, sequence templates, consent script text |

## Components
- `RecordButton` — start/stop with visual recording state
- `CardScanner` — camera capture + preview + retake
- `ExtractedFieldsForm` — editable confirm screen for OCR output
- `FollowupDraftEditor` — editable email preview before approval
- `LeadStatusBadge`, `LeadList`, `LeadDetailPanel`

## State Management
React state/context sufficient at this scope — no need for a heavier state library (Redux/Zustand) given the linear, single-flow nature of the capture screen. Server state (leads, status polling) via lightweight fetch + polling or SWR-style revalidation.

## Authentication Flow
Supabase Auth session token attached to all API calls; route-level guards redirect unauthenticated users to `/login`; role-based UI (rep vs. admin) driven by the session's role claim.

## API Layer
Thin fetch wrapper per endpoint (Section 9), with typed request/response contracts shared between frontend and API routes (TypeScript types, single source of truth).

## Error Handling
- Network failure during upload → local queue + retry, visible "saving..." state, never silently fail
- OCR/transcription failure → surfaced as an explicit "needs your input" state, not hidden
- Toast/inline messaging for transient errors; persistent banner for anything requiring rep action

## Accessibility
Large touch targets for the record/scan buttons (booth conditions: rep may be standing, moving, distracted) — this matters more than strict WCAG compliance for MVP, though basic contrast/labeling should still be followed as good practice.

## Responsive Design
Mobile-first (primary use case is a phone at the booth); dashboard views (`/leads`) should also work reasonably on desktop for back-office use, but the capture flow itself is phone-only by design.
