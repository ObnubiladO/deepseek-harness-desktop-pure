# Agent Note: Desktop synchronization with dsh-v0.1.6-alpha.2

Status: implemented

English | [中文](2026-09-17-desktop-sync-dsh-0.1.6-alpha.2.zh.md)

## Problem

The fork shipped `0.1.16` on `dsh-v0.1.6-alpha.1`. Upstream then published `dsh-v0.1.6-alpha.2`: 887 commits and 2,622 changed files, 185 of them touched on both sides. The release reworks profile boot and module resolution — `runProfile` now defaults a plain-Node caller to `resolutionMode: 'runtime'`, which mounts an enforced module generation computed from the upstream `dsh` installation anchor, and adds an application-owned profile path through `resolvedProfile` — renames the HMR package to `@deepseek-ai/dsh-hmr`, reworks `apps/desktop-host` around new primary-runtime, update-task, and office seams, and adds a `kitRepositoryUrl` allowance to `verify-repository-references`. The update must reconcile that with the fork-owned Desktop packaging, the full-title header rule, the `settings.update` seat, and the About/update-check repository value, instead of resetting the fork line.

## Decision

Integrate `dsh-v0.1.6-alpha.2` at `ddefc45fbc7f8e46dd73185e68295696d1297887` from fork tip `4816af87c6dda05e766ba0441f311d92f42a942e` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `829e739c48b8544d61ba05fc6ad5bd06b9339fbb` (`integrate/dsh-0.1.6-alpha.2`), tree `d32f5b43ff0569de9f576164b0577d72a8947bd7`; the merge applied without textual conflicts, and the paths both sides touched were reviewed by responsibility.
- Upstream-rooted candidate: `fa49a9454191750c9f7dfb6eb9dce4fd3182753b` (`candidate/dsh-0.1.6-alpha.2`) on the verified tag commit, the same tree, `0` behind the target, and 185 files of reviewed fork delta.
- Master landing: `6db9eeb62dbf3a66ed466e60ef3dd1b9e6a7255a`, first parent the previous fork tip, second parent the candidate, tree equal to the candidate. The fourteen paths that conflicted there were resolved to the candidate, which is the artifact the landing must reproduce.

Resolutions and adaptations:

- `desktop/runtime/src/sidecar.ts` pins `resolutionMode: 'link'`. The new `runtime` default enforces a module generation computed from the upstream `dsh` installation anchor, which cannot see the overlay's own loader-visible packages (`@deepseek-ai/dsh-desktop-runtime/*`, `@deepseek-ai/dsh-desktop-client-ui`), so all four overlay rows failed to import and the Desktop surface never reached the served index document. Disk links resolve through the profile fallback this sidecar seeds from its own deploy root, which is the mode upstream's own desktop host selects for the same reason.
- `desktop/scripts/build-runtime.mjs` accepts the facade emission upstream now writes (`import("./profile-boot.js")`, previously a suffixed chunk name) when it rewrites the profile boot bridge.
- `desktop/runtime/package.json` names the fork repository, so the About panel's Repository row and the update check both read `https://github.com/ObnubiladO/deepseek-harness-desktop-pure`; that change is recorded in [Desktop About and update check name the fork repository](../bug-fix/2026-09-10-desktop-about-repository-follows-the-fork.md).
- The version mirrors move to `0.1.17`, `desktop/UPSTREAM_COMMIT` records the new target, and the lockfile, third-party notices, and client slot catalog were regenerated rather than merged.
- The landing's README pairing record conflict is a rename crossing a rename: upstream moved `README.i18n.yaml` to `docs/subsystems/boot.i18n.yaml` while the fork keeps its own copy at `desktop/assets/README.i18n.yaml`, so both files land with candidate content and no root `README.i18n.yaml` remains.

Preserved: Desktop packaging and branding, the `settings.update` seat, the fork's WebSocket 1006 transport classification, and the full-title header rule recorded in [Full session title in the Desktop conversation header](../feature/2026-09-10-desktop-header-full-session-title.md).

## Alternatives considered

Staying on `0.1.6-alpha.1` would leave the fork on a line whose profile boot upstream has already replaced, and the Desktop sidecar depends on that seam. Replacing the fork tree with upstream would drop Desktop packaging, branding, the About repository value, and the header delta. Passing `resolvedProfile` instead of pinning `resolutionMode` was rejected for this cycle: it bypasses named-profile initialization, and the Desktop deliberately boots the same `web` profile the CLI uses, so the pinned disk-link mode keeps one profile definition for both surfaces. Reconstructing the overlay as a profile-local plugin bundle would satisfy the runtime generation, but it changes the deployment model and is not required to ship this synchronization.

## Consequences

The Desktop boots the synchronized runtime with the overlay active, its About panel and update check name the fork, and the fork carries one more adaptation in an upstream-owned call site (`resolutionMode`), which the next synchronization must re-check. The Desktop proceeds to an independent `0.1.17` release on this base through the repository's release workflow. The multi-window feature remains fork-local: it is not part of this synchronization.

## Testing

`pnpm run doc-sync` passes 41 of 41 gates; `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors); the Desktop suite passes 30 of 30 Node tests and 8 of 8 Rust tests; the client and host lane passes 6,182 tests across 433 files with one skipped; the scripts lane passes 1,594 tests with 22 skipped and no failures, so the load-sensitive five-second timeout in `client-build-environment.client.spec.ts` that the previous cycle recorded did not reproduce. The Desktop smoke lane boots the deployed sidecar against a fresh `DSH_HOME` and asserts the served index document carries the desktop bridge and the overscroll style, which is the check that caught the overlay import failure above.
