# 23. Performance Strategy

## Latency Targets
- Card scan → extracted fields shown to rep: < 5 seconds
- Full capture flow (stop recording → CRM synced): < 2 minutes, per PRD acceptance criteria
- Dashboard load: < 1 second (trivial at MVP data volume)

## Concurrency
Card OCR and audio transcription/context extraction run in parallel (Section 7), shortening the rep's total wait before seeing a follow-up draft. At MVP scale (a handful of reps capturing sequentially, not simultaneously in huge volume), this is more about individual-lead latency than system-wide concurrency load.

## Caching
Client-side dashboard caching only (Section 11 §Cache Strategy) — no server-side response caching layer needed at this data volume.

## Queue Design
Simple polling-based job queue (Section 16) is appropriate at MVP scale; a dedicated message broker (SQS/RabbitMQ) would add operational complexity without a corresponding performance benefit at hundreds-of-jobs-total scale.

## Optimization
The dominant latency cost is external API round-trips (transcription, LLM calls), not application code — optimization effort should go toward parallelizing independent calls (already addressed above) rather than micro-optimizing application logic.

## Database Optimization
Indexes defined in Section 10 cover the two hot-path queries (dashboard listing, scheduler's due-job lookup) — no further optimization needed at MVP data volume.

## Cost Optimization
See Section 13 (LLM Strategy) and Section 24 (Cost Estimation) — model selection (Haiku vs. Sonnet per task) is the primary cost lever, not infrastructure tuning, given how cheap the compute layer already is relative to API costs at this scale.
