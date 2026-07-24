# 13. LLM Strategy

| Role | Recommendation | Rationale |
|---|---|---|
| Best/Reasoning LLM | Claude Sonnet | Context Extraction and Follow-up Draft need genuine reasoning over nuanced conversation content — worth the mid-tier cost for quality |
| Fast/Cheap LLM | Claude Haiku | Sequence Personalization Agent (lightweight template adaptation, high call volume across many touches) — cheap model is sufficient |
| Fallback LLM | Same-family fallback (e.g., Haiku standing in for Sonnet on transient Sonnet outage) | Keeps behavior predictable rather than switching model families under failure |
| Vision Model | Claude Sonnet (vision-capable call) | Card OCR — a dedicated OCR engine is a valid alternative if accuracy on handwritten cards becomes a problem post-MVP |
| Speech Model | Whisper API | Industry-standard, cheap, good multilingual support if needed later |
| Embedding Model | Not required for MVP | No vector search need at current scale (see Memory Architecture) |

## Cost Optimization Strategy
- Use Haiku wherever the task doesn't require deep reasoning (Sequence Personalization is the clearest case)
- Enable prompt caching on the largely-static system prompts once call volume grows enough to matter
- Batch API is not applicable here — this pipeline is real-time/interactive by nature (rep is waiting at the booth), not a batch job

## Model Routing Strategy
Routing is static per-agent (see Section 6), not dynamic — each agent has one designated model, chosen at build time based on task complexity, not routed at runtime. This keeps behavior predictable and easy to debug, appropriate for a first production build. Revisit dynamic routing only if cost at scale (Phase 3) justifies the added complexity.
