# Agent Note: Desktop image drag handoff and release feedback

Status: implemented

English | [中文](2026-08-24-desktop-image-drag-handoff.zh.md)

## Problem

The browser image-attachment entry already accepts whole-page file drops, validates them through the composer, and displays the shared `DropOverlay`. Tauri's default native drag-drop handler consumes operating-system drops and emits paths instead of the browser `DragEvent` with its `File` objects, so Desktop cannot reach that entry reliably or give a release confirmation after a successful drop.

## Decision

The Desktop `WebviewWindowBuilder` disables Tauri's native drag-drop handler. The existing document-level composer listener receives browser `File` objects and remains the sole owner of image admission, busy and locked rejection, draft attachment creation, and submission.

The Desktop client plugin only observes those browser drag events. It derives the work-area rectangle from the `data-shell-overlay` parent and the sidebar column beside it, then writes the rectangle to document-root CSS variables synchronously on file drag enter. The existing body-portaled `DropOverlay` therefore mounts directly in the work area instead of painting a full-window frame first. The sidebar stays visible and unblurred. An accepted drop replaces the visual and accessible invitation with “Release to add” / “松开即可添加” and hides the count-and-size line; a rejected drop keeps the shared disabled copy. The plugin draws a short checkmark pulse at the release point when the browser reports `dropEffect: 'copy'`. Reduced-motion users receive the same state transition without animation.

Desktop does not expose dropped filesystem paths to the WebView or add a native upload command, filesystem permission, or parallel attachment pipeline.

## Verification

Desktop source tests require the Tauri handler opt-out. The Desktop client interaction tests cover the work-area inset, concise accepted-drop copy, edge clamping, release cleanup, and the absence of a confirmation for a refused drop. The shared attachment tests continue to cover `File` intake, limits, and locked composer rejection.

## Alternatives considered

- **Bridge Tauri `onDragDropEvent` paths into a native upload command.** Rejected because it would bypass the browser-owned `File` admission path, expose filesystem paths to the WebView, and duplicate attachment ownership.
- **Change the shared attachment package for Desktop visuals.** Rejected because the Web interaction is already correct and the visual treatment only compensates for Desktop's native WebView integration.
- **Show a success animation for every file drop.** Rejected because a locked or busy composer intentionally refuses the file; `dropEffect: 'copy'` is the browser's accepted-drop signal.

## Consequences

Desktop and Web use the same image validation and draft lifecycle, while Desktop supplies the stronger drag focus and release feedback expected from a native application. Re-enabling Tauri's native handler requires a complete replacement that still supplies browser `File` objects to the existing composer; a path-only bridge is not an equivalent substitute.
