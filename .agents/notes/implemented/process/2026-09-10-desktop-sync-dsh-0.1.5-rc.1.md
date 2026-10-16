# Agent Note: Desktop synchronization with dsh-v0.1.5-rc.1

Status: implemented

English | [中文](2026-09-10-desktop-sync-dsh-0.1.5-rc.1.zh.md)

## Problem

The fork shipped `0.1.14-astra` on `dsh-v0.1.5-alpha.2`. Upstream then advanced to `dsh-v0.1.5-rc.1`, refining the sidebar and document-preview surfaces, adding the guide start page and quieter composer stat pills, defaulting Chat Completions to DeepSeek V41 Flash, restoring the V4 Flash Vision catalog entry, and refreshing the generated client slot catalog. The update must reconcile those changes with the fork-owned Desktop packaging and the sanctioned `settings.update` seat instead of resetting the fork line.

## Decision

Integrate `dsh-v0.1.5-rc.1` at `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` from fork tip `c50e9ff42ed7d8b7ef1deffdea4eda9211277be5` through a reviewed manual merge and an equal-tree upstream-rooted candidate.

- Manual integration: `f5cf0b89132241c5663054278120e84b4422b0ed` (`integrate/dsh-0.1.5-rc.1`), tree `1fa304733e2ba2ac01bfcfc984cda31f45c73cc5`.
- Upstream-rooted candidate: `02afbfd944ab15a136114d91ac654cc60e3cc02b` (`candidate/dsh-0.1.5-rc.1`) on the verified tag commit, same tree, `0` behind the target.
- Master landing: `b3803fa799c220836a80d7875c1529e0f50d8649` on `publish/dsh-alpha2`, first parent the previous fork tip, second parent the candidate, tree equal to the candidate.

The merge was conflict-free; the review covered the six files both sides had touched. Adopt upstream sidebar, document-preview, guide start page, and stat-pill refinements, the DeepSeek model catalog changes (V41 Flash as the Chat Completions default, V4 Flash Vision restored), the updated dependency pins and lockfile, and the regenerated client slot catalog. Preserve Desktop packaging, branding, and the `settings.update` seat, and retain the `WebSocket closed 1006` transport classification, which `0.1.5-rc.1` does not include.

## Alternatives considered

Keeping `0.1.5-alpha.2` would leave the Desktop release behind the reviewed upstream candidate line and postpone the sidebar and catalog fixes. Replacing the fork tree with upstream would lose Desktop integration and reviewable ancestry. Carrying the multi-window work on this line would publish an unreviewed native change; it stays a fork-local branch instead.

## Consequences

Validate the LLM catalog and route defaults, the Desktop configuration and UI, built runtime startup and shutdown, and the synchronized lockfile. Desktop proceeds to an independent `0.1.15-astra` release on this base through the repository's release workflow. The multi-window feature remains fork-local and is not part of this synchronization.
