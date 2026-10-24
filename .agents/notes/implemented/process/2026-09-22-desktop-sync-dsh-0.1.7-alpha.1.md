# Agent Note: Desktop synchronization with dsh-v0.1.7-alpha.1

Status: implemented

English | [中文](2026-09-22-desktop-sync-dsh-0.1.7-alpha.1.zh.md)

## Problem

The fork shipped `0.1.17` on `dsh-v0.1.6-alpha.2`. Upstream then published `dsh-v0.1.7-alpha.1`: 1,299 commits and 4,754 changed files, 39 of them touched on both sides. The release replaced the profile-fallback API with a computed runtime resolution projected into the shared profile directory, moved client routes to document-relative forms, rebuilt the settings shell around a `settings.launcher` slot, reduced the settings controller to a single replaceable text-editor opener, renamed the agent-preset packages, and added a documentation gate. The update had to carry all of that plus a loopback cookie fix the fork owed its own users, without resetting the fork line.

## Decision

Integrate `dsh-v0.1.7-alpha.1` at `c36a83ff6bb95e3f82cf79f9be7c724270a8aa61` from fork tip `ed8c6ee0ec4b8544b7b7a05c39677363890f084b` through a reviewed manual merge and an equal-tree upstream-rooted candidate, then land the loopback cookie fix and the release bump on top before the candidate was materialized.

- Manual integration: `5623df97889ee7532814be6dd2a086e6e4805621` (`integrate/dsh-0.1.7-alpha.1`), tree `25d02fb3d404ccf44c4e3bee043820eb24afad86`; nineteen conflicts were resolved by responsibility, then the cookie fix and the runtime adaptations landed as separate commits.
- Loopback cookie fix: `d3750e30045fcfb0727553853e59244a10929f04`.
- Release bump to `0.1.18`: `c4c82626ef0fb705a9d825296ddef5414b599837`; the plugin-patch note's reference fix: `c583fa11db6a8a68fb7e6a7353f12038eb0542bf`.
- Upstream-rooted candidate: `4dd62532bc832899b34b26d2de2cfd91d04eb205` on the verified tag commit, same tree, `0` behind the target.
- Master landing: `6c8e2dad6eac68399a11ebcb8ded319f38e916a8`, first parent the previous fork tip, second parent the candidate, tree equal to the candidate; all thirty-three conflicted paths were resolved to the candidate.

Resolutions and adaptations:

- The root README keeps the fork's structure and gains upstream's `## Development` section with its `pnpm run dev:web` / `make help` sentence, mirrored into `README.en.md` and `README.zh-CN.md`; the fork's deleted `README.zh.md` stays deleted, with upstream's matching Chinese sentence carried into `README.zh-CN.md`.
- The settings shell keeps the fork's optional Desktop `settings.update` seat inside the column that now holds upstream's `settings.launcher` slot, and both specs serve the seat and the launcher fallback.
- Package READMEs keep the fork's paragraphs around upstream's rewording: the `settings.update` seat with `ctx.configForms.describe()`, the WebSocket 1006 classification, and the save-carrier paragraph over upstream's document-relative export route. The Desktop download carrier resolves that relative route against the page before the native export command validates an absolute same-origin URL.
- `desktop/runtime/src/sidecar.ts` replaces the removed `healProfilesModuleFallback` seeding and the dropped `resolutionMode` option with `linkDesktopPackages`: alpha.7 projects its computed resolution into `<home>/profiles/node_modules`, and the Desktop-owned plugin packages must occupy that layer or every overlay row fails to import.
- `desktop/runtime/src/settings-controller.ts` passes the one remaining integration, `openTextFile`, instead of the removed `openPath`/`canOpenPath`/`nativeOpen` hooks.
- `scripts/rescope-vendor.ts` takes upstream's registry list, whose entries moved to other packages, and the lockfile, client slot catalog, and pairing records were regenerated.

Preserved: Desktop packaging and branding, the `settings.update` seat, the fork's WebSocket 1006 transport classification, and the full-title header rule.

## Loopback cookie fix (0.1.18)

The browser-session cookie name was derived from the request authority, so every random-port Desktop launch minted a new durable cookie and none replaced another; the accumulated `Cookie` header eventually crossed Node's 16 KiB default cap and every request answered 431. The cookie now uses one fixed name, `dsh-auth`, while the authority stays bound inside the signed payload and is still verified per request. The Desktop startup sweep accepts the bare name in addition to the legacy `dsh-auth-<43 base64url>` form, so the first 0.1.18 launch deletes the cookies earlier 0.1.x launches accumulated, and the webserver raises `maxHeaderSize` to 64 KiB as a blast-radius cap. Existing installs need no manual cleanup. This is an in-tree edit that must be re-applied at each upstream sync: pnpm `patchedDependencies` cannot carry it because the harness packages are `file:` links, and it is deliberately not ported to the local multi-window line, where two concurrent authenticated sidecars would overwrite each other's cookie and the isolation primitive would have to be a per-window WebView data folder instead.

## Alternatives considered

Staying on `0.1.6-alpha.2` would leave the Desktop on a removed boot API and an unresolved cookie bug. Replacing the fork tree with upstream would drop Desktop packaging, branding, the update seat, and the header delta. Re-implementing the removed heal function verbatim was rejected in favor of occupying the layer upstream now projects into, which is the mechanism the profile boot actually consults. Loading the profile through `resolvedProfile` was rejected for this cycle because it bypasses named-profile initialization for a profile the CLI must keep sharing. Resolving the landing conflicts by hand a second time was rejected because the landing tree must equal the validated candidate.

## Consequences

The Desktop boots the synchronized runtime with all overlay rows active, and the two new adaptations sit in upstream-owned call sites that the next synchronization must re-check. Desktop proceeds to an independent `0.1.18` release on this base. The multi-window feature remains fork-local and is not part of this synchronization.

## Testing

`pnpm run doc-sync` passes 42 of 42 gates (upstream added one). `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests and 9 of 9 Rust tests. `pnpm exec vitest run packages/client/connection` passes 165 tests, including a regression that mints for two authorities and asserts one shared cookie name plus cross-authority rejection, and `cargo test --manifest-path desktop/src-tauri/Cargo.toml sidecar_auth` passes the sweep-selection test that deletes bare and legacy loopback logins only. The client and host lane passes 7,333 of 7,337, and the scripts lane passes 2,116 of 2,143 with three load-sensitive five-second timeouts that pass 33 of 33 when the two specs run alone. The four client and host failures are environment-specific: upstream's new `ui-settings-account` package formats balances through `Number.prototype.toLocaleString()`, and this host's default locale (`es-ES`) does not group `1234` with a comma, so the assertions that expect `¥1,234.56` fail here and pass under an English default locale.

The Desktop smoke lane boots the deployed sidecar against a fresh `DSH_HOME` and asserts that the served index document carries the desktop bridge and the overscroll style; it is the check that caught both the missing resolution layer and the replaced settings-controller hooks.

## Environment note

The workspace had accumulated twelve orphan package directories from earlier upstream renames (`packages/e2b/*`, `packages/code-runtime/*`, `packages/settings/settings-file`, `packages/preset/agent-presets`, and others) that Git does not track but tsdown's `packages/*/*` workspace glob still discovered. Their stale build outputs failed the host build twice — first as a missing `SettingsProvider` export, then as `Cannot find entry` attributed to `@deepseek-ai/dsh-root` — before they were deleted. Check for such directories after a synchronization that removes or renames packages.
