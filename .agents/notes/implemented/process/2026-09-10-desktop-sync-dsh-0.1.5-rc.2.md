# Agent Note: Desktop synchronization with dsh-v0.1.5-rc.2

Status: implemented

English | [中文](2026-09-10-desktop-sync-dsh-0.1.5-rc.2.zh.md)

## Problem

The fork shipped `0.1.15-astra` on `dsh-v0.1.5-rc.1`. Upstream then published `dsh-v0.1.5-rc.2`, a narrow follow-up release that backports the symmetric message-feedback submission flow, the shared file-type icon artwork and its manifest, and refinements to the feedback dialog and the produced-files surface. DeepDive also carries a fork-owned header fix that upstream does not have. The update must reconcile the backport with the fork-owned Desktop packaging, the header title delta, and the `settings.update` seat instead of resetting the fork line.

## Decision

Integrate `dsh-v0.1.5-rc.2` at `fb2c4b9e698e30edb738bca4cf0618587db7d203` from fork tip `583a780401` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Fork tip: `583a780401` (`fix(desktop): show the full session title in the conversation header`), whose parent is the `0.1.15-astra` release commit `40f82da071`.
- Manual integration: `9f67f191e0f6e0abb0ded8ae10dc2b74c61f5026` (`integrate/dsh-0.1.5-rc.2`), tree `d0de9b15ff9a15ae227c97a7ffb77777ccc14201`.
- Upstream-rooted candidate: `abdd2adece8abbfe8e687e731efe5f10e8207eb0` (`candidate/dsh-0.1.5-rc.2`) on the verified tag commit, same tree, `0` behind the target.
- Master landing: `96176314073801efe4366f09b5cf90611606ab9d`, first parent the previous fork tip, second parent the candidate, tree equal to the candidate.

The merge was conflict-free. Both sides had touched exactly one file, `package.json`: the fork adds the `desktop`, `desktop/runtime`, and `desktop/client-ui` workspace entries plus the `desktop:*` scripts, and upstream raises the root version to `0.1.5-rc.2`. The automatic merge kept both changes, so the merged root manifest carries the fork's workspace and script additions with the upstream version, and the reviewed tree differs from the verified target in exactly the fork delta. Adopt the message-feedback backport, the file-type icon artwork and manifest, the produced-files and turn-tail refinements, and the regenerated documentation. Preserve Desktop packaging, branding, the `settings.update` seat, and the header title delta recorded in [Full session title in the Desktop conversation header](../feature/2026-09-10-desktop-header-full-session-title.md).

## Alternatives considered

Staying on `0.1.5-rc.1` would ship a Desktop release without the reviewed feedback and file-card backport, and would leave the fork's declared upstream base behind the newest release candidate. Replacing the fork tree with upstream would drop Desktop integration, the header delta, and reviewable ancestry. Carrying the multi-window work on this line would publish an unreviewed native change; it stays a fork-local branch instead.

## Consequences

Validate the feedback dialog and its submission states, the file-type icons, the produced-files surface, the Desktop configuration and UI, built runtime startup and shutdown, and the synchronized lockfile. Desktop proceeds to an independent `0.1.15-astra.1` release on this base through the repository's release workflow. The multi-window feature remains fork-local and is not part of this synchronization.
