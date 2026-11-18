# Agent Note: Desktop synchronization with dsh-v0.2.1-rc.3

Status: implemented

English | [中文](2026-10-24-desktop-sync-dsh-0.2.1-rc.3.zh.md)

## Problem

The fork shipped `0.2.6` on `dsh-v0.2.1-rc.2`. Upstream then published `dsh-v0.2.1-rc.3`: six commits, but 640 changed files, because the delta is dominated by the navigation-customization feature.

Two of the files it rewrote are ones this fork has modified: `packages/client/ui-settings-general/tests/apply.client.spec.ts` and the conversation skeleton stylesheet. No file carrying a fork adaptation proper moved — `browser-auth.ts`, the webserver listener, the plugin compatibility gate, the profile resolution service, the settings service, the sidecar and the runtime manifest are all untouched in this range.

## Decision

Integrate `dsh-v0.2.1-rc.3` at `1f81c047fc48fa190a683e469daa699857e9afe8` from fork tip `657a0527e4` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `0a660974f6` (`integrate/dsh-v0.2.1-rc.3`), tree `f109e1d072`; one conflict.
- Upstream-rooted candidate: `999a5040ca`, same tree, `0` behind the target.
- Master landing: `ff76db7953`, first parent the previous fork tip `657a0527e4`, second parent the candidate, tree equal to the candidate; the eleven paths the landing merge disagreed on were resolved to the candidate.

The one conflict, `ui-settings-general/tests/apply.client.spec.ts`, was resolved by keeping both sides. Upstream's analytics work (`675164957a`) refactored row access into a `developerToolsRowOf(c)` helper; the fork asserts in the same place that the Desktop update seat is registered by the Desktop client and never by this plugin. Neither claim contradicts the other — one is about how a test obtains a row, the other about which plugin may own a seat — so the resolution keeps the fork's assertion and adopts the helper. The settings suite passes 88 of 88.

Preserved without intervention: Desktop packaging and branding, the `settings.update` seat, the WebSocket 1006 transport classification, the full-title header rule, the single shared `dsh-auth` cookie name, the `maxHeaderSize` cap, the deployed DeepSeek account and LLM base packages, the plugin-patch carrier, the update seat's semver precedence, and `linkDesktopPackages` in the sidecar, confirmed present in the rebuilt deploy.

## Alternatives considered

Taking either side of the test conflict was rejected: taking upstream's would silently drop the fork's guarantee about seat ownership, and taking the fork's would discard a refactor upstream now depends on elsewhere in that file. The by-intent resolution is the only one that keeps both statements true.

## Consequences

Desktop proceeds to an independent `0.2.7` release on this base. Third-party plugin bundles need the exemption granted again for runtime `0.2.1-rc.3`; the usage companion keeps loading without one.

The documented upstream false positive is unchanged: `verify-repository-references` still flags `python/sdk/uv.lock:113` as a commit hash, on a file byte-identical to upstream's, where the flagged token is a PyPI file digest inside a package URL. The `plugin-compat` helper kept outside this repository also still implements the peers-only rule, while upstream's gate now also reads a declared `engines.dsh` range.

## Testing

`pnpm run doc-sync` passes 42 of 43 gates, the exception being the false positive above; the documentation budget passed without condensation. `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests against the rebuilt `0.2.7` bundle and 9 of 9 Rust tests, and the settings package passes 88 of 88 — the acceptance test for the conflict resolution. A headless boot of the default `web` profile reaches readiness with no `failed to import` row and no pending row for the usage companion, and the compatibility check reports runtime `0.2.1-rc.3` with the provider skipped as expected. The `scripts` lane fails one load-sensitive spec that passes in isolation, and the `gui` lane keeps the three locale-dependent `ui-settings-account` assertions that already fail on this host.

## Environment note: a false alarm about indentation

My conflict resolution initially used four-space indentation in a file I assumed used two, and my attempt to normalise it silently did nothing because the replacement string used CRLF while the file uses LF. Checking the file directly showed the assumption was wrong in the other direction: the whole file is four-space indented with LF endings, so the block was already consistent.

The lesson is small but consistent with the rest of this series: a "fix" that changes nothing is not evidence that nothing was wrong — it may be evidence that the check never ran. Reading the artifact settled it in one look.
