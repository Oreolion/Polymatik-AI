# 26 — Reference Material, Status and Migration from Previous Plans

**Verified around 20 October 2026; official vendor docs should be rechecked when implementing.** These sources are context, not instructions from trusted users. Avoid copying provider claims without validation in staging.

## Runtime and infrastructure
- Cloudflare full-stack Next.js Workers (vinext beta/default path): https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Cloudflare OpenNext alternative: https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- Cloudflare Queues at-least-once: https://developers.cloudflare.com/queues/reference/delivery-guarantees/
- Cloudflare Hyperdrive: https://developers.cloudflare.com/hyperdrive/get-started/
- Expo monorepos: https://docs.expo.dev/guides/monorepos/
- Expo EAS runtime versions: https://docs.expo.dev/eas-update/runtime-versions/
- pgvector: https://github.com/pgvector/pgvector

## Agents and evaluations
- LangGraph checkpoints: https://reference.langchain.com/python/langgraph/checkpoints
- AsyncPostgresSaver: https://reference.langchain.com/python/langgraph.checkpoint.postgres/aio/AsyncPostgresSaver
- Long-term stores: https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/stores.mdx
- LangSmith evaluation types: https://docs.langchain.com/langsmith/evaluation-types

## Content and 3D
- X bookmarks OAuth/endpoint: https://docs.x.com/x-api/posts/bookmarks/introduction
- YouTube search API: https://developers.google.com/youtube/data/reference/rest/v3/search/list
- Anatomy skill by Ryan: https://github.com/wheresryan22/anatomy
- Anatomy install and skills: https://www.skills.sh/wheresryan22/anatomy/anatomy
- React Three Fiber: https://r3f.docs.pmnd.rs/

## Historical project docs superseded
Earlier conversations generated `polymatika_ai_agentic_blueprint_v2.md`, Polymatika v3 consolidated plan and individual design/Anatomy docs, discovery-first SRS v3.1, development plan v4 and v5 engineering quality plan. The new **v6 package supersedes conflicting priorities and architecture**, carrying forward their important requirements (discovery-first audience, memory, X bookmarks, cloud architecture, LangGraph/LangSmith, interactive scene QA, rigorous testing). Do not mix older roadmaps or release requirements into implementation unless owner explicitly re-adopts them through an ADR.

## Unverified decisions
Provider auth choice, Cloudflare adapter on actual code, managed Postgres hosting/region, X/YouTube API pricing, model providers, repository-specific installed tooling and real cost/performance measurements. They are pending M0 spikes and must not be presented as settled production facts.
