---
name: dsh-desktop-upstream-sync
description: Use when checking or synchronizing DeepDive with an upstream DeepSeek Harness tag or commit, including manual conflict integration and an authorized rebase-style rewrite of an unreleased sync branch.
---

# Synchronize DeepDive with upstream

Synchronize content manually first; choose the final Git topology only after the integrated tree is reviewed and verified. This workflow applies to upstream tag checks, full synchronization cycles, and unreleased sync-branch rewrites. It never authorizes rewriting published `master` or release tags.

## Hard rule: manual integration precedes rebase topology

Never reset the active fork branch to the upstream target, replace the whole tree with upstream, or reconstruct the fork from a directory allowlist and call that synchronization. Those operations hide conflicts and skip review of upstream changes that overlap the fork.

An upstream-based final branch is permitted only after a separate manual integration tree exists. The final rebased or rebuilt tree must match that reviewed integration result, except for explicitly documented history-only metadata.

## Protect and verify the starting points

1. Fetch the exact upstream tag or commit and confirm its remote SHA; do not trust a pre-existing local tag.
2. Record the local fork tip and the exact remote branch OID. Create a local backup ref before any history rewrite.
3. Use a separate temporary branch or worktree for manual integration. Keep the maintainer branch recoverable until the final tree passes verification.

## Build the manual integration tree

From the original fork tip, run a real no-commit merge of the verified upstream SHA so Git exposes both conflicts and clean auto-merges:

```sh
git merge --no-commit --no-ff <verified-upstream-sha>
```

Resolve and review in responsibility order:

1. Upstream API, transport, profile, persistence, and client-contract changes that Desktop depends on.
2. The explicitly sanctioned non-`desktop/` integration seams in root `AGENTS.md`.
3. Desktop runtime, overlay, bridge, client UI, and sidecar lifecycle.
4. Rust/Tauri native behavior and platform packaging.
5. Workflows, workspace metadata, lockfile, generated notices, and bilingual documentation.

For every overlapping path, decide who owns the behavior before choosing either side. Upstream-owned Harness behavior returns to the verified upstream implementation unless a current fork rule names a concrete integration blocker. Fork-owned branding, Desktop packaging, and native integration stay fork-owned. Resolve bilingual source files before re-recording pairing sidecars. Inspect auto-merged overlapping paths as well as textual conflicts; a conflict-free merge is not proof that the result is correct.

Commit the temporary integration only after its conflicts are resolved and its selected checks pass. That commit is the content reference for the final topology.

## Produce the authorized rebase-style branch

Only an explicitly authorized, unpublished sync branch may be rewritten. Rebase the fork-owned work onto the verified upstream SHA, or materialize the exact verified fork delta on top of that SHA. Drop obsolete historical synchronization commits instead of replaying old upstream trees over the new target.

The final branch must satisfy all of these conditions:

- the verified upstream SHA is an ancestor;
- the branch contains only fork-owned commits above that target;
- published `master` and release tags are unchanged;
- the final tree matches the manual integration commit, with every intentional exception named and reviewed.

Compare the trees directly before testing the final branch:

```sh
git diff --exit-code <manual-integration-commit> <rebased-head>
git merge-base --is-ancestor <verified-upstream-sha> <rebased-head>
git rev-list --count <rebased-head>..<verified-upstream-sha>
```

The behind count must be `0`. An ancestry or count check does not replace the tree comparison or behavior verification.

## Publish safely

Update `desktop/UPSTREAM_COMMIT` only after the target and integrated tree are verified. Mirror an upstream tag without changing its target. Before a rewritten push, fetch the fork branch again and use the exact observed OID in `--force-with-lease=<branch>:<oid>`; raw `--force` is forbidden.

Stop without pushing if the remote branch moved, the final tree differs from the manual integration result, any relevant check fails, or any fork delta remains unexplained.
