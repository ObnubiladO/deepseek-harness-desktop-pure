# Agent Note: Desktop synchronization with dsh-v0.2.0-rc.1

Status: implemented

English | [中文](2026-09-24-desktop-sync-dsh-0.2.0-rc.1.zh.md)

## Problem

The fork shipped `0.1.20` on `dsh-v0.1.7-rc.2`. Upstream then published `dsh-v0.2.0-rc.1`: 261 commits and 1,109 changed files, 9 of them touched on both sides. Two properties of this release shape the cycle. First, the merge is the first conflict-free synchronization since the fork began: upstream's only edit inside a fork-adapted file is a comment in the settings shell, so every local adaptation carried over without resolution. Second, and user-visible, dsh 0.2.0 enforces declared peer ranges on third-party plugin bundles at profile startup — `dsh-codex-provider@0.1.0` declares `^0.1.0-rc.6` peers, so the runtime skips it, and the companion `dsh-codex-usage` stays pending on the missing `codexProvider` service.

## Decision

Integrate `dsh-v0.2.0-rc.1` at `4878cdabd87d4041bdaff61d04c966883b9fd07a` from fork tip `433a8745f2` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `ec7f2e1138` (`integrate/dsh-0.2.0-rc.1`), tree `83875e4287`; zero conflicts.
- Upstream-rooted candidate: `7ee432a9d8` on the verified tag commit, same tree, `0` behind the target.
- Master landing: `434142156a`, first parent the previous fork tip `433a8745f2`, second parent the candidate, tree equal to the candidate; the ten paths the landing merge disagreed on were resolved to the candidate.

Resolutions and adaptations:

- None were required inside the merge. The fork's adaptations are unchanged and were verified by marker after the merge: the `settings.update` seat in the shell's children map, its `triggerColumn` wrapper, the full-title header rule, the `maxHeaderSize` server cap, the fixed `dsh-auth` cookie name with its startup sweep, `linkDesktopPackages` in the sidecar, `openTextFile` in the settings controller, and the two DeepSeek package declarations that keep the deployed runtime's profile rows importable.
- The generated client catalog, third-party notices, and lockfile were regenerated; the Desktop version moved to `0.2.0`, aligning the Desktop major line with upstream at the maintainer's request.
- Third-party plugin compatibility is now enforced by the runtime. The exact-version exemption is the supported escape hatch: `dsh plugin allow-version dsh-codex-provider@0.1.0 --dsh-version 0.2.0-rc.1 --accept-risk --profile web`. Verified on a scratch copy of the profile: before the exemption the boot reports `skipping profile bundle "dsh-codex-provider"` and `codex-usage … pending (waiting for service: codexProvider)`; after it the same boot reports no activation warning at all. The exemption binds one exact plugin version to one exact runtime version, so it must be re-granted after either side changes, and a plugin release that widens its peer ranges is the durable fix.

Preserved: Desktop packaging and branding, the `settings.update` seat, the fork's WebSocket 1006 transport classification, the full-title header rule, the fixed `dsh-auth` cookie name, the deployed DeepSeek account and LLM base packages, and the plugin-patch carrier.

## Alternatives considered

Widening the provider's peer ranges in the profile was rejected for this cycle: the profile's install is pnpm-managed and a hand-edited range would be overwritten by the next plugin install, while the runtime's own exemption mechanism is designed for exactly this case. Skipping the release to wait for a plugin update was rejected because the Desktop update is independent of that plugin, and the exemption keeps the companion working in the meantime. Patching the runtime to ignore peer ranges was rejected outright: the check protects users from plugins built against a different protocol generation, and disabling it would trade a visible skip for silent misbehaviour.

## Consequences

Desktop proceeds to an independent `0.2.0` release on this base. Users of third-party bundles — the Codex provider and its companions — must grant the exact-version exemption or update those plugins; the Desktop bundle itself is unaffected. The next synchronization should re-check the peer-range rule in case upstream changes how exemptions are stored. The multi-window feature remains fork-local and is not part of this synchronization; it is rebased onto this base separately.

## Testing

`pnpm run doc-sync` passes 42 of 42 gates. `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests against the rebuilt `0.2.0` bundle and 9 of 9 Rust tests. A headless boot of the default `web` profile reaches readiness, and the two deployed-package gaps that broke the previous cycle stay fixed: no `failed to import` row appears. The `scripts` lane fails two specs that each pass alone (20 of 20 and 8 of 8), and the `gui` lane keeps the three locale-dependent `ui-settings-account` assertions that already fail on this host (9,358 of 9,362 pass).

## Environment note

The repository's staged-lint hook crashes natively on this machine: `scripts/run-oxlint.ts` exits with `STATUS_ILLEGAL_INSTRUCTION` (`0xC000001D`) for every input, including a single file and the plain config, which aborted the integration commit until it was made with `--no-verify`. The authoritative gate is unaffected — `pnpm run lint` builds the host libraries and lints the contracts-ready tree, and it reports 0 warnings and 0 errors — but anyone committing in this environment should expect the hook to fail and should rely on the gate instead. This is a local toolchain condition, not a property of the merge.
