# 12 — Discovery Feed, Recommendation Pipeline and Ranking

## Strategy
Polymatika is for curiosity-driven educational discovery. Optimize **meaningful discoveries**, not raw minutes scrolled. Feed should be lively, broad enough to surprise, transparent, and safe. It must function cheaply without agent inference per item.

## Serving architecture
Offline scheduled/event-driven content discovery → verify rights/metadata → categorize canonical topics/creators → score quality and freshness → maintain global eligible pool → per-user candidate generation from selected interests, saved content, optional bookmark interests and exploratory topics → cheap deterministic reranking/filtering → store versioned `recommendation_batches` → API cursor pages. Cache only public metadata broadly; private batches scoped to user.

## Starter deterministic rank function (hypothesis)
`score = 0.35 * topic_match + 0.20 * source_quality + 0.15 * learning_gap_relevance + 0.10 * novelty + 0.10 * recency + 0.10 * format_fit - repetition_penalty - dismissed_topic_penalty`. Weights are starting hypotheses, not researched performance; implement configurable and testable. Add diversity/MMR and novelty exploration quotas, with fail-open graceful fallback to curated broad-interest content. Never use mastery from bookmarks alone.

## Explainability contract
Every item can show 1–2 reasons derived from features used in ranking: `matches_selected_interest`, `from_followed_creator`, `related_to_saved_topic`, `explore_adjacent_area`, `popular_in_curated_collection`, or `learning_gap_followup`. Explanations are not LLM-fabricated after the fact; card shows original provider and context.

## Critical quality defenses
Deduplicate across providers/canonical URLs; limit repeated authors/topics in local window; exclude dismissed/muted/deleted; constrain low-credibility claims; label speculative opinion as opinion; neutral political/sensitive-topic safeguards; diversity without random irrelevance; give easy feedback. No hidden clickbait or manipulative urgency. No infinite auto-play by default; user chooses pause and focus modes.

## Cold start
Manual topic/figure/work selection P0. Optional user-authorized X bookmark import P1 (post-API spike). If few signals, fallback to quality-reviewed starter shelves with explicit discovery prompts. Display adjustable balance between familiar interests and new domains.

## Learning-to-rank progression
V0 rules + quality filters + offline expert labels → V1 personalization using saves/dismisses/meaningful interactions → V2 contextual bandit/learning-to-rank only when data quantity and explicit fairness/privacy evaluation justify it. Before ML optimization compare against simple heuristics using ranking metrics, cost and impact on independent learning.

## Metrics and experimentation
Offline: NDCG@10 on labeled relevance set, coverage by subject, provider diversity, dedupe %, explanation correctness. Online: save→open/revisit/research conversions, 7/28-day retention, qualified learning action per 100 impressions, complaints/dismissals, low-value repeat exposure, latency/cost. A/B experiments opt-in where required and use guardrails. Don't claim improved education from watch time alone.

## Feed API performance tests
Use deterministic 1k/10k/100k catalog seeds; benchmark p50/p95 server latency for cache hits/misses and pagination; test 100 concurrent authenticated simulated users as a *first planning workload*, then update capacity with actual forecasts. Verify stable cursors and dedupe under new batch generation. Track DB connections and index plans.
