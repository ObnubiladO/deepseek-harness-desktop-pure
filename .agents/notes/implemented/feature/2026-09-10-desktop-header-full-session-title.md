# Agent Note: Full session title in the Desktop conversation header

Status: implemented

English | [中文](2026-09-10-desktop-header-full-session-title.zh.md)

## Problem

The conversation header renders the session breadcrumb from `ConversationRoot.module.css`, where every crumb is capped at `max-width: 220px`. The current session's own title is a crumb, so a title that fits the header still arrives shortened while the row's middle space stays empty: the 43-character title `Audit CPU Undervolting Automation Project (9)` reached the user as `Audit CPU Undervolting Auto…`. DeepDive users identify and navigate sessions by title, and a cut title is indistinguishable from a shorter one that happens to end there.

## Decision

The current crumb no longer carries the ancestor width cap, and every crumb can now shrink below its content width inside the flex row: `.crumbCurrent` sets `max-width: none`, and `.crumb` gains `min-width: 0` in `packages/client/ui-conversation/src/client/skeleton/ConversationRoot.module.css`.

- The current title takes the width the ancestor crumbs and the trailing header controls leave. Those controls (`.headerActions`, `.headerUtilities`, `.headerCorner`) are `flex: none`, so the title grows only into space nothing else claims.
- Ancestor crumbs keep the 220px cap, so a parent-and-subagent chain stays compact and leaves the current title the room it needs.
- `overflow: hidden`, `text-overflow: ellipsis`, and `white-space: nowrap` are unchanged, so a window too narrow for the title still shows one truncated line instead of painting over the header utilities or the tab strip.

This is a fork-owned delta in an upstream file, so a synchronization that changes `.crumb` merges rather than overwrites, and the integration review re-checks that the current crumb has no width cap.

## Alternatives considered

**Keep the upstream cap and read the title elsewhere.** The window title bar and the sidebar's hover card both carry the full title, so the header could have stayed exactly as upstream shipped it. Rejected: the header is where the title is read while working, and a title that needs a hover or a window-manager tooltip is worse than one that fits.

**Wrap the title onto two lines.** Rejected: the header is a 30px minimum-height row with the tab strip directly below it and the conversation scrollport below that, so a wrapping title would move the tabs and the transcript whenever a title is long.

**Add a hover reveal to the crumb.** Rejected as a substitute for showing the title: it duplicates the sidebar's hover card for a case the header already has room to solve, and it does nothing for a title that fits.

**Drop the ellipsis and let the title overflow.** Rejected: a nowrap row without `text-overflow` would paint the title over the mode chips and the header utilities in a narrow window.

## Consequences

The header shows the session title in full whenever the window has room and keeps the upstream single-line ellipsis when it does not; ancestor crumbs, the mode chips, and the trailing controls are unchanged. DeepDive carries one more delta in an upstream-owned stylesheet, which the next synchronization must preserve.

## Testing

No test pins the geometry: the owning client tests run in jsdom, which does not compute layout, and the Playwright web lane (`apps/web/tests/*.e2e.ts`) skips on Windows. The change is verified against the built Desktop app instead, by inspecting the bundled client stylesheet for the rule and by reading the header of a session whose title is longer than the ancestor cap.
