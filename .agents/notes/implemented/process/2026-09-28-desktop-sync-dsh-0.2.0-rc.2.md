# Agent Note: Desktop synchronization with dsh-v0.2.0-rc.2

Status: implemented

English | [中文](2026-09-28-desktop-sync-dsh-0.2.0-rc.2.zh.md)

## Problem

The fork shipped `0.2.0` on `dsh-v0.2.0-rc.1`. Upstream then published `dsh-v0.2.0-rc.2`: 187 commits and 1,022 changed files, 15 of them touched on both sides. The release moves no fork adaptation point — the loopback cookie name, the `maxHeaderSize` cap, the profile resolution, the settings controller, the settings shell, the plugin compatibility gate and the typert protocol are all identical to the previous tag — but it does change `packages/llm/llm-pi-ai`, which matters because `dsh-codex-provider` writes that plugin's settings entry. It also adds a documentation gate, so the gate count moves from 42 to 43.

## Decision

Integrate `dsh-v0.2.0-rc.2` at `639ed015397290b3745d163aafe02ffee4aa3f84` from fork tip `b895e35ad2` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `129b8982d5` (`integrate/dsh-0.2.0-rc.2`), tree `9d5d3f571c`; seven conflicts, every one of them documentation bookkeeping.
- Upstream-rooted candidate: `182ca05c16` on the verified tag commit, same tree, `0` behind the target.
- Master landing: `d29c13ffa1`, first parent the previous fork tip `b895e35ad2`, second parent the candidate, tree equal to the candidate; the thirteen paths the landing merge disagreed on were resolved to the candidate.

Resolutions and adaptations:

- The root `README.zh.md` and `README.i18n.yaml`, which this fork deletes, stay deleted even though upstream modified both; the fork's own README trio and its pairing record cover that surface.
- The root `README.md` keeps the fork's versioning-and-releases bullets and gains upstream's three community bullets under their own `## Community and support` heading, which is where upstream keeps them.
- `packages/llm/llm-pi-ai/README.md` and its Chinese pair keep the fork's WebSocket 1006 transport-classification paragraph and take upstream's reworded replay paragraph. The pairing record was re-recorded from the resolved content, and a first attempt left the record stale until `verify-translation-pairing --write` regenerated it.
- `scripts/doc-budgets.manifest.json` keeps the fork's `AGENTS.md` ceiling, and the merged `AGENTS.md` was condensed back under it — the cycle line lost four words — rather than raising the ceiling, which is what `docs/AGENTS.md` asks for. The first integration attempt failed exactly this gate, which is the gate working.
- `packages/llm/llm-pi-ai/src` changed in this release, in its catalog compatibility gates and replay handling. The audit that this fork owes the pinned `dsh-codex-provider` covers that package because the plugin writes the `llm-pi-ai` entry: the `providers` config shape the plugin writes is untouched, and the changed code is model-compatibility bookkeeping the plugin never reads.

Preserved: Desktop packaging and branding, the `settings.update` seat, the fork's WebSocket 1006 transport classification, the full-title header rule, the fixed `dsh-auth` cookie name with its startup sweep, the deployed DeepSeek account and LLM base packages, the plugin-patch carrier, and the update seat's semver precedence.

## Version choice

The Desktop version takes a patch increment to `0.2.1` rather than a `0.2.0-1` prerelease suffix, because the fork's own update seat compares versions by semver precedence: `isNewer("0.2.0-1", "0.2.0")` is false — a prerelease ranks below its release — so a `0.2.0-1` build would never be offered to anyone already on `0.2.0`. The same rule keeps `0.2.1 → 0.2.2` working.

## Third-party plugin status

`dsh 0.2.0-rc.2` invalidates the exact-version exemption granted for `0.2.0-rc.1`: the gate is scoped to one plugin version on one runtime version, so `dsh-codex-provider@0.1.0` is skipped again on this runtime until a fresh exemption is granted. A headless boot of the shipped runtime confirms it — `skipping profile bundle "dsh-codex-provider"` — and also confirms the previous cycle's companion fix: `dsh-codex-usage@0.1.2-preview.9` stays active in the same boot instead of going pending, which is the whole point of dropping that phantom injection. The four surfaces the audit covers are unchanged in this release apart from the catalog internals noted above.

## Alternatives considered

Raising the `AGENTS.md` budget instead of condensing was rejected because the documentation standard asks for relocation or condensation first, and two words over a ceiling is not a justification. Keeping upstream's deleted-README edits was rejected for the same reason the fork deleted them in the first place. Publishing `0.2.0-1` as literally requested was rejected after checking the update seat's comparison code: it would have silently stranded every user already on `0.2.0`. Re-granting the plugin exemption inside the synchronization was rejected because that decision belongs to the checklist's staged procedure — audit, functional pass, then grant per home.

## Consequences

Desktop proceeds to an independent `0.2.1` release on this base, and the version line keeps the in-app updater honest. Owners of third-party plugin bundles must grant a fresh exemption for `0.2.0-rc.2` or update those plugins; the companion now degrades visibly instead of disappearing. The multi-window feature remains fork-local and is not part of this synchronization.

## Testing

`pnpm run doc-sync` passes 43 of 43 gates (upstream added one, and the doc-budget gate caught the merged `AGENTS.md` before the fix). `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests against the rebuilt `0.2.1` bundle and 9 of 9 Rust tests. A headless boot of the default `web` profile reaches readiness, with no `failed to import` row. The `scripts` lane fails one load-sensitive spec that passes alone, and the `gui` lane keeps the three locale-dependent `ui-settings-account` assertions that already fail on this host (9,506 of 9,510 pass).

## Environment note: repository recovery

The machine crashed while this cycle's landing commit was being written. The damage was confined to Git's own bookkeeping: `refs/heads/master` came back zero-filled, `.git/index` was corrupt, and the working tree was left partially zero-filled. Every object survived, including all three cycle commits, so recovery was mechanical — record the known-good SHAs, restore `refs/heads/master` to the landing commit, delete the index, and `git reset --hard`. `git fsck --connectivity-only` is clean afterwards and `git update-index --really-refresh` reports no modified files. Nothing outside the repository was touched: both harness homes, their profiles and exemption records, the session logs, the installed application, and the staged installers all verified intact by header and content checks. Two lessons worth keeping: never pipe a long `git reset --hard` into a consumer that closes the pipe early, and after any crash verify what actually survived instead of trusting the last known state.
