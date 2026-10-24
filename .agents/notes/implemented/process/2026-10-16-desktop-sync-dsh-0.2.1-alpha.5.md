# Agent Note: Desktop synchronization with dsh-v0.2.1-alpha.5

Status: implemented

English | [中文](2026-10-16-desktop-sync-dsh-0.2.1-alpha.5.zh.md)

## Problem

The fork shipped `0.2.4` on `dsh-v0.2.1-alpha.3`. Upstream then published `dsh-v0.2.1-alpha.5`: 125 commits and 1,045 changed files.

The delta is small but not empty in the places that matter. None of the files carrying this fork's adaptations moved — `browser-auth.ts`, the webserver listener, the profile resolution service, the settings service, the sidecar and the runtime manifest are all untouched in this range — so for the first time in four cycles the single shared browser-session cookie name needed no re-application. One file the exemption workflow depends on did move: `packages/boot/app-boot/src/plugin-compatibility.ts` gained engine support, evaluating a declared `engines.dsh` range in addition to dsh peers, renaming the reported field from `peers` to `requirements`, and adding an `includePrerelease`-aware `satisfies()` helper.

## Decision

Integrate `dsh-v0.2.1-alpha.5` at `1517a4dbca0a2789ff1d41ba439600f8547d23fa` from fork tip `24c5c6d157` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `0aad33a233` (`integrate/dsh-v0.2.1-alpha.5`), tree `88121de898`; **no conflicts**.
- Upstream-rooted candidate: `2230ad2252`, same tree, `0` behind the target.
- Master landing: `aa0b113791`, first parent the previous fork tip `24c5c6d157`, second parent the candidate, tree equal to the candidate; the ten paths the landing merge disagreed on were resolved to the candidate.

Preserved without intervention, because the merge had nothing to resolve: Desktop packaging and branding, the `settings.update` seat, the WebSocket 1006 transport classification, the full-title header rule, the single shared `dsh-auth` cookie name, the `maxHeaderSize` cap, the deployed DeepSeek account and LLM base packages, the plugin-patch carrier, the update seat's semver precedence, and `linkDesktopPackages` in the sidecar — the last confirmed present in the rebuilt deploy.

## Alternatives considered

No resolution decision was needed this cycle, which is itself the point: the fork's adaptations survived because they live in files upstream did not touch, not because anyone re-derived them. Adopting upstream's narrower reported field name (`requirements`) in the fork's tooling was deferred rather than done mid-sync, since the exemption workflow keys off peers and changing it here would mix a tooling migration into a synchronization.

## Consequences

Desktop proceeds to an independent `0.2.5` release on this base. Third-party plugin bundles again need a fresh exemption for `0.2.1-alpha.5`; the usage companion keeps loading without one.

Two carry-overs are worth naming. The documented upstream false positive is unchanged: `verify-repository-references` still flags `python/sdk/uv.lock:113` as a commit hash, on a file byte-identical to upstream's, where the flagged token is a PyPI file digest inside a package URL. And the `plugin-compat` helper kept outside this repository still implements the peers-only rule, so with upstream now treating `engines.dsh` as a requirement as well, that helper can under-report what the real gate would skip; it should be updated to match.

## Testing

`pnpm run doc-sync` passes 42 of 43 gates, the exception being the false positive above; the documentation budget passed without condensation. `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests against the rebuilt `0.2.5` bundle and 9 of 9 Rust tests. A headless boot of the default `web` profile reaches readiness with no `failed to import` row and no pending row for the usage companion, and the compatibility check reports runtime `0.2.1-alpha.5` with the provider skipped as expected. The `scripts` lane fails one load-sensitive spec that passes in isolation, and the `gui` lane keeps the three locale-dependent `ui-settings-account` assertions that already fail on this host.

## Environment note: the build sequence held

The previous cycle established the procedure after two failures: clean the workspace, run the gate orchestrator once, then prepare the bundle. This cycle it succeeded on the first attempt — 353 stale paths removed, `9 passed, 0 failed` from the orchestrator, and a 29,352-file deploy stamped `0.2.5` with the fork's sidecar marker and no parent carrier.

The value of the sequence is that it removes an ordering dependency rather than working around it. The orchestrator's gates generate entries such as `lib/types/apply-injections.js`; a tsdown step reached earlier cannot resolve them, and the resulting error names entry modules that exist nowhere in the tree, which sends a reader looking for a missing file instead of a missing step.
