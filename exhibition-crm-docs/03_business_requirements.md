# 3. Business Requirements Document

## Business Process
Booth conversation → capture (audio + card) → confirm → CRM record → automated nurture sequence → (Phase 2) engagement-based re-targeting → sales handoff when a lead re-engages.

## Business Rules
- No template/marketing message (email or WhatsApp) is sent without the lead having a valid, captured contact method
- The first follow-up is always rep-reviewed before send; sequence touches after that are automated
- A lead record is never created from card scan alone without either an audio capture attempt or manual notes — context is a first-class requirement, not optional metadata

## Business Constraints
- Must operate on exhibition-grade connectivity (shared wifi, potential congestion)
- Must be usable by non-technical booth staff with no training beyond a 5-minute walkthrough
- Zoho CRM tier in use may cap API calls/automation — solution must degrade to Sheets without a redesign

## Compliance
- **Recording consent**: applicable regional law (e.g., one-party vs. two-party consent) determines whether verbal disclosure is required before recording a buyer. *Assumption: client will confirm the jurisdiction(s) of exhibitions and provide/approve a disclosure script; MVP ships with a mandatory on-screen consent-reminder step for the rep regardless of jurisdiction, as a safe default.*
- **WhatsApp opt-in**: Meta requires explicit opt-in before marketing/utility template messages — card capture alone does not constitute consent (Phase 2 constraint, drives the booth opt-in UX).
- **PII handling**: names, emails, phone numbers, and conversation transcripts are personal data — see Security Architecture §PII Protection.
- **GDPR/data residency**: out of scope for MVP (assumption: initial deployment targets a non-EU client and audience); revisit if the client's leads include EU entities.

## ROI Expectations
Value is measured against the counterfactual of manual entry and inconsistent follow-up: even a modest lift in leads that receive *any* timely follow-up (vs. today's ad hoc process) likely outweighs the tool's build + running cost (see Section 24, Cost Estimation) within a single exhibition cycle if it contributes to even one additional closed deal.

## Monetization
*(Applies to the Phase 3 multi-tenant vision, not the MVP, which is a single-client freelance build.)*
- Potential future model: per-seat SaaS subscription for booth rep seats, or per-exhibition usage pricing, given the bursty (event-driven) usage pattern of this product category.

## Pricing Strategy
- **MVP (this engagement)**: fixed-fee freelance build, quoted $1,800-$2,500, 30-40% deposit + milestone payments (per prior scoping discussion)
- **Future SaaS pricing** (if productized): usage/event-based tiers likely outperform flat monthly SaaS pricing, since exhibition companies use this in bursts around events, not continuously — worth user research before committing to a pricing model.
