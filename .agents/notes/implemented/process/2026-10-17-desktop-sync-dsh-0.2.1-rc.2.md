# Agent Note: Desktop synchronization with dsh-v0.2.1-rc.2

Status: implemented

English | [中文](2026-10-17-desktop-sync-dsh-0.2.1-rc.2.zh.md)

## Problem

The fork shipped `0.2.5` on `dsh-v0.2.1-alpha.5`. Upstream then published `dsh-v0.2.1-rc.2`: 13 commits and 465 changed files, the smallest delta in this series and the first release-candidate tag the fork has synchronized.

Nothing in the change set touches a file that carries a fork adaptation. `browser-auth.ts`, the webserver listener, the plugin compatibility gate, the profile resolution service, the settings service, the sidecar and the runtime manifest are all untouched in this range, so the single shared browser-session cookie name, the `maxHeaderSize` cap and `linkDesktopPackages` needed no re-application — the second consecutive cycle in that position.

## Decision

Integrate `dsh-v0.2.1-rc.2` at `687f282e8625c6b8d11ff58211a90524be2e4317` from fork tip `5a4a2cde33` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `ec857f4783` (`integrate/dsh-0.2.1-rc.2`), tree `72fa21f457`; **no conflicts**.
- Upstream-rooted candidate: `ce5ea8d40e`, same tree, `0` behind the target.
- Master landing: `089c4ce84f`, first parent the previous fork tip `5a4a2cde33`, second parent the candidate, tree equal to the candidate; the ten paths the landing merge disagreed on were resolved to the candidate.

Preserved without intervention: Desktop packaging and branding, the `settings.update` seat, the WebSocket 1006 transport classification, the full-title header rule, the shared cookie name, the header cap, the deployed DeepSeek account and LLM base packages, the plugin-patch carrier, the update seat's semver precedence, and `linkDesktopPackages` in the sidecar, confirmed present in the rebuilt deploy.

## Alternatives considered

None was required, for the second cycle running — and that absence is the useful signal. A release-candidate tag with a quiet delta and no adaptation in the blast radius means the fork can synchronize without re-deriving any of its five deliberate deviations, which is the outcome the recorded procedure is meant to produce rather than a lucky one.

## Consequences

Desktop proceeds to an independent `0.2.6` release on this base. The runtime's prerelease identifier now reads `rc.2` rather than an `alpha`, so third-party plugin exemptions must be granted again for this runtime version; the usage companion keeps loading without one.

The documented upstream false positive is unchanged: `verify-repository-references` still flags `python/sdk/uv.lock:113` as a commit hash, on a file byte-identical to upstream's, where the flagged token is a PyPI file digest inside a package URL. The `plugin-compat` helper kept outside this repository likewise still implements the peers-only rule, while upstream's gate now also reads a declared `engines.dsh` range.

## Testing

`pnpm run doc-sync` passes 42 of 43 gates, the exception being the false positive above; the documentation budget passed without condensation. `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests against the rebuilt `0.2.6` bundle and 9 of 9 Rust tests. A headless boot of the default `web` profile reaches readiness with no `failed to import` row and no pending row for the usage companion, and the compatibility check reports runtime `0.2.1-rc.2` with the provider skipped as expected. The `scripts` lane fails one load-sensitive spec that passes in isolation, and the `gui` lane keeps the three locale-dependent `ui-settings-account` assertions that already fail on this host.

## Environment note: a correction made before publishing

The landing commit message first asserted that no `dsh-v0.2.1-rc.1` tag equivalent exists upstream. That claim was never verified, and the check I ran to support it was itself wrong — an empty PowerShell result compared with `-ne $null` evaluates to true, so the test reported presence it had not found. Nothing had been pushed, so the message was amended to drop the claim rather than defended; the amend preserved both parents and the tree, which is the invariant that matters for a landing.

The lesson is narrow and worth keeping: a claim in a commit message is still a claim, and the same standard applies to it as to a gate verdict — verify it against the artifact, or leave it out.
