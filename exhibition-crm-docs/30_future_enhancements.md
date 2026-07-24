# 30. Future Enhancements

## Engagement-Based Re-Targeting
Use Zoho's email-open tracking (and WhatsApp read receipts, once live) to identify which leads are actively engaging with the sequence, and prioritize those for a real human follow-up call rather than letting the automated sequence run its full course regardless of signal. Why: this is the highest-leverage upgrade to conversion — right now the sequence treats every lead identically until Phase 2.

## WhatsApp Channel
Already scoped for Phase 2 — worth prioritizing early given India-market open-rate advantages over email (per earlier scoping discussion).

## Multi-CRM Support
Abstract the CRM Sync Agent behind a common interface so HubSpot/Salesforce/Pipedrive could be added without touching the rest of the pipeline. Why: unlocks the product for clients who aren't on Zoho, a prerequisite for the Phase 3 multi-tenant vision.

## Vector-Based Lead Search
Once lead volume grows into the thousands (multi-tenant/multi-event scale), add embeddings over `context_summary` to enable semantic search ("find leads who mentioned integration concerns") — not worth building at MVP's hundreds-of-leads scale (Section 11).

## Rep-Edit Learning Loop
Track how heavily reps edit the AI-drafted first follow-up over time, and use that signal to refine the Follow-up Draft Agent's prompt/tone per organization. Why: turns a static prompt into something that improves with real usage data, without requiring a full fine-tuning investment.

## Voice-Driven Card-Free Capture
For buyers without a physical card, let the rep verbally state the contact details during the recording and have the Context Extraction Agent pull them out of the transcript directly, removing dependency on a physical card entirely. Why: covers an edge case that will genuinely occur at every exhibition.

## Native Offline Mode
A true offline-first PWA (service worker caching, local-first data model) for venues with genuinely unreliable connectivity, beyond the current upload-queue-and-retry approach. Why: worth it only if real-world testing shows the queue-and-retry approach isn't sufficient — avoid building this speculatively.
