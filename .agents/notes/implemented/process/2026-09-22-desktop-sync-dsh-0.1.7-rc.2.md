# Agent Note: Desktop synchronization with dsh-v0.1.7-rc.2

Status: implemented

English | [中文](2026-09-22-desktop-sync-dsh-0.1.7-rc.2.zh.md)

## Problem

The fork shipped `0.1.19` on `dsh-v0.1.7-alpha.2`. Upstream then published `dsh-v0.1.7-rc.2`: 502 commits and 3,771 changed files, 27 of them touched on both sides — the largest synchronization since the fork was created. Two upstream changes landed in code the fork adapts: the settings shell gained a shell store with a registerable `settings.open` shortcut command, reworking the trigger row around `Tooltip` and `actions.open`, and the bilingual consistency records moved from whole-file git blob hashes to per-section 16-hex digests.

## Decision

Integrate `dsh-v0.1.7-rc.2` at `477b4f420553e8a52c2fbccc464d7561b239c443` from fork tip `de32a2f9a7` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `da51b80419` (`integrate/dsh-0.1.7-rc.2`), tree `086ecab2ef`; eleven conflicts, two of them source files.
- Upstream-rooted candidate: `a2abfb3dfe` on the verified tag commit, same tree, `0` behind the target.
- Master landing: `ba6cfa93c5`, first parent the previous fork tip `de32a2f9a7`, second parent the candidate, tree equal to the candidate; the forty-nine paths the landing merge disagreed on were resolved to the candidate.

Resolutions and adaptations:

- `packages/client/ui-settings-general/src/client/index.ts` resolves to upstream's block: the shell store, the instance-scoped store shim, the `settings.open` shortcut command with its default key bindings and modal handling, and the disposer that tears both down. The fork's `settings.update` seat is re-added to the shell's children map in its previous position, which is what keeps the Desktop update row registered.
- `packages/client/ui-settings-general/src/client/SettingsRoot.tsx` resolves to upstream's reworked trigger row — `Tooltip` fallback, `actions.open`, `shortcut` hints, `settingsOpen` — wrapped in the fork's `triggerColumn` div so the update seat still renders below the trigger. The CSS module already carries that class from the fork side, so no style change was needed.
- All 26 fork-owned bilingual records were re-recorded in the new per-section format with `pnpm run verify-translation-pairing --write --all`, which is the migration path the pairing tool provides. The nine records that conflicted during the merge were re-recorded as part of that pass.

Preserved: Desktop packaging and branding, the `settings.update` seat, the fork's WebSocket 1006 transport classification, the full-title header rule, the fixed `dsh-auth` cookie name with its startup sweep, the deployed DeepSeek account package, and the plugin-patch carrier. None of the other adaptation points changed upstream: the cookie name, the `maxHeaderSize` option, the profile-resolution service, the settings controller and the typert protocol are identical between alpha.2 and rc.2.

## Alternatives considered

Dropping the fork's `settings.update` seat to take upstream's shell verbatim was rejected: the seat is the Desktop update row, and the whole point of the resolution is to keep it while adopting upstream's store, shortcut and tooltip work. Keeping the fork's older trigger row and ignoring upstream's rework was rejected for the opposite reason — it would forfeit the shortcut hints and the `aria-keyshortcuts` wiring. Hand-migrating the 26 records was rejected in favor of the tool's own bulk writer, which derives the digests from the current content. Resolving the landing conflicts by hand a second time was rejected because the landing tree must equal the validated candidate.

## Consequences

Desktop proceeds to an independent `0.1.20` release on this base. The two resolved files sit in an area upstream is actively reworking, so the next synchronization must re-check them; the shell now owns a store and a command registration, which is more surface than the previous plain slot registration. The multi-window feature remains fork-local and is not part of this synchronization; it is rebased onto this base separately.

## Testing

`pnpm run doc-sync` passes 42 of 42 gates. `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests against the rebuilt `0.1.20` bundle and 9 of 9 Rust tests. The resolved settings shell package passes 76 of 76 tests in 7 files, which is the suite that asserts the seat and the shell contract. The `scripts` lane fails one load-sensitive spec that passes 8 of 8 when run alone; the `gui` lane keeps the three locale-dependent `ui-settings-account` balance assertions that already fail on this host (9,198 of 9,202 pass).

The pairing migration is verified by the gate itself: before the bulk re-record the gate failed with 23 malformed records, and after it passes with no violations.
