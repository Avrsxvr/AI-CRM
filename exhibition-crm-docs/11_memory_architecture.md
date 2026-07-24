# 11. Memory Architecture

## Short-term Memory
Per-lead graph state during the capture pipeline (transcript, extracted context, card fields) — lives only for the duration of that lead's processing, held in the LangGraph state object, persisted to Postgres once the pipeline completes.

## Long-term Memory
The `leads.context_summary` field is the durable long-term memory of each conversation — read by the Sequence Personalization Agent for every drip touch over the following 3-4 months. This is deliberately simple structured storage, not a vector store, because MVP scale (hundreds of leads) doesn't need semantic retrieval — direct lookup by `lead_id` is sufficient.

## Vector Memory
**Not required for MVP.** Would become relevant only if a future feature needed semantic search across leads (e.g., "find all leads who mentioned budget concerns") — flagged as a Future Enhancement (Section 30), not part of this build.

## Session Memory
Rep's in-progress capture session (current recording state, uploaded-but-unprocessed card) held client-side + short-term server state; not persisted beyond the active capture flow.

## Persistent Memory
Postgres (Supabase) is the single source of persistent truth: leads, followups, sync logs. No separate memory store needed at this scale.

## Cache Strategy
Dashboard reads cached client-side (30s TTL, see API spec). No agent-level prompt caching needed at MVP call volume, though Anthropic prompt caching is worth enabling on the (fairly static) system prompts for Context Extraction and Follow-up Draft agents once volume grows, to cut input-token cost.

## Retention Policy
See Database Design §Archival Strategy — 90-day default for raw audio, indefinite for structured lead records unless client requests deletion.

## Context Window Strategy
Each agent call is stateless and scoped to a single lead — no need to manage a growing context window across a conversation, since there's no multi-turn chat with the LLM in this product. This keeps token costs predictable and low (see Cost Estimation).

## Memory Retrieval
Sequence Personalization Agent retrieves `leads.context_summary` by direct primary-key lookup at send time — simple, fast, no retrieval-relevance problem to solve given the 1:1 lead-to-context relationship.

## Memory Updates
`context_summary` is written once (at capture time) and treated as immutable for MVP. Phase 2 could allow the back-office team to manually append notes from later interactions, but that's out of scope for this build.
