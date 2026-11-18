# Agent Note: Desktop synchronization with dsh-v0.2.2-rc.5

Status: implemented

English | [中文](2026-11-18-desktop-sync-dsh-0.2.2-rc.5.zh.md)

## Problem

The fork shipped `0.3.2` on `dsh-v0.2.2-rc.2`. Upstream then published `rc.3`, `rc.4`, and `rc.5` on the same line: 19 commits and 580 files (+11,724/−932), with a DeepSeek content-safety review and its refusal handling, a DeepSeek chat-export import bundle, a web-search model default, and a liveshare tunnel-worker fix.

Two questions decided the shape of this cycle. Whether the `pi-ai` exception from `0.3.2` survives: upstream still pins `@earendil-works/pi-ai` `^1.3.0` at `rc.5`, so it does. Whether the new `@deepseek-ai/dsh-deepseek-chat-import` package reaches the deploy: it is a regular dependency of `apps/cli`, so the deploy closure takes it without a new runtime-manifest entry.

## Decision

Integrate `dsh-v0.2.2-rc.5` at `9c2670d3bce5275e0d1610272958121af87787bb` from fork tip `1b18e237ea` and release it as Desktop **0.3.3**, a patch because the upstream line did not change. Keep the `pi-ai` 1.5.2 upgrade that `0.3.2` shipped ahead of upstream, and with it Claude Fable 5.2.

- Manual integration: `968d90cae80ada4c37096744a0a35a6d654781f9`, tree `9af5456a04`; no textual conflicts.
- Upstream-rooted candidate: `b0c89d41fef1eba53a185eaf1e5d37d73a9d31ad`, same tree, `0` behind the target.
- Master landing: `54b1ef41f6c0ae0e24a2384f3092a40e8ff016bf`, first parent the previous fork tip `1b18e237ea`, second parent the candidate, tree equal to the candidate. The fork stands 134 commits ahead of upstream and 0 behind.

No conflict needed resolving, and the survival report proves nothing was dropped: for the files both sides changed, every line either side added is present in the tree.

Four points were checked rather than assumed:

- **The `pi-ai` exception holds.** The adapter still declares `^1.5.2`, both patches stay registered, the workspace keeps its 1.5.2 release-age exemptions, the deployed install carries one copy of `pi-ai` 1.5.2 with the Gemini patch, and the catalog still resolves `claude-fable-5-2`. The exception note and its unwind steps stay in force until upstream pins 1.5.2 or later.
- **The Desktop seams are untouched upstream.** None of the fork's adapted files changed, so the export dialog, native save carrier, settings launcher and update seat needed no reconciliation; the regenerated client catalog carries `settings.update` beside upstream's new `sidebar.session.action` and `workspace.picker.directoryFlow`.
- **The new package belongs in the deploy.** `@deepseek-ai/dsh-deepseek-chat-import` arrives through the CLI dependency, and the deploy's dependency-closure gate resolves all 339 packages.
- **The runtime version moved.** The deploy now reports kernel `0.2.2-rc.5`, so a third-party bundle exempted for an earlier runtime needs that exemption granted again; the interpreter here reports the `0.1.0` provider in the secondary home as one the runtime would skip, unchanged from before.

Regenerated after the merge: client, cordis, config, dependency and official-bundle catalogs, plugin packages, provider data, and third-party notices. Desktop `0.3.3` across its version mirrors, the README trio, the `AGENTS.md` cycle line, and `desktop/UPSTREAM_COMMIT`.

## Alternatives considered

Waiting for a later tag was rejected: `rc.5` is the newest on this line, and the owner named it. Dropping the `pi-ai` exception to follow upstream's `1.3.0` pin was rejected because it would remove Claude Fable 5.2 from a shipping release. Adding the new bundle to the runtime manifest was unnecessary, since the CLI already depends on it and the closure gate would name any package the deploy could not resolve.

## Consequences

Desktop proceeds to `0.3.3` with the same feature set as `0.3.2` plus upstream's changes, on kernel `0.2.2-rc.5`. The `pi-ai` exception remains the fork's one deliberate divergence from upstream, recorded in [the pi-ai note](2026-11-12-desktop-pi-ai-ahead-of-upstream.md).

The new chat-export import appears in the plugin manager's on-demand bundle list. DeepDive's deploy ships the package, so installing that bundle needs no download from npm.

## Testing

The build orchestrator passes 10 of 10 gates. The deploy holds 19,268 files (423.3 MiB) stamped `0.3.3` on kernel `0.2.2-rc.5`, with one copy of `pi-ai` 1.5.2 that carries the Gemini hunks and no WebAssembly Office engine. Resolved through the adapter's own catalog path, `claude-fable-5-2` keeps its 1,000,000-token context, 128,000 output tokens, adaptive thinking, per-message effort and mid-conversation updates. The adapter package passes 496 of 496 tests and the Electron patch policy 16 of 16; the Desktop suite passes 38 of 38 and Rust 9 of 9; `pnpm run typecheck` passes 5 of 5, `pnpm run doc-sync` 43 of 43, and `pnpm run lint` reports no errors. The Office engine still renders the conversion fixture natively, and a headless boot of the `web` profile reaches readiness with no failed imports. The `scripts` and `gui` lanes fail only their known host-specific and locale-dependent tests: the same six and three assertions as the previous cycle.

The local Windows installer embeds runtime `0.3.3`, kernel `0.2.2-rc.5` and `pi-ai` 1.5.2, carries the cookie-sweep marker and passes the sweep guard. The published assets are checked separately from the downloaded files once the release run completes.
