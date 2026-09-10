# Agent Note: Desktop About and update check name the fork repository

Status: proposed

English | [中文](2026-09-10-desktop-about-repository-follows-the-fork.zh.md)

## Problem

The About panel's Repository row and the Desktop update check read one value: the `repository` field of the deployed runtime manifest (`desktop/runtime/package.json`), which `desktop/runtime/src/surface.ts` serves as `DesktopInfo.repository`. That value still names `https://github.com/cipherTing/deepseek-harness-desktop-pure`, the upstream Desktop project, so the About panel sends the user to a repository that does not carry this distribution's builds.

The same string decides where updates are looked for. `releasesUrl()` in `desktop/client-ui/src/client.js` matches `github.com/<owner>/<repo>` out of it and derives `https://api.github.com/repos/<owner>/<repo>/releases/latest`, which `fetchLatest()` reads for the tag, the release body, and the platform asset. With the upstream repository named, the badge and the About-page check compare against the upstream project's releases: they cannot see an Astra release published on the fork, and they would offer the upstream installer if that repository ever publishes a newer tag. The fork's releases already use the asset names the check looks for (`deepdive-windows-x64-<version>.exe`, `deepdive-macos-arm64-<version>.dmg`).

The Author row is a separate value and already reads `ObnubiladO, forked from cipherTing`, so nothing about attribution depends on this field.

## Proposal

In the next Desktop build, point the runtime manifest's `repository` at `https://github.com/ObnubiladO/deepseek-harness-desktop-pure`. One value fixes both the visible link and the update source, because both already read it. Credit stays where it is a credit rather than this build's identity: the Author row, the upstream attribution, and the README links that send Desktop issues to the project this fork came from.

## Alternatives considered

**Change only the rendered link in `client.js`.** Rejected because the update check reads the same field: the panel would link to the fork while the badge kept comparing upstream releases, which is a worse state than today's single consistent source.

**Add a second manifest field for the update source.** Rejected as unnecessary: the fork both hosts the source and publishes the releases, so one repository serves both readings, and a second field would need its own precedence rules.

**Keep the upstream repository and stop checking for updates.** Rejected because the update path is built and tested, and it is the only way an installed Desktop learns about a newer Astra build.

**Move the README issue and license links at the same time.** Out of scope: those links deliberately point at the project the fork forked from, and changing them is a separate decision about where Desktop issues belong.

## Acceptance criteria

- A Desktop build made after the change shows `https://github.com/ObnubiladO/deepseek-harness-desktop-pure` in the About panel's Repository row.
- The About-page check and the update badge request `https://api.github.com/repos/ObnubiladO/deepseek-harness-desktop-pure/releases/latest`, and the dialog's download action resolves to that release's `deepdive-<platform>-<version>` asset rather than to the release page.
- `desktop/runtime/package.json` is the only source changed; the Author row and the READMEs keep crediting the original project.
- `pnpm --filter @deepseek-ai/dsh-desktop test` and `cargo test --manifest-path desktop/src-tauri/Cargo.toml` still pass.

## Risks

- GitHub's API allows 60 unauthenticated requests per hour per address. The check is badge-driven or user-invoked and already reports nothing when a request fails, so a rate limit degrades to a missing badge rather than an error.
- A repository field that names a repository without releases makes the check silently find no update, so the change is only correct while that repository carries the release line; the fork does.
- The value lives in a manifest that `desktop/scripts/sync-version.mjs` rewrites on every version bump. That script spreads the parsed manifest and replaces only `version`, so the new value survives version bumps, but a future synchronization must not copy the upstream manifest over it.
