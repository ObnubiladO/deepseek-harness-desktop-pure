# Agent Note: Desktop synchronization with dsh-v0.2.1-rc.5

Status: implemented

English | [中文](2026-10-30-desktop-sync-dsh-0.2.1-rc.5.zh.md)

## Problem

The fork shipped `0.2.7` on `dsh-v0.2.1-rc.3`. Upstream then published `dsh-v0.2.1-rc.5`, spanning `rc.4` as well: 13 commits and 388 changed files, with more deletions than insertions.

The content is fixes rather than features — thinking-block rendering, tooltip behaviour when labels overflow, and keeping account-catalogue and MCP resource-listing diagnostics off ACP stdout so they cannot corrupt the protocol stream. No file carrying a fork adaptation moved in this range.

## Decision

Integrate `dsh-v0.2.1-rc.5` at `b830ec950faba0a46dda564be3e2d854afed94f1` from fork tip `4a7ade3b9e` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `b17fec93ce` (`integrate/dsh-v0.2.1-rc.5`), tree `96d4cad46a`; **no conflicts**.
- Upstream-rooted candidate: `e89ec5d0a4`, same tree, `0` behind the target.
- Master landing: `995eafe3bc`, first parent the previous fork tip `4a7ade3b9e`, second parent the candidate, tree equal to the candidate; the ten paths the landing merge disagreed on were resolved to the candidate.

Preserved without intervention for the third consecutive cycle: Desktop packaging and branding, the `settings.update` seat, the WebSocket 1006 transport classification, the full-title header rule, the single shared `dsh-auth` cookie name, the `maxHeaderSize` cap, the deployed DeepSeek account and LLM base packages, the plugin-patch carrier, the update seat's semver precedence, and `linkDesktopPackages` in the sidecar, confirmed present in the rebuilt deploy.

## Alternatives considered

None was required. A delta made of diagnostics fixes, in files the fork does not adapt, needs a correct merge and nothing more — and that is the intended steady state of this procedure, not a diminished one.

## Consequences

Desktop proceeds to an independent `0.2.8` release on this base. Third-party plugin bundles need the exemption granted again for runtime `0.2.1-rc.5`; the usage companion keeps loading without one.

One observation about the local environment, not the tree: the compatibility check's summary changed this cycle from "2 plugins, 2 homes" to "1 plugin, 1 home", and investigating it showed the `.dsh` home now carries `dsh-codex-provider` v0.2.2, whose peer ranges satisfy this runtime, while `.dsh-deepdive-b` still carries v0.1.0 with peers pinned to `^0.1.0-rc.6`. Neither home has an exemption file, so the difference is the installed provider version. Recorded because a changed gate summary is normally the first sign of a regression, and here it was an environment update.

The documented upstream false positive is unchanged: `verify-repository-references` still flags `python/sdk/uv.lock:113` as a commit hash, on a file byte-identical to upstream's, where the flagged token is a PyPI file digest inside a package URL. The `plugin-compat` helper kept outside this repository also still implements the peers-only rule, while upstream's gate now reads a declared `engines.dsh` range as well.

## Testing

`pnpm run doc-sync` passes 42 of 43 gates, the exception being the false positive above; the documentation budget passed without condensation. `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests against the rebuilt `0.2.8` bundle and 9 of 9 Rust tests. A headless boot of the default `web` profile reaches readiness with no `failed to import` row and no pending row for the usage companion, and the compatibility check reports runtime `0.2.1-rc.5`. The `scripts` lane fails one load-sensitive spec that passes in isolation, and the `gui` lane keeps the three locale-dependent `ui-settings-account` assertions that already fail on this host.

## Environment note: the build sequence held a fourth time

Clean (361 paths), the gate orchestrator (`9 passed, 0 failed`), then the bundle: 29,392 files stamped `0.2.8`, the fork's sidecar marker present and the parked parent carrier absent, all on the first attempt.

The sequence is now the least interesting part of the procedure, which is the point. It exists because a tsdown step reached before the orchestrator's artifact gates cannot resolve generated entries, and because incremental outputs from a previous generation report that generation's imports as errors in the new code. Both are ordering facts about this repository's build, not opinions about how it should work.
