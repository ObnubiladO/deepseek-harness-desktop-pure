# Agent Note: Desktop synchronization with dsh-v0.1.5-alpha.2

Status: implemented

English | [中文](2026-09-09-desktop-sync-dsh-0.1.5-alpha.2.zh.md)

## Problem

The fork shipped `0.1.13-astra.1` on `dsh-v0.1.3-alpha.2`. Upstream then advanced to `dsh-v0.1.5-alpha.2`, consolidating the native helper layout under `native/system`, changing pi-ai conversion to lift a leading `system` history message into `systemPrompt`, tightening settings-write provider validation, and reworking the settings trigger accessible name (shell locale via `aria-label`). The update must reconcile those changes with the fork-owned Desktop packaging, branding, and the sanctioned `settings.update` seat instead of resetting the fork line.

## Decision

Integrate `dsh-v0.1.5-alpha.2` at `b2e3b2a0125854567a4a5fcba75782e42fe84901` from fork tip `c711d0c914f2f4cbf7a09325fe4e65faaa1c0247` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `23dbf33bbba5b2bfe11d597ab0fa3e1fad6f9bf4` (`integrate/dsh-0.1.5-alpha.2`), tree `cb555ea2995878db748e41b1abf080e80e020853`.
- Upstream-rooted candidate: `ac8572285bc82524ca09fd5e3d63976b9a77c5a2` (`candidate/dsh-0.1.5-alpha.2`) on the verified tag commit, same tree, `0` behind the target.
- Master landing: `7f89402d853f061a4b5181fd07f3c2f88364d040` on `publish/dsh-alpha2`, first parent the previous fork tip, second parent the candidate, tree equal to the candidate.

Adopt upstream `native/system` (replacing `native/landlock-run`), upstream dependency pins and lockfile (the fork's own lock had drifted to newer transitive website-dependency versions), pi-ai `systemPrompt` semantics and save-time provider validation, the settings trigger `aria-label` behavior, and the session-export download-menu presentation. Preserve Desktop packaging, branding, and the `settings.update` seat below the trigger (rendered with the upstream accessible-name model), and retain the `WebSocket closed 1006` transport classification and tests, which `0.1.5-alpha.2` does not include.

## Alternatives considered

Keeping the drift would leave dependency pins and lockfile content that no longer match any reviewed upstream state. Dropping the fork seams would regress Desktop update delivery and native session saving. Replacing the fork tree with upstream would lose Desktop integration and reviewable ancestry.

## Consequences

The installed catalog must expose Astra and existing Codex models through the authenticated Desktop discovery endpoint, per upstream pi-ai behavior. Validate the pi-ai adapter, Desktop configuration and UI, built runtime startup and shutdown, and the lockfile. Desktop proceeds to an independent `0.1.14-astra` release on this base. The usage companion remains independently installed and is not bundled by this synchronization.
