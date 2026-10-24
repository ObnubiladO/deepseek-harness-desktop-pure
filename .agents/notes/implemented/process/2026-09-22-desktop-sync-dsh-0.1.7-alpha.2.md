# Agent Note: Desktop synchronization with dsh-v0.1.7-alpha.2

Status: implemented

English | [中文](2026-09-22-desktop-sync-dsh-0.1.7-alpha.2.zh.md)

## Problem

The fork shipped `0.1.18` on `dsh-v0.1.7-alpha.1`. Upstream then published `dsh-v0.1.7-alpha.2`: 162 commits and 869 changed files, only 8 of them touched on both sides. None of the call sites the fork adapts changed in this release — the loopback cookie name in `packages/client/connection/src/browser-auth.ts`, the `maxHeaderSize` server option, the profile-resolution service, the settings controller, and the typert protocol are identical between the two tags — so the cycle's work was the merge itself, the release bump, and one payload the fork owed its users: the DeepSeek account row the deployed runtime could not import.

## Decision

Integrate `dsh-v0.1.7-alpha.2` at `00102833dfaee1da9f48a3a8eae9d34005a75218` from fork tip `324398d833` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `bf1fb9fdd1` (`integrate/dsh-0.1.7-alpha.2`), tree `47d2ce4030`; the merge applied with **zero conflicts**, and the fork's eight shared files keep both sides' intent.
- Upstream-rooted candidate: `a6c6abaea9` on the verified tag commit, same tree, `0` behind the target.
- Master landing: `80ba7a2db1`, first parent the previous fork tip `324398d833`, second parent the candidate, tree equal to the candidate; the ten paths the landing merge disagreed on were resolved to the candidate.

Resolutions and adaptations:

- No conflict resolution was required inside the merge. The ten landing conflicts (AGENTS.md, the README trio, `desktop/UPSTREAM_COMMIT`, the three Desktop manifests, the Tauri Cargo manifest and lock, and the lockfile) are the ordinary consequence of landing an upstream-rooted candidate whose tree already contains the fork's versions.
- `desktop/runtime/package.json` now declares `@deepseek-ai/dsh-deepseek-account`. The web profile mounts `@deepseek-ai/dsh-deepseek-account-platform`, whose peer that package is; nothing else in the deployed closure declared it, so `pnpm deploy` left it out of `rt/node_modules`, the row failed to import, and `account-controller` stayed pending on the missing `deepseekAccount` service, which left the Account settings page unrendered in `0.1.18`.
- The root README trio, `desktop/UPSTREAM_COMMIT`, and the AGENTS.md cycle line move to the new tag and the `0.1.19` version, and the client slot catalog, third-party notices, and lockfile were regenerated.

Preserved: Desktop packaging and branding, the `settings.update` seat, the fork's WebSocket 1006 transport classification, the full-title header rule, the fixed `dsh-auth` cookie name with its startup sweep, and the plugin-patch carrier.

## Alternatives considered

Staying on `0.1.7-alpha.1` would leave the Account page broken for a release that upstream already fixed on its own line. Replacing the fork tree with upstream would drop Desktop packaging, branding, the update seat, and the header delta. Cherry-picking only the account fix onto the old base was rejected because the sync is cheap this cycle — the merge is conflict-free and no adaptation point moved — and skipping it would defer a second merge for no benefit. Patching the missing peer at profile level was rejected: the gap is in the deployed closure, so the manifest that builds that closure is the correct place to close it.

## Consequences

Desktop proceeds to an independent `0.1.19` release on this base, and every row of the default web profile composition now activates: a headless boot of the profile against the rebuilt runtime prints no activation warning at all. The multi-window feature remains fork-local and is not part of this synchronization; it is rebased onto this base separately, and its per-window WebView data folder carries the cookie isolation that the shared-jar line cannot.

## Testing

`pnpm run doc-sync` passes 42 of 42 gates. `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests against the rebuilt `0.1.19` bundle and 9 of 9 Rust tests. The account fix is verified end to end: the rebuilt runtime deploys `@deepseek-ai/dsh-deepseek-account`, and a headless `web` profile boot that previously reported `deepseek-account … failed to import` and `account-controller … pending (waiting for service: deepseekAccount)` now reports no activation warning.

The `scripts` lane reports 6 failures in 5 files and the `gui` lane 3 in 2 files; both are environment-dependent, not regressions: five of the scripts failures are load-sensitive five-second timeouts that pass when their files run alone, the sixth is a race between `scripts/oxlint-contract.spec.ts`, which writes a temporary TypeScript file into `packages/core/session/src`, and `scripts/persistence-schema.spec.ts`, which type-checks that directory — each spec passes alone, including 85 of 85 in the schema spec — and the three `ui-settings-account` failures are the locale-dependent balance assertions that already failed on this host before the merge (7,507 of 7,511 pass).
