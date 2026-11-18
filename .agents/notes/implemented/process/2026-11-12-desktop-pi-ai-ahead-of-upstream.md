# Agent Note: pi-ai 1.5.2 ahead of upstream for Claude Fable 5.2

Status: implemented

English | [中文](2026-11-12-desktop-pi-ai-ahead-of-upstream.zh.md)

## Problem

Anthropic released Claude Fable 5.2 (`claude-fable-5-2`) on 9 November 2026. DeepDive 0.3.1 ships the Harness `0.2.2-rc.2`, whose `@deepseek-ai/dsh-llm-pi-ai` adapter depends on `@earendil-works/pi-ai` 1.3.0. That catalog lists Claude Fable 5 and 5.1 but not 5.2, and a catalog route answers model discovery from the installed catalog without a network call, so DeepDive could not offer the model with its catalog capabilities. `pi-ai` 1.5.2, published on 10 November, adds it. Upstream had not adopted it: `upstream/master`, 166 commits past `dsh-v0.2.2-rc.2`, still pinned 1.3.0.

## Decision

The repository owner approved an exception to the fork-scope rule against changing Harness code. Desktop 0.3.2 upgrades the adapter's `pi-ai` to 1.5.2 ahead of upstream, following the procedure of upstream's own upgrade to `pi-ai` 1.3.0.

- Only `packages/llm/llm-pi-ai` moves to `^1.5.2`. `@botiverse/oar` 0.67.0 depends on `pi-ai` and `pi-coding-agent` `^1.3.0`, takes `~1.3.0` peers, and upstream qualifies it with that release, so the experimental OAR subagent keeps 1.3.0 and its patch, and the workspace holds both versions. Neither OAR nor `pi-coding-agent` is in DeepDive's deploy.
- `pnpm-workspace.yaml` exempts `pi-ai`, `pi-schema`, and `pi-telemetry` 1.5.2 from the release-age window, as upstream does for fresh `pi-ai` releases.
- The patch was ported with `pnpm patch`. `pi-ai` 1.5.0 fixed the per-delta re-parse of streamed tool arguments itself (earendil-works/pi#9265), so `patches/@earendil-works__pi-ai@1.5.2.patch` carries only upstream's Gemini thought-signature hunks. Upstream's Electron patch policy gains a matching `shared` entry and an exact-version override.
- `pi-ai` 1.5.1 enables Anthropic message threads (beta) for every request with a `sessionId`. The adapter passes `disableContinuation: true`, which affects only that feature, so requests stay complete as under 1.3.
- `DIGEST_SEED` moves to `v2`, as the adapter's README requires when a `pi-ai` upgrade changes Anthropic serialization: 1.5.1 keeps root `$defs` in tool schemas.
- The compat drift gates classify the four new fields, `requiresNonNullAssistantContent`, `requiresToolsWithToolHistory`, `promptCacheKeyMode`, and `supportsMessageThreads`, as `withhold`, so the configuration surface is unchanged. pi-schema's generated types spell every optional field `?: T | undefined`; the type-equality gate now compares value types without that `undefined`, and the chat-template schema types its optional field the same way, with validation unchanged.
- Tests that pinned 1.3 behavior now pin the property they protected: immutable, growing argument snapshots plus a multi-megabyte linearity guard, and Responses tool updates on `gpt-6-sol` in the `additional_tools` format of `pi-ai` 1.4, because 1.5 removed `gpt-5.5` from Codex and declares GPT-5.4's tools only at the top level.

## Alternatives considered

Declaring `claude-fable-5-2` on the owner's route by hand needs no repository change, but a profile cannot set the mid-conversation flags that only the catalog grants. Adding only the catalog entry to the 1.3.0 patch would be smaller, but it would patch generated catalog data and leave the rest of 1.4 and 1.5 behind. The owner declined to wait for upstream.

## Consequences

- The `anthropic` route offers Claude Fable 5.2 with its catalog capabilities: adaptive thinking, per-message effort, mid-conversation updates, and server-side fallback to Claude Opus 5.
- Every provider receives the `pi-ai` 1.4 and 1.5 changes. GPT-5.4 tools travel at the top level, Responses and Codex tool updates travel as `additional_tools` items, and `openai-codex` no longer lists `gpt-5.5`. Hand-declared Chat Completions gateways no longer receive `tools: []` with tool history; a gateway that needs it, such as an older LiteLLM in front of Anthropic, rejects those requests, and its compat switch is withheld.
- Resumed Claude conversations omit their recorded signed thinking once, because the seed changed.
- These files carry fork changes at the next sync: `packages/llm/llm-pi-ai/package.json`, `src/adapter.ts`, `src/catalog.ts`, `src/config.ts`, `src/prefix-binding.ts`, `src/provider-data.generated.ts`, the README pair and its pairing record, three test files, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `patches/@earendil-works__pi-ai@1.5.2.patch`, `apps/desktop/scripts/runtime-patch-policy.ts`, `apps/desktop/tests/prepare-runtime-patches.spec.ts`, and `THIRD_PARTY_NOTICES.md`. Once upstream pins `pi-ai` 1.5.2 or later, resolve each to upstream's version and drop the fork-only entries; until then, keep the fork's version and port upstream's changes onto it.

## Testing

The build orchestrator passes 10 of 10 gates. The deploy holds 19,234 files (422.9 MiB) stamped `0.3.2` on kernel `0.2.2-rc.2`, with one copy of `pi-ai` 1.5.2 that carries the Gemini hunks. Resolved through `getBuiltinModels('anthropic')`, as the adapter's catalog resolves it, `claude-fable-5-2` reports a 1,000,000-token context window, 128,000 output tokens, text and image input, `forceAdaptiveThinking`, per-message effort, mid-conversation system and tool updates, and $8/$40 pricing. The adapter package passes 480 of 480 tests and upstream's patch-policy suite 16 of 16; the Desktop suite passes 38 of 38 and Rust 9 of 9; `pnpm run typecheck` passes 5 of 5. The Office engine still renders the conversion fixture natively, and a headless boot of the `web` profile reaches readiness. The `scripts` and `gui` lanes fail only their known host-specific and locale-dependent tests. No request reached Anthropic during verification.
