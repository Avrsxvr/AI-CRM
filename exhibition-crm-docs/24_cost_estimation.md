# 24. Cost Estimation

*Figures below are consistent with the cost analysis done earlier in scoping, based on July 2026 pricing. Assumption: ~120-150 leads per exhibition, ~8-minute average conversation.*

## LLM Costs (per exhibition)
| Item | Rate | Volume | Cost |
|---|---|---|---|
| Context extraction + follow-up draft (Claude Sonnet) | $3/$15 per 1M tokens | ~150 leads, ~5k in/1k out each | ~$5 |
| Card OCR (vision call) | same model, small calls | 150 calls | ~$1-2 |
| Sequence personalization (Claude Haiku, over 3-4 months) | $1/$5 per 1M tokens | ~1,500 calls (10 touches × 150 leads) | ~$3 |

## Hosting
| Item | MVP/Prototype | At modest production scale |
|---|---|---|
| Vercel | $0 (Hobby tier) | $20/mo (Pro) if outgrown |
| Supabase | $0 (free tier) | $25/mo (Pro) if outgrown |

## Database
Covered under Supabase above — no separate database cost at this scale.

## Storage
Audio + card images covered under Supabase Storage free tier at MVP volume; negligible incremental cost even at production scale given the small file sizes involved (audio clips, single card photos).

## Bandwidth
Included in Vercel/Supabase tiers at this traffic level — not a separate line item worth budgeting for.

## API Costs
| Service | Cost |
|---|---|
| Whisper transcription | $0.006/min → ~$7 per exhibition (1,200 min total) |
| Zoho CRM | $0 (Free tier — <cite index="20-1">5,000 API credits/24hr, up to 3 users</cite>) unless workflow automation requires Standard ($14/user/month) |
| Email provider | $0 (free tier covers MVP volume) to ~$15-20/mo beyond it |
| WhatsApp (Phase 2, India rates) | ~$15-40 in message costs per exhibition cycle + ~$20-50/mo BSP platform fee |

## Monitoring
$0 (Vercel built-in logs, Sentry free tier) at MVP scale.

## Expected Monthly Cost
| Phase | Estimate |
|---|---|
| Prototype/build phase | **< $10 total**, all free tiers |
| Per exhibition (usage-based AI costs) | **~$15-20** (email-only), **~$30-60** if WhatsApp is active |
| Ongoing monthly (during 3-4 month drip window, hosting + CRM + email) | **$0-60/month** depending on whether any free tier is outgrown |

## Scaling Cost
If the product moves toward the Phase 3 multi-tenant SaaS vision (Section 1), costs scale primarily with: (1) number of concurrent client organizations × their exhibition frequency, (2) Zoho tier required per client (each client needs their own Zoho relationship — this product does not aggregate CRM cost), (3) hosting tier upgrades once free-tier limits are exceeded by cross-client volume. At that point, a per-organization cost model should be built rather than extrapolating linearly from this single-client estimate.
