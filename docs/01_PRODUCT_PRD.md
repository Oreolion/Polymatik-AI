# 01 — Product Requirements Document (PRD)

## Vision
**Polymatika AI — a universe of knowledge personalized to curiosity.** A software product that lets philomaths discover, organize, question, experience and remember knowledge spanning sciences, engineering, arts, literature, philosophy and other disciplines. The aspiration is a persistent learning companion rather than a generic chatbot or ordinary RAG viewer.

## Problem and hypothesis
Curious learners currently distribute their intellectual life among X bookmarks, YouTube, articles, papers, notebooks, search engines and chat assistants. Discovery rewards attention, while research, verification, personal knowledge continuity and practice remain fragmented. Hypothesis: combining an intellectually relevant content feed with one-click cited research, personal learning memory and evidence-backed cross-domain exploration yields a repeatable experience users prefer and may pay for.

## Who and why
- **Primary user:** independent, curiosity-driven learner who bookmarks useful posts/videos and wants the next valuable idea without junk.
- **Early wedge:** developers, engineering learners, systems thinkers and self-taught researchers who often move between computer science, control systems, physics and philosophy.
- **Secondary:** educators/communities publishing curated exhibits and challenges (later).
- Avoid assuming all users want exams; support lightweight exploration and optional deep-dive work.

## Jobs to be done
- "Help me discover useful things about topics I love, not merely what is trending."
- "Turn the bookmarks I've saved into a navigable intellectual map and better recommendations."
- "Tell me why this article/video matters and show me credible alternatives."
- "Explain a difficult idea, distinguish a genuine connection from an analogy, and teach me how to apply it."
- "Remember my projects, open questions and progress without overclaiming what I know."
- "Let me manipulate a machine or system so I understand how its parts interact."

## Core experiences
**Discover:** `For You`, `Following`, `Explore` and saved resources; user controls for topic filters, mute, save, 'why this?', variety, and session pauses. Show verified provenance and link to originating provider. Not every card needs an LLM summary.

**Research:** source-grounded conversation attached to a resource or topic, citations to actual stored sources, confidence/limitations, provenance and prompt-injection defense. Allow follow-on search through provider tools with budgets and approval.

**Learn:** optional learning goal, baseline quiz, short practice, feedback, progress tracking and later spaced review. Never equate clicks/saves with mastery.

**Connect:** subject-overlap views classifying relationships as equivalent, analogical, causal, contrasting, historical influence or speculative; links backed by cited evidence, not impressive-looking unfounded webs.

**Systems Explorer:** polished, keyboard-accessible diagrams and a curated interactive mechanism; show state and real parameter behavior; follow architecture for generated scenes.

**Collaborate (future):** shared reading trails, lists, challenges, moderation; no public sharing of private memory or bookmarks.

## Differentiation and anti-goals
Compete on integrated discovery-to-understanding continuity and trust, not by claiming to be smarter than general LLMs. Avoid feature parity with NotebookLM, ChatGPT, Brilliant, anatomy platforms. Do not target medical clinical education initially. Build only a small reviewed corpus and a few expert-authoritative themes first.

## UX principles
Premium warm-editorial research studio; beautiful but restrained; instant feedback; navigable via keyboard and assistive tech; rich mobile feed; deep research desktop workspace; calm controls for notification/scrolling; clear distinction between source content, synthesized AI explanation, user annotation and assessed understanding.

## Monetization hypothesis (unvalidated)
Free discovery/sample deep dives; optional paid advanced research/workspace/tools and possibly creator/instructor products. **Do not implement billing until willingness-to-pay tests.** Limit model cost per user and show meaningful quota status.

## North-star and guardrails
Primary product metric: **weekly meaningful learning discoveries** (e.g., distinct resource saved then opened/revisited/researched, with anti-spam dedupe). Secondary: independent learning gain, qualified weekly retention, recommendation relevance, voluntary return, cost per meaningful session, sharing of useful exhibits. Negative indicators: shallow infinite scrolling without useful actions, misleading citations, frequent unwanted recommendations, agent costs exceeding plausible revenue.

## Core MVP promise
A first-time user can select interests, explore quality educational resources, save one, ask a grounded follow-up, demonstrate a small learning gain, return on another device and see continuity. That's the north-star end-to-end acceptance path.
