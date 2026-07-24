# 22. Testing Strategy

## Unit Tests
Cover: schema validation logic for extracted JSON, retry/backoff utilities, repository query builders, followup scheduling date math (1hr + drip cadence calculation) — the parts of the system with clear, deterministic expected behavior.

## Integration Tests
Cover: full agent pipeline run against mocked external APIs (Claude, Whisper, Zoho, Sheets) to verify the LangGraph state transitions and fallback logic (e.g., Zoho failure → Sheets fallback actually fires) without incurring real API cost on every test run.

## Prompt Tests
A small fixed set of representative transcripts/card images (including deliberately messy ones — background noise transcript, blurry card) run against the real LLM periodically (not on every CI run, to control cost) to catch prompt regressions before they reach production. Assert on schema validity and absence of hallucinated fields, not exact text match.

## API Tests
Contract tests against each internal API route (Section 9) — request validation, auth enforcement, response envelope shape, error codes.

## Load Tests
Given MVP's bursty-but-modest scale (a handful of reps, dozens of leads/day), full load testing infrastructure is disproportionate. A lightweight smoke test simulating ~10 concurrent captures is sufficient to validate the system holds up during a busy booth moment.

## Security Tests
Verify RLS policies actually prevent cross-organization data access (critical even for a single-client MVP, since it's the seam that makes future multi-tenancy safe); verify no secrets leak into client-side bundles or logs.

## Chaos Testing
Not justified at this scale — formal chaos engineering is disproportionate for a single-client tool. The error-handling table (Section 19) and its fallback paths are validated via targeted integration tests instead (deliberately inject failures for each external dependency).

## End-to-End Tests
One critical-path E2E test: record (mocked audio) → card scan (test image) → confirm → approve → verify lead lands in the (test) Zoho sandbox or Sheets fallback with correct fields and a scheduled first followup. This single E2E test covers the highest-value, highest-risk path in the entire product.
