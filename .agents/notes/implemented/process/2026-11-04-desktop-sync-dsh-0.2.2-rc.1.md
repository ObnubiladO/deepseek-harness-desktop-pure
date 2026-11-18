# Agent Note: Desktop synchronization with dsh-v0.2.2-rc.1

Status: implemented

English | [中文](2026-11-04-desktop-sync-dsh-0.2.2-rc.1.zh.md)

## Problem

The fork shipped `0.2.8` on `dsh-v0.2.1-rc.5`. Upstream then published `dsh-v0.2.2-rc.1`, a **new minor line**: 2,623 commits and 8,120 changed files, with a net removal of roughly 324,000 lines. It is the largest and most structural delta this fork has absorbed, and the first that changes upstream's minor version rather than its patch.

Three of the fork's adaptation points were in the blast radius this time. `packages/host/webserver/src/index.ts` was rewritten (+197/−43). The settings shell and its registration were restructured. And the fork's own `session-log-export` locale patch turned out to be incomplete.

Unrelated work was also present in the working tree before the merge: five uncommitted `llm-pi-ai` files implementing `requestImageMaxDimension`. It was preserved with `git stash` rather than committed or discarded, since it is not this cycle's work to land.

## Decision

Integrate `dsh-v0.2.2-rc.1` at `66491b05e3f05ad35bcdd4f6cd7ed26041d9e3db` from fork tip `e0b98b517b` through a reviewed manual merge and an equal-tree upstream-rooted candidate, and release it as Desktop **0.3.0** — a minor bump, chosen by the repository owner, because a new upstream minor with a third of the tree removed is not a patch-level event.

- Manual integration: `9c988732f4` (`integrate/dsh-0.2.2-rc.1`), tree `51cfb85ba0`; seven conflicts.
- Upstream-rooted candidate: `1e55cb7b9c`, same tree, `0` behind the target.
- Master landing: `343a3e2871`, first parent the previous fork tip `e0b98b517b`, second parent the candidate, tree equal to the candidate; the twenty-three paths the landing merge disagreed on were resolved to the candidate.

Resolutions, each by reading both sides' intent:

- **The header cap survived without intervention.** Upstream rewrote the listener; the fork's `createServer({ maxHeaderSize: 64 * 1024 }, listener)` insertion auto-merged and remains at line 566. Nothing needed re-deriving.
- **The settings registration** kept both sides: the fork's `settings.update` seat was re-inserted into upstream's restructured `ctx.slots.register`, which now also declares `settings.section.icon`. The `SettingsRoot.tsx` conflict was docstring-only, and upstream's responsive-layout facts now stand there.
- **The `session-log-export` locale patch was completed rather than relaxed.** The fork had added `dialog.savedTitle` and `dialog.savedDescription` to `zh` and `en` only. While the other dictionaries were untyped that gap was invisible; upstream's restructure type-checks each dictionary against the schema, so the build failed with `TS2741`/`TS2739` naming exactly the two keys. The fix adds real translations to `ja`, `es`, `fr`, `de`, `ru` and `pt` — not an `any` cast and not a weakened type.

Preserved: Desktop packaging and branding, the `settings.update` seat, the WebSocket 1006 transport classification, the full-title header rule, the single shared `dsh-auth` cookie name, the `maxHeaderSize` cap, the deployed DeepSeek account and LLM base packages, the plugin-patch carrier, the update seat's semver precedence, and `linkDesktopPackages` in the sidecar — confirmed present in the rebuilt 31,972-file deploy.

## Alternatives considered

Relaxing the locale type was rejected: the type had found a real inconsistency in the fork's own patch, and silencing it would have shipped seven languages missing two keys that the Desktop save-dialog flow actually renders. Committing the `llm-pi-ai` work into this sync was rejected for the same reason the parent project's Desktop delta was parked two cycles ago — a synchronization should carry one line of change, and someone else's unfinished feature is not it. Taking upstream's docstring wholesale in `SettingsRoot.tsx` was accepted, because the fork's additional sentence did not fit upstream's rewritten paragraphs and the seat is documented by the slot registration itself.

## Consequences

Desktop proceeds to an independent `0.3.0` release on this base. Third-party plugin bundles need the exemption granted again for runtime `0.2.2-rc.1`; the usage companion keeps loading without one.

One long-standing annoyance is gone: `verify-repository-references` no longer flags `python/sdk/uv.lock`, so the false positive documented in the `0.2.4` through `0.2.8` cycles has been fixed upstream. The documentation gates now pass 43 of 43 for the first time in this series.

The `llm-pi-ai` work remains in `git stash@{0}` and should be restored deliberately, after deciding whether it still applies to the restructured package.

## Testing

`pnpm run doc-sync` passes **43 of 43** gates, including the pairing gate after correcting two language-switcher links in a previous cycle's note that pointed at a filename that does not exist. `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors) across the restructured tree. The build orchestrator reports `10 passed, 0 failed`, and the Desktop suite passes 30 of 30 Node tests against the rebuilt `0.3.0` bundle plus 9 of 9 Rust tests. A headless boot of the default `web` profile reaches readiness with no `failed to import` row and no pending row for the usage companion, and the compatibility check reports runtime `0.2.2-rc.1`. The `scripts` lane fails one load-sensitive spec that passes in isolation, and the `gui` lane keeps the three locale-dependent `ui-settings-account` assertions that already fail on this host.

## Environment note: three self-inflicted errors, and the measuring problem behind two of them

This cycle produced more mistakes than any previous one, and only one of them was in the code.

**A cp1252 write corrupted `AGENTS.md`.** PowerShell's `Set-Content` without `-Encoding` writes the system codepage, so the file's em-dashes became single bytes that are invalid UTF-8. The read tool caught it by refusing the file. The repair restored the merged blob from the index and re-applied the edit with an explicit UTF-8 writer, and the Chinese README was verified byte-wise to be unaffected.

**A replacement dropped lines it was meant to preserve.** The first locale insertion replaced each `dialog.successDescription` line instead of adding after it, deleting the very key the type then reported missing. The type checker's message was precise and correct.

**Non-ASCII literals cannot travel through a `pwsh` command string.** They arrived mojibake (`Ã©tÃ©`), so the translations were moved into a Node script written as a UTF-8 file, after which they landed correctly on the first attempt.

Behind two of those, a measurement problem was doing more damage than the bug: `Get-Content` without `-Encoding` reads ANSI, so **valid UTF-8 Chinese displays as mojibake**, and my earlier diagnostic had already produced one false alarm that way. Two of my checks in this cycle were wrong in exactly this fashion — the "all staged files are invalid" alarm, where a `git show > file` redirect wrote UTF-16, and the display that made correct notes look corrupted. The lesson from earlier cycles applies to investigation itself: when a check says something alarming, verify the checker before trusting the alarm.
