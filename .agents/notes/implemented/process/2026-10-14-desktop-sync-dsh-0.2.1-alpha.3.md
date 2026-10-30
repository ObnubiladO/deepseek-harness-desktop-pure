# Agent Note: Desktop synchronization with dsh-v0.2.1-alpha.3

Status: implemented

English | [中文](2026-10-14-desktop-sync-dsh-0.2.1-alpha.3.zh.md)

## Problem

The fork shipped `0.2.3` on `dsh-v0.2.1-alpha.2`. Upstream then published `dsh-v0.2.1-alpha.3`: 852 commits and 3,311 changed files, which again rewrote an adaptation point and this time also replaced the repository's build.

- `packages/client/connection/src/browser-auth.ts` gained `authenticateApi`, an extracted private `authenticate`, and a v2 cookie payload in `0f7ac58213 feat(connection): isolate API operators without changing browser identity` — while still deriving the cookie name from the authority, which is the behaviour this fork replaced with one shared name.
- The root build was replaced by a gate orchestrator (`scripts/build.ts`) whose steps invoke `tsdown --config-loader native --env.DSH_BUILD_FACE host`.

## Decision

Integrate `dsh-v0.2.1-alpha.3` at `2fbf4359b82fb94c03dcce0b831660d87f12ea5c` from fork tip `c7b2e44762` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `16a1fc834b` (`integrate/dsh-0.2.1-alpha.3`), tree `d676a4896e`; six conflicts.
- Upstream-rooted candidate: `aa0a00f555`, same tree, `0` behind the target.
- Master landing: `2153662f37`, first parent the previous fork tip `c7b2e44762`, second parent the candidate, tree equal to the candidate; the eighteen paths the landing merge disagreed on were resolved to the candidate.

Resolutions:

- **`browser-auth.ts`** takes upstream's operator-isolation rewrite and re-applies the fork's single shared `dsh-auth` cookie name where they use `cookieName(authority)`. The connection suite passes 189 of 189 — upstream's new isolation tests included — so their feature and the fork's fix coexist. Removing their `cookieName` again leaves the same dangling `createHash` import as the previous cycle; it is removed again.
- **The llm-pi-ai README trio and the lockfile** were taken from upstream.
- **`scripts/doc-budgets.manifest.json`** merges upstream's restructure (`docs/AGENTS.md`, a raised `packages/AGENTS.md`, a removed `docs/defensive-patterns.md` entry) with the fork's own `AGENTS.md` ceiling, and the overflow was condensed out of fork-owned prose — a duplicated candidate sentence, qualifiers such as "raw", "manual" and "continuous" — rather than by raising the ceiling.

Preserved: Desktop packaging and branding, the `settings.update` seat, the WebSocket 1006 transport classification, the full-title header rule, the deployed DeepSeek account and LLM base packages, the plugin-patch carrier, the update seat's semver precedence, and `linkDesktopPackages` in the sidecar, confirmed present in the rebuilt deploy.

## Alternatives considered

Reverting the `pnpm run clean` step was the tempting response to the build failure, and it would have hidden a real defect: the failure reproduced identically on a built workspace. Patching upstream's `verify-repository-references` gate to accept lockfiles was rejected as out of the fork's scope, since the fork does not change Harness behaviour; the false positive is documented instead. Taking upstream's `browser-auth.ts` wholesale was rejected for the third cycle running, because the fork's own test encodes the opposite cookie behaviour.

## Consequences

Desktop proceeds to an independent `0.2.4` release on this base. Third-party plugin bundles again need a fresh exemption for `0.2.1-alpha.3`; the usage companion keeps loading without one. One upstream condition is carried knowingly: `doc-sync` reports 42 of 43 gates because `verify-repository-references` flags `python/sdk/uv.lock:113` as a commit hash. That file is byte-identical to upstream's, and the flagged token is a PyPI file digest inside a package URL, so the gate is producing a false positive on a file the fork does not own; the gate exposes no exemption list.

## Testing

`pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors), both now running through upstream's new orchestrator scopes. The Desktop suite passes 30 of 30 Node tests against the rebuilt `0.2.4` bundle and 9 of 9 Rust tests. A headless boot of the default `web` profile reaches readiness with no `failed to import` row and no pending row for the usage companion. The connection package passes 189 of 189. `doc-sync` passes 42 of 43, with the false positive above. The `scripts` lane fails one load-sensitive spec that passes in isolation, and the `gui` lane keeps the three locale-dependent `ui-settings-account` assertions that already fail on this host.

## Environment note: npm silently drops build flags

Upstream's new orchestrator calls `tsdown --config-loader native --env.DSH_BUILD_FACE host`. The fork's `build:harness` reached the root build through `pnpm dlx npm@11.18.0 --prefix .. run build`, and npm 11 no longer forwards those flags: it warns `Unknown cli config "--env.DSH_BUILD_FACE"` and discards them, so tsdown received `native` (from the config loader) and `host` (from the environment assignment) as **positional entry modules** and failed with `[UNRESOLVED_ENTRY] Cannot resolve entry module native` / `host`.

The contradiction that identified the cause was that the very same gate passed when the orchestrator was run directly: `pnpm run build` reported `9 passed, 0 failed`, while the bundle path failed on the same tree. Same code, same tree, different wrapper. `build:harness` now calls `pnpm --dir .. run build`, and `desktop/tests/config.test.mjs` asserts the new wrapper.

Two lessons are recorded. A wrapper is part of the build contract: when it changes who parses the arguments, it can break a build without touching a line of build code. And when a step fails inside one entry point but passes in another, the difference to inspect is the entry point, not the step.

A third is the ordering this cycle added to the fork's sync procedure: after `pnpm run clean`, run the orchestrator (`pnpm run build`) once before preparing the bundle. The orchestrator's gates generate entries such as `lib/types/apply-injections.js` that a tsdown step reached earlier through the bundle path cannot resolve.
