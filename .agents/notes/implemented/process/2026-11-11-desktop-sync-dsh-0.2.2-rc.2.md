# Agent Note: Desktop synchronization with dsh-v0.2.2-rc.2

Status: implemented

English | [中文](2026-11-11-desktop-sync-dsh-0.2.2-rc.2.zh.md)

## Problem

The fork shipped `0.3.0` on `dsh-v0.2.2-rc.1`. Upstream then published `dsh-v0.2.2-rc.2`: 1,568 commits and 4,645 changed files (+160,844/−58,399) on the same minor line.

Three changes reached fork-owned behavior. The Session export dialog became a root overlay that shows one export at a time in initiation order, which added an `order` field to every published state and a guard that a disposed controller starts no save. The settings launcher's `openSettings` gained section targeting. And the CLI launcher stopped importing the `profile-boot` facade directly, which the fork's runtime builder had parsed to find it.

The deploy was also incomplete. This release introduces `@deepseek-ai/dsh-error` as a peer of ten deployed packages, and two older peers had been missing since `rc.1`: `dsh-util-workspace-path`, imported by `dsh-api-session-controller`, and `dsh-sdk-protocol`, imported by `dsh-sdk-jsonrpc-server`. All three are real runtime imports that failed with `ERR_MODULE_NOT_FOUND` when loaded from the deploy; only `dsh-error` was reachable at boot.

## Decision

Integrate `dsh-v0.2.2-rc.2` at `ddac96760b6edf8fa0fe17cbdcf0b512f4c12b2c` from fork tip `1c589188d5` through a reviewed manual merge and an equal-tree upstream-rooted candidate, and release it as Desktop **0.3.1**: a patch, because the Desktop minor moves only when the upstream line does.

- Manual integration: `c5d166da7f`, tree `6aae8b2406`; six conflicts.
- Upstream-rooted candidate: `185146e86c`, same tree, `0` behind the target.
- Master landing: `19a3214dc6`, first parent the previous fork tip `1c589188d5`, second parent the candidate, tree equal to the candidate; the nineteen paths the landing merge disagreed on were resolved to the candidate. The fork stands 127 commits ahead of upstream and 0 behind.

Resolutions, each reconciling both sides' intent:

- **`SettingsRoot.tsx`** takes upstream's section-aware `openSettings` and keeps the fork's `triggerColumn` wrapper with its `settings.update` render, the Desktop update seat.
- **`session-log-export`** takes upstream's FIFO overlay and per-operation `order` and keeps the fork's awaited native save carrier, `cancelled` status, and `successMode`. Upstream's no-save-after-disposal guard is extended past the awaited native save, because a native dialog can outlive disposal and the controller must publish nothing afterwards; the post-await check carries upstream's own lint idiom for a narrowing TypeScript cannot see across `await`.
- **Both export specs** start from upstream's rewritten suites, including their eight new tests, and add the fork's native-save tests, a disposal test for the extended guard (it fails when the guard is removed), and a test that a cancelled native save leaves no modal behind upstream's FIFO.
- **`desktop/runtime/package.json`** declares all three missing peers, and `desktop/scripts/finalize-runtime.mjs` now fails the deploy when any deployed `@deepseek-ai` package cannot resolve a non-optional `@deepseek-ai` dependency or peer within the deploy. It reports 339 packages resolved; with `dsh-error` hidden it names the package and its ten dependents.
- **`desktop/scripts/build-runtime.mjs`** reads the stable `lib/profile-boot.js` facade and fails fast if it stops exporting `runProfile`.
- **`desktop/scripts/verify-merge-survival.mjs`** is new: for files both sides changed, it lists lines either side added that are absent from the working tree. The sync skill now requires it before the integration commit.

The `AGENTS.md` completion checks moved verbatim into the sync skill to stay within the documentation budget; the remaining rules keep their original wording.

## Alternatives considered

Taking either side of a conflicted file wholesale was rejected after it had already happened once in this cycle and lost work on both sides. Relaxing the lint rule for the post-await check, or rewriting the check to dodge TypeScript's narrowing, was rejected in favor of the disable comment upstream already uses for the same situation. Leaving the two older missing peers for a later cycle was rejected because the closure gate cannot be enforced while known gaps remain. Renaming the fork's `@deepseek-ai/dsh-desktop` package to end its collision with upstream's `apps/desktop` was deferred: it is pre-existing, it has not affected a release, and it touches root scripts and CI, which deserves its own decision.

## Consequences

Desktop proceeds to an independent `0.3.1` release on this base. Third-party plugin bundles need the exemption granted again for runtime `0.2.2-rc.2` where their own ranges do not cover it.

The release workflow's macOS job moved from `macos-14` to `macos-latest`, upstream's own label for Apple Silicon: GitHub retired the `macos-14` image during this cycle, and the first release run was refused before a runner was assigned.

`0.3.0` users carry the two older peer gaps latently. Neither is reachable in normal use: the session controller's browser bundle inlines the import, and DeepDive's `web` profile does not start the SDK JSON-RPC server. `0.3.1` closes both, and the new gate keeps an unresolvable peer from shipping again.

The `@deepseek-ai/dsh-desktop` name collision remains: `desktop/` and upstream's `apps/desktop` share the name, so `pnpm --filter @deepseek-ai/dsh-desktop` matches both packages and `scripts/local-bundle-registry.spec.ts` fails on the duplicate.

## Testing

The build orchestrator passes 10 of 10 gates. The deploy holds 40,748 files stamped `0.3.1` with the kernel and the fork's sidecar marker present. The Desktop suite passes 31 of 31 Node tests, including the sidecar smoke test that exercises the `profile-boot` bridge, and 9 of 9 Rust tests. `pnpm run doc-sync` passes 43 of 43 gates, `pnpm run typecheck` 5 of 5, and `pnpm run lint` reports no errors and one warning in upstream's unmodified `client-ui-cot-translation`. The two touched packages pass 245 of 245. A headless boot of the default `web` profile reaches readiness, and the compatibility check reports runtime `0.2.2-rc.2`.

The `gui` lane passes 13,622 tests and fails exactly the three known locale-dependent `ui-settings-account` assertions. The `scripts` lane passes 3,773 tests and fails six in three files, all of which also failed in `0.3.0`: three need PowerShell 7 (`pwsh`), which this host lacks; two expect an unquoted Node path, while this host's Node lives under `C:\Program Files`; one is the name collision above.

## Environment note: losses that tests written by one side cannot see

The first resolution pass resolved three of the six conflicted files by taking one side wholesale. `SettingsRoot.tsx` took upstream's version and silently dropped the Desktop update seat; both export specs took the fork's versions and silently dropped upstream's eight new tests. The package's tests then passed 123 of 123, a result that said nothing about upstream's new behavior because none of upstream's new tests remained in the suite.

The checks that should have caught it were summarized instead of read. The `gui` lane reported five failures rather than the known three, and the two extra were `SettingsRoot trigger` tests asserting the update seat; they were filed as the known failures by exit code. A lint failure was explained as a rejection-path problem in the merged controller when its log showed eleven indentation errors and two dead optional chains. And `0.3.0`'s `scripts` lane had eleven failures in six files while its report described one flaky spec.

Three changes keep this from recurring: `verify-merge-survival.mjs` makes a dropped side visible in seconds, and its negative control flags exactly the two lost lines of the update seat; the sync skill requires judging a lane with known failures by its failure list; and the deploy gate turns a missing peer into a build failure that names its own fix. That gate covers a different failure from the `0.2.2` and `0.2.3` deploy breaks, where the fork still declared packages upstream had deleted; pnpm already rejects that case loudly, while a missing peer fails silently until something imports it.
