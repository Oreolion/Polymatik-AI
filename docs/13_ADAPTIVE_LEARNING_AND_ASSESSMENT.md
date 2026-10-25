# 13 — Adaptive Learning and Evidence of Understanding

## Philosophy
Curiosity-first does not mean all learning must be gamified. Users may scroll to discover, research deeply, or complete a short optional exercise. Adapt based on *observed demonstrated understanding*, not inferred expertise from browsing.

## MVP assessment contract
Attach one short practice item to curated topic/resource, e.g., token-bucket burst behavior. Each item has prompt, concept ID, rubric, correct condition, explanations, difficulty, version and source references. Input is user answer or prediction; grading must be deterministic for mathematical/parameter checks, rubric-graded with audited model for conceptual answers. Never make a correctness claim based solely on model self-judgment if a deterministic oracle exists.

## Data flow
User asks to learn → `learning_goal` and baseline self-report (optional) → activity selected based on goal/mastery evidence → user predicts/explains → grader records result/feedback/rubric version → mastery **estimate** updated with evidence → next practice/resource recommended → spaced review optional P1. Record uncertainty and opportunity for retry; show progress as *estimated*, not an exam certificate.

## Personalized teaching styles
Offer `explain simply`, `first principles`, `rigorous math`, `historical development`, `cross-domain analogy`, `visual example`, `challenge me`. The agent may use saved preferences but must ask when evidence is weak. Disclose unsupported cross-domain claims and known limits.

## P1 spaced repetition and paths
Use reviewed scheduling algorithms (e.g., FSRS for recall, where appropriate) after collecting graded review data. Preserve scheduling state and allow export. Mastery should be concept/version scoped, not globally transferable to adjacent topics without evidence.

## Quality evaluation
Concept-item validity reviewed by domain literate reviewer; test difficult misconceptions, adversarial phrasing, unfair grading, accessibility, localization, prompt injection inside question metadata and answer leakage. Pilot pre/post and delayed tests with comparable difficulty, not simply generated quiz completion rates.

## Engagement controls
Allow reflection-only and research-only modes. Explain what data is retained, default not to public ranking. Celebrate genuine progress without manipulative streak loss notifications.
