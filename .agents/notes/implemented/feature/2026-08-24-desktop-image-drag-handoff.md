# Agent Note: Desktop attachment drag handoff and release feedback

Status: implemented

English | [中文](2026-08-24-desktop-image-drag-handoff.zh.md)

## Problem

The browser image-attachment entry accepts whole-page file drops, validates them through the composer, and displays the shared `DropOverlay`. Tauri's default native drag-drop handler consumes operating-system drops and emits paths instead of the browser `DragEvent` with its `File` objects, so Desktop cannot reach that entry reliably or give a release confirmation after a successful drop.

## Decision

The Desktop `WebviewWindowBuilder` disables Tauri's native drag-drop handler. The existing document-level composer listener receives browser `File` objects and remains the sole owner of image admission, busy and locked rejection, draft attachment creation, and submission.

The Desktop client plugin only observes browser file drags whose exposed MIME types are all accepted by the current DSH image intake: `image/png`, `image/jpeg`, `image/webp`, and `image/gif`. PDF, unknown MIME types, and mixed batches are blocked before the shared document listener, so they do not show a drop invitation or enter the attachment intake. This conservative hover rule uses `DataTransferItem.type`, because browser `File` objects remain protected until drop.

For an eligible drag, the plugin derives the work-area rectangle from the `data-shell-overlay` parent and the sidebar column beside it, then writes the rectangle to document-root CSS variables synchronously on file drag enter. The existing body-portaled `DropOverlay` therefore mounts directly in the work area instead of painting a full-window frame first. The sidebar stays visible and unblurred. Its visual and accessible invitation uses “Release to add” / “松开即可添加” while the composer accepts the drop, and “Cannot add now” / “当前无法添加” otherwise; the count-and-size line stays hidden. The plugin draws a short checkmark pulse at the release point when the browser reports `dropEffect: 'copy'`. Reduced-motion users receive the same state transition without animation.

Desktop does not expose dropped filesystem paths to the WebView or add a native upload command, filesystem permission, or parallel attachment pipeline.

## Verification

Desktop source tests require the Tauri handler opt-out and compare the Desktop MIME list against DSH's `ImageMediaType` declaration. The Desktop client interaction tests cover the work-area inset, concise accepted-drop copy, edge clamping, release cleanup, refusal state, and capture-phase rejection of PDF, unknown, and mixed file drags. The shared attachment tests continue to cover `File` intake, limits, and locked composer rejection.

## Alternatives considered

- **Bridge Tauri `onDragDropEvent` paths into a native upload command.** Rejected because it would bypass the browser-owned `File` admission path, expose filesystem paths to the WebView, and duplicate attachment ownership.
- **Change the shared attachment package for Desktop visuals.** Rejected because the Web interaction is already correct and the visual treatment only compensates for Desktop's native WebView integration.
- **Show a drag invitation for every file.** Rejected because current DSH only accepts four image MIME types, and a mixed batch is rejected as a whole.

## Consequences

Desktop and Web use the same accepted MIME set and draft lifecycle, while Desktop supplies the stronger drag focus and release feedback expected from a native application. A browser that does not expose a file MIME during hover receives no Desktop drag invitation rather than a guessed one. Re-enabling Tauri's native handler requires a complete replacement that still supplies browser `File` objects to the existing composer; a path-only bridge is not an equivalent substitute.
