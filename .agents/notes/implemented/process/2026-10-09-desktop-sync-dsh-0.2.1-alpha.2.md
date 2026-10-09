# Agent Note: Desktop synchronization with dsh-v0.2.1-alpha.2

Status: implemented

English | [中文](2026-10-09-desktop-sync-dsh-0.2.1-alpha.2.zh.md)

## Problem

The fork shipped `0.2.2` on `dsh-v0.2.1-alpha.1`. Upstream then published `dsh-v0.2.1-alpha.2`: 669 commits and 3,226 changed files — the largest upstream delta this fork has absorbed — and it moved two of the fork's adaptation points, both of which carry fixes the fork owes its own users:

- `packages/client/connection/src/browser-auth.ts`, where the single shared `dsh-auth` cookie name lives and where upstream added native HTTPS listener support (`secure` flag, protocol-scoped cookie audience) while keeping an authority-derived cookie name.
- `packages/host/webserver/src/index.ts`, where the `maxHeaderSize: 64 * 1024` cap lives and where upstream rewrote the listener construction (258 inserted lines) without adding any cap.

Upstream also deleted `@deepseek-ai/dsh-subagent-in-process-driver` outright, exactly as the previous generation deleted `dsh-invariants`.

## Decision

Integrate `dsh-v0.2.1-alpha.2` at `d743267388641bc76f17c45ce8b4c231aed1d32c` from fork tip `549fe13acd` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `7c294d6eec` (`integrate/dsh-0.2.1-alpha.2`), tree `5aab7dfc4a`; three conflicts.
- Upstream-rooted candidate: `40bdc9044a`, same tree, `0` behind the target.
- Master landing: `cdd149ea16`, first parent the previous fork tip `549fe13acd`, second parent the candidate, tree equal to the candidate; the thirteen paths the landing merge disagreed on were resolved to the candidate.
- Release line: the Desktop version `0.2.3` and its README trio, `UPSTREAM_COMMIT` and cycle line, all stamped before the bundle was prepared.

Resolutions, each by intent rather than by taking a side wholesale:

- **`browser-auth.ts`** takes upstream's HTTPS work and re-applies the fork's single shared cookie name in place of `cookieName(authority)`; the authority is still bound inside the signed value and verified per request, but it no longer names the cookie, because naming it per authority made every random-port launch mint another durable cookie until the accumulated `Cookie` header crossed Node's default cap and every request answered 431. The connection suite passes 173 of 173, including the fork's own test asserting that a later login replaces the earlier one — the fork's test file survived the merge unchanged, so it is the arbiter of this decision rather than the merge author.
- **`webserver/index.ts`** takes upstream's rewritten listener and re-applies `createServer({ maxHeaderSize: 64 * 1024 }, listener)`. Upstream sets no cap; the secure listener they added does not carry one either, which is worth revisiting deliberately in a later cycle rather than smuggling in here.
- **The lockfile** was regenerated after removing `@deepseek-ai/dsh-subagent-in-process-driver` from the runtime manifest, since no workspace package by that name exists upstream any more.

Preserved: Desktop packaging and branding, the `settings.update` seat, the fork's WebSocket 1006 transport classification, the full-title header rule, the deployed DeepSeek account and LLM base packages, the plugin-patch carrier, the update seat's semver precedence, and `linkDesktopPackages` in the sidecar — confirmed present in the rebuilt deploy.

## Alternatives considered

Taking upstream's `browser-auth.ts` wholesale was rejected: it would silently reintroduce the per-authority cookie naming that produced the 431 storm this fork fixed, and the fork's own test now encodes the opposite behaviour. Keeping the fork's older `webserver` listener was rejected for the mirror-image reason: upstream's rewrite is the code path their HTTPS support needs, so the cap had to move onto their construction rather than the file staying behind. Raising the `AGENTS.md` ceiling was not needed this cycle; the budget gate passed on the first run.

## Consequences

Desktop proceeds to an independent `0.2.3` release on this base. Third-party plugin bundles again need a fresh exemption, because the gate is scoped to one plugin version on one runtime version, and the usage companion keeps loading regardless. One structural detail changes for future cycles: this upstream release is tagged with an **annotated** tag, so `git rev-parse <tag>` yields the tag object and its commit must be dereferenced before it can parent a candidate — the first candidate attempt failed on exactly that.

## Testing

`pnpm run doc-sync` passes 43 of 43 gates, with the translation-pairing records re-recorded and the documentation budget satisfied on the first run. `pnpm run typecheck` and `pnpm run lint` are clean (0 warnings, 0 errors). The Desktop suite passes 30 of 30 Node tests against the rebuilt `0.2.3` bundle and 9 of 9 Rust tests. A headless boot of the default `web` profile reaches readiness with no `failed to import` row and no pending row for the usage companion. The connection package passes 173 of 173, which is the acceptance test for the cookie resolution. The `scripts` lane fails one load-sensitive spec that passes 8 of 8 alone, and the `gui` lane keeps the three locale-dependent `ui-settings-account` assertions that already fail on this host.

## Environment note: stale build outputs survive a merge

Two build failures in this cycle both came from artifacts rather than code. The first was `MISSING_EXPORT: "registerSessionTitleLlmProvider" is not exported by "../session-title-llm/src/index.ts"` — thrown by a `lib/` chunk built before the merge, while the sources were already consistent with upstream's documented API change (their upgrade guide states the export was removed). Clearing those three packages' outputs surfaced the second: `[@deepseek-ai/dsh-root] Cannot find entry: ["lib/types/{index,startup}.js"]`, which was collateral from the first aborted build never finishing its codegen. `pnpm run clean` followed by a full rebuild resolved both: 360 stale paths removed, then a whole deploy of 28,784 files stamped 0.2.3.

The rule this fork now follows: after a synchronization that changes package contracts, clear the build outputs before trusting an incremental build, and commit the integration only after the build has accepted it. An incremental cache from a previous generation reports the previous generation's imports — and it reports them as errors in the new code.
