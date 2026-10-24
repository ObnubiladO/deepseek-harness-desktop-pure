# Agent Note: Desktop synchronization with dsh-v0.1.6-alpha.1

Status: implemented

English | [中文](2026-09-15-desktop-sync-dsh-0.1.6-alpha.1.zh.md)

## Problem

The fork shipped `0.1.15-astra.1` on `dsh-v0.1.5-rc.2`. Upstream then published `dsh-v0.1.6-alpha.1`, a release far larger than the previous two: 800 commits and 3,942 changed files, including a renamed code-execution seam (`@deepseek-ai/dsh-code-runtime` became `@deepseek-ai/dsh-ptc-runtime`), the `e2b` package family replaced by an `ssh` family, upstream Desktop packaging work (`run runtime host from asar`, forced runtime resolution in `pkg` builds, profile resolution modes), several new generated catalogs and gates (`verify-repository-references`, `verify-concrete-terms`, `verify-default-product-isolation`, `web-product-bundle-isolation`), and a Mermaid viewer for the documentation site. The update must reconcile all of that with the fork-owned Desktop packaging, the full-title header rule, the `settings.update` seat, and the fork's synchronization records instead of resetting the fork line.

## Decision

Integrate `dsh-v0.1.6-alpha.1` at `0a15e36e7f82b6ed45af6fa9759f29b40dcd965d` from fork tip `8d57c84fdb4ebdb6092553a486802ea5bf882ed8` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `9a365ca3b1178a190cb45160b1467436ea3947b8` (`integrate/dsh-0.1.6-alpha.1`), tree `aa5da2b23da7436b3717cec65bbba837ce3d0e63`; 3,929 files merged automatically and ten conflicts were resolved by responsibility.
- Upstream-rooted candidate: `ed4d17a17c8176c1bed3a4cf7db004bd5d837376` (`candidate/dsh-0.1.6-alpha.1`) on the verified tag commit, same tree, `0` behind the target.
- Master landing: `fd27641f784910ac64aa8c7480bcf677f046470c`, first parent the previous fork tip, second parent the candidate, tree equal to the candidate. The nineteen files that conflicted there were resolved to the candidate, which is the artifact the landing must reproduce.

Resolutions and adaptations:

- The root README keeps the fork's structure and gains upstream's `## Citation` section, mirrored into `README.en.md` and `README.zh-CN.md`; the fork's deleted `README.zh.md` stays deleted, with upstream's Chinese additions carried into `README.zh-CN.md`.
- `packages/client/ui-settings-general/tests/apply.client.spec.ts` keeps upstream's rewritten fixtures and helpers, with the fork's update-seat assertion expressed in that idiom. The seat itself is unchanged in the slot contract, the shell declaration, `SettingsRoot.tsx`, and the regenerated slot catalog.
- `packages/session-query/session-log-export/README.md` and its Chinese counterpart keep the fork's save-carrier paragraphs around upstream's auto-merged prose, because the merged client code still implements that carrier.
- `desktop/runtime/package.json` follows upstream's rename to `@deepseek-ai/dsh-ptc-runtime`.
- Upstream's new `verify-repository-references` gate rejects commit ids in maintained files, which the fork's synchronization records must contain: the gate now exempts the Desktop synchronization notes only, while `AGENTS.md` and the ancestry note name the release tag instead of the raw commit.
- `packages/client/ui-settings/README.md` and its Chinese counterpart were trimmed to upstream's new 100-word summary budget without losing the update seat.
- The lockfile, `THIRD_PARTY_NOTICES.md`, the client slot catalog, and the pairing records were regenerated rather than merged.

Preserved: Desktop packaging and branding, the `settings.update` seat, the fork's WebSocket 1006 transport classification, and the full-title header rule recorded in [Full session title in the Desktop conversation header](../feature/2026-09-10-desktop-header-full-session-title.md).

## Alternatives considered

Staying on `0.1.5-rc.2` would leave the fork two releases behind a line upstream is actively changing, and the seam rename alone would rot the fork's dependency list. Replacing the fork tree with upstream would drop Desktop packaging, branding, and the header delta. Exempting every maintained file from the new reference gate would have removed the check instead of scoping it, so only the synchronization notes are exempt. Resolving the landing conflicts by hand a second time was rejected because the landing tree must equal the validated candidate: re-deciding content there would invalidate the artifact the synchronization is required to land.

## Consequences

Validate the Desktop configuration and UI, built runtime startup and shutdown, the settings surfaces including the update seat, the conversation header, the reworked client and terminal surfaces, the synchronized lockfile, and the regenerated catalogs. Desktop proceeds to an independent `0.1.16` release on this base through the repository's release workflow. The multi-window feature remains fork-local and is not part of this synchronization.

## Testing

`pnpm run doc-sync` passes 41 of 41 gates; `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors); the Desktop suite passes 30 of 30 Node tests and 8 of 8 Rust tests; the client and host lane passes 5,583 tests; the scripts lane passes 1,538 of 1,539, where the single failure is a five-second timeout in `client-build-environment.client.spec.ts` that appears only under full parallel load and passes deterministically on its own. The resolved index was checked for conflict markers, and the landing was verified to reproduce the candidate tree exactly.
