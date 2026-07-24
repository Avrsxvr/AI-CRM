# 1. Executive Summary

## Product Overview
An AI-powered lead capture and follow-up system for exhibition/trade-show sales teams. A booth rep records the buyer-seller conversation, scans the buyer's business card, and the system automatically transcribes the conversation, extracts contact details and buyer context, creates a CRM record (Zoho, with a Google Sheets fallback), and runs an automated multi-month, context-aware follow-up sequence (email, later WhatsApp).

## Vision
Turn every exhibition conversation into a permanent, actionable CRM asset within minutes — with zero manual data entry — so no lead generated at real cost (booth, travel, staff time) goes cold from human forgetfulness.

**Long-term vision (Phase 3+):** a multi-tenant SaaS product any exhibiting company can self-serve onto, not just a single-client tool. *(Assumption: the "thousands of users" scale target in this spec refers to this future state — the MVP described throughout is a single-client, single-CRM deployment, per the original scoping conversation.)*

## Business Goals
| Goal | Metric |
|---|---|
| Eliminate manual lead entry | 0 manual re-typing of contact info post-event |
| Reduce lead response latency | First follow-up within 1 hour of meeting |
| Increase follow-through over time | 100% of leads receive the full 3-4 month sequence without manual intervention |
| Prove value fast | Working prototype demoed to client before full build commitment |

## Target Users
- **Booth sales rep (primary/seller side)** — captures the interaction live at the booth
- **Back-office sales/marketing team** — reviews leads, edits sequences, monitors CRM post-event
- **Buyer (company seeking a service)** — passive; never touches the app directly

## Primary Use Cases
1. Rep records a live buyer conversation and stops recording at the end
2. Rep scans the buyer's business card
3. System extracts contact + conversation context, rep confirms, record is created
4. System auto-schedules a personalized 1-hour follow-up and a 3-4 month drip sequence

## Success Metrics
- % of booth conversations converted into a CRM record (capture rate)
- Time from "meeting ends" to "lead recorded" (target < 2 minutes)
- % of leads completing the full drip sequence unattended
- Post-event reply rate on AI-drafted follow-ups vs. client's historical baseline

## Competitive Advantages
- Purpose-built for the exhibition moment (not a generic CRM plugin) — works in under 90 seconds per lead, live, at the booth
- Follow-up content is grounded in what was actually said in the conversation, not a generic template
- Zoho-first but not Zoho-locked — a Sheets fallback means the client can start before CRM access is fully provisioned
- Built with an agent-based pipeline (LangGraph), so channels (email → WhatsApp) and CRMs can be added as independent nodes without a rewrite
