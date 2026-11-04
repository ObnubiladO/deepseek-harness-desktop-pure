# Agent Note: Desktop synchronization with dsh-v0.2.1-alpha.1

Status: implemented

English | [中文](2026-10-08-desktop-sync-dsh-0.2.1-alpha.1.zh.md)

## Problem

The fork shipped `0.2.1` on `dsh-v0.2.0-rc.2`. Upstream then published `dsh-v0.2.1-alpha.1`: 266 commits and 4,188 changed files, which also moved one of the fork's adaptation points — the profile resolution service gained a `ProfileRuntimeResolution` class with a `refresh()` method and reworded retention rules — while the loopback cookie name, the header cap, the plugin compatibility gate, the settings controller, the settings shell and the typert protocol stayed identical.

This cycle also started against the wrong source: the parent Desktop project's `v0.1.20` release was named as the target before upstream was. That release sits on the same harness tag, so its harness content is identical to this synchronization, but it carries a Desktop delta of its own. That work was integrated, then deliberately split out when the source was corrected, and it now sits on `parked/parent-desktop-delta-0.2.2` for a cycle of its own.

## Decision

Integrate `dsh-v0.2.1-alpha.1` at `5badb15009ae1756c3afe0ae0cef1faafc290ccc` from fork tip `ef06ef1546` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `31c6ff592a` (`integrate/dsh-0.2.1-alpha.1`), tree `7614934a65`; two conflicts, both regenerable artifacts — the client slot catalog and one pairing record.
- Release line: the integration plus `d9d0ef58f5` (Desktop `0.2.2`, README trio, `UPSTREAM_COMMIT`, cycle line), `98a9f26c06` (the deploy fix) and `5147058c5d` (the `AGENTS.md` condensation), tree `e36fcb9cb9`.
- Upstream-rooted candidate: `88d9a775d6` on the verified tag commit, same tree, `0` behind the target.
- Master landing: `43cc4b52d0`, first parent the previous fork tip `ef06ef1546`, second parent the candidate, tree equal to the candidate; the twelve paths the landing merge disagreed on were resolved to the candidate.

The one code change beyond the merge, `98a9f26c06`, removes `@deepseek-ai/dsh-invariants` from `desktop/runtime/package.json`. This generation deletes both the package and its workspace path, so the declaration pointed at nothing, the lockfile kept a `link:` edge to a missing directory, and `pnpm deploy` refused with `ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY`. The deployed runtime was left at fifteen files with no `node_modules` at all.

Preserved: Desktop packaging and branding, the `settings.update` seat, the fork's WebSocket 1006 transport classification, the full-title header rule, the fixed `dsh-auth` cookie name with its startup sweep, the deployed DeepSeek account and LLM base packages, the plugin-patch carrier, the update seat's semver precedence, and `linkDesktopPackages` in the sidecar — that adaptation is ours and belongs on this line.

## Alternatives considered

Shipping the parent Desktop delta inside this release was rejected once the source was corrected: it is a second line of development, it replaces our sidecar carrier with theirs, and mixing it into a synchronization made two of the fork's own test assertions fail against code they no longer described. Taking the parent's carrier wholesale — which is the right end state for that file — belongs to the cycle that adopts the rest of their carrier work. Raising the `AGENTS.md` ceiling instead of condensing was rejected as before: the standard asks for relocation or condensation first.

## Consequences

Desktop proceeds to an independent `0.2.2` release on this base. Owners of third-party plugin bundles must grant a fresh exemption for `0.2.1-alpha.1`, because the gate is scoped to one plugin version on one runtime version; the companion plugin keeps loading regardless, which is what its graceful degradation was written for. The multi-window line is retired: it is no longer needed, its installers are deleted, and its branches stay unmaintained. The parent Desktop delta remains parked for a later cycle.

## Testing

`pnpm run doc-sync` passes 43 of 43 gates after condensing `AGENTS.md` back under the fork's 3400-word ceiling, and the translation-pairing records were re-recorded from the resolved content. `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests against the rebuilt bundle and 9 of 9 Rust tests. A headless boot of the default `web` profile reaches readiness with no `failed to import` row and, on this generation, no pending row for the usage companion. The `scripts` lane fails one load-sensitive spec that passes 8 of 8 alone; the `gui` lane keeps the three locale-dependent `ui-settings-account` assertions that already fail on this host; and `scripts/project-doc-site.spec.ts` fails in its own setup because Windows denies the symlink it creates (`EPERM: operation not permitted, symlink`) without Developer Mode or elevation. None of those three is a property of this synchronization.

## Environment note: a partial deploy can pass a stamp check

The deploy step failed silently from the perspective of the version stamp: `bundle:prepare` returned non-zero, the deploy had been written only part-way, and `rt/package.json` already read `0.2.2` because the stamp is written before the deploy. A guard that checked the stamp therefore certified a runtime whose files were a mix of two generations, and the smoke lane then failed with `ReferenceError: createServer is not defined` — a symbol belonging to the parent line's carrier, not to this one. Rebuilding with `rt/` removed first produced a whole deploy (28,462 files against the partial 14,478) and the lane passed unchanged.

The lesson is narrower than "check the artifact": check the *specific* artifact the claim is about, at a point where it is definitely finished. A version string is not evidence about file contents, and a wrapper's exit status is not evidence about the build it wrapped unless the wrapper's status is derived from that build.
