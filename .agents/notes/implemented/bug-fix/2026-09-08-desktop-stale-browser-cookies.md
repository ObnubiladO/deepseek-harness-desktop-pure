# Agent Note: Desktop startup removes stale browser login cookies

Status: implemented

English | [中文](2026-09-08-desktop-stale-browser-cookies.zh.md)

## Problem

Each random localhost port receives a distinct Harness browser-login cookie lasting thirty days. The embedded browser sends cookies for every port to the same host. After repeated restarts, cookies plus the combined plugin URL exceed Node's request-header limit: the index loads but the plugin request returns HTTP 431.

## Decision

Create the Desktop WebView on a blank page. Before initial navigation and sidecar reconnect, use Tauri's cookie API from a blocking worker to remove only `dsh-auth-` cookies with a 43-character base64url suffix for loopback hosts. Await cleanup before navigating to the authenticated readiness URL. The new token exchange creates the current browser session. The single-instance desktop owns this cookie store; provider OAuth credentials, Harness settings, sessions, unrelated cookies, and local storage remain untouched.

## Alternatives considered

Clearing cookies manually restores startup but permits recurrence. Raising the server's header limit postpones the failure and changes upstream hosting behavior. Clearing the entire WebView profile loses unrelated preferences. Changing upstream cookie authentication is unnecessary for the Desktop-owned store.

## Consequences

Cookie selection tests preserve unrelated names and domains. A regression reproduction sends a large stale-cookie header to the deployed index and plugin bundle, showing index HTTP 200 and bundle HTTP 431. Validate actual Desktop startup against the existing accumulated cookie store and verify subsequent restarts retain only the current login. Cookie API failures stop navigation and report the existing startup error instead of loading a broken page.
