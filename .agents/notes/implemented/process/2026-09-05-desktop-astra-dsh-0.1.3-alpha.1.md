# Agent Note: Desktop Astra build on dsh-v0.1.3-alpha.1

Status: implemented

English | [中文](2026-09-05-desktop-astra-dsh-0.1.3-alpha.1.zh.md)

## Problem

The Codex provider catalog bundled with `dsh-v0.1.3-alpha.1` omits `gpt-6-astra`. Importing official Codex credentials does not update this static list, so an account with Astra access cannot select it through the default catalog.

## Decision

The Desktop candidate integrates upstream `dsh-v0.1.3-alpha.1` at `d347e703908d0406b7a7ef80e3a0e594d86b2215` through a reviewed manual merge from fork `0f32029dbf044dfcb6a0ee46ae97ac8c46e01856`. Desktop uses independent test version `0.1.12-astra.1`. The merge preserves Desktop native session saving and the update seat while adopting upstream handle-based session export and canonical log filenames.

The [package patch](../../../../patches/@earendil-works__pi-ai@0.84.2.patch) replaces only the Codex catalog JSON in `@earendil-works/pi-ai@0.84.2` with the exact file published in `0.85.1`. All seven existing entries are unchanged; Astra is the only addition. The pnpm lockfile records the patch hash. The source tarball has npm integrity `sha512-+VgVIJDkDO2efYJKEEqvPTH4zmnIaXdAppGbO+vKFA9qy5PdhFiAenuFAkU+oiCSfOC4dMHDyrjdQeL4ZoC5CQ==`.

## Alternatives considered

**Upgrade the complete pi-ai dependency to 0.85.1.** The alpha adapter fails compilation against newly required thinking and compatibility fields. A catalog-only patch avoids changing the adapter or unrelated provider behavior.

**Declare Astra in user settings.** A nonempty custom models list replaces the served catalog and puts metadata maintenance on the user. Bundling the catalog makes Astra available to existing Codex provider configurations.

## Consequences

The [Desktop sidecar smoke test](../../../../desktop/tests/sidecar-smoke.test.mjs) calls the authenticated Models discovery endpoint on the deployed runtime and requires Astra, positive capacity metadata, and the existing Sol entry. Focused catalog, discovery, and session-export tests cover the inherited adapter and export integration. Model inference and account entitlement remain server decisions; listing Astra does not prove a successful inference request.

The patch is removable when a compatible upstream pi-ai update includes Astra. The original global catalog generation timestamp remains intact because this patch updates only one provider file. Test builds are local artifacts; this change does not publish a release or alter installed credentials and settings.
