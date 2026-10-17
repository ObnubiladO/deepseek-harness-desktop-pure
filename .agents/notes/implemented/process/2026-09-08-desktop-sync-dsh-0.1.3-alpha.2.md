# Agent Note: Desktop synchronization with dsh-v0.1.3-alpha.2

Status: implemented

English | [中文](2026-09-08-desktop-sync-dsh-0.1.3-alpha.2.zh.md)

## Problem

The fork carries an Astra catalog backport for pi-ai 0.84.2 and a Codex WebSocket retry fix. Updating Harness must reconcile both with upstream instead of retaining an obsolete dependency patch.

## Decision

Integrate `dsh-v0.1.3-alpha.2` at `82a5fd61a7cf5c293cec4bdff68f455398d685e9` from fork tip `14f453e95d700dabb839d70d3db8501fa634de3a` through a reviewed manual merge and an equal-tree upstream-rooted candidate. Preserve Desktop packaging, native export, the update seat, English README, and independent Desktop version.

Adopt upstream pi-ai 0.85.1 and its adapter changes. Remove the pi-ai 0.84.2 catalog patch and lockfile registration: the new catalog supplies Astra directly. Retain the `WebSocket closed 1006` transport classification and tests, which alpha.2 does not include. Caller cancellation and authentication, quota, and invalid-request classifications retain precedence.

## Alternatives considered

Keeping the backport would leave a redundant patch against a retired version. Dropping the retry fix would regress recovery after abnormal Codex WebSocket closure. Replacing the fork tree with upstream would lose Desktop integration and reviewable ancestry.

## Consequences

The installed catalog must expose Astra and existing Codex models through the authenticated Desktop discovery endpoint. Validate the pi-ai adapter, Desktop configuration and UI, built runtime startup and shutdown, and the lockfile. Model catalog visibility does not establish inference entitlement. The usage companion remains independently installed and is not bundled by this synchronization.
