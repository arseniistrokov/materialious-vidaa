# Materialious VIDAA adaptation plan

Upstream: https://github.com/Materialious/Materialious
Base commit: b08caf2310cea7340f897c5576795984b02e63b8, version 1.18.9.
License: AGPL-3.0; LICENSE, README authors/acknowledgements retained.
Local derivative, not an official Hisense/VIDAA/Google application.

## Findings verified before modifications

Original npm ci (lockfile, lifecycle scripts disabled), reviewed Shaka patch and npm run build succeeded.
The default adapter-static emitted build/index.html without running Android, Electron or a Node server.
Original static build rendered /setup in isolated Chrome 155 at 1920x1080, with no runtime exceptions.
This proves desktop SPA startup only. Actual VIDAA engine and media capabilities remain unverified.

UI components already present:
- routes/(app)/+layout.svelte: rail, search, settings, login, notifications, miniplayer.
- components/layout/ItemsList.svelte and ContentColumn.svelte: card grid and BBC LRUD spatial focus.
- components/thumbnail/*: video/channel/playlist cards, menus and watch progress.
- routes/(no-layout)/tv/[slug]: full-screen TV player, seeking, info, chapters and recommendations.
- components/player/Player.svelte: original Shaka/SABR, SponsorBlock, history and quality.
- routes/(app)/search: search/history/suggestions through original API/search functions.
- routes/(app)/settings: existing TV settings UI; all original tabs and feature logic retained.

## Implementation sequence

1. Add a TV *UI* capability independent of Android/native platform; reuse existing TV components.
   Do not pretend VIDAA is Android or an unrestricted native extraction environment.
2. TV skin: dark 1080p canvas, persistent left rail, 3 large cards per row, white visible focus,
   original Materialious branding and icons; no Google assets or proprietary code.
3. Normalize Hisense Back/media key codes; reuse BBC LRUD with a dialog-aware fallback;
   route restoration, input focus and existing TV player bindings keep their own handlers.
4. Add a remote-operated text-entry accessory feeding original inputs and search actions.
5. Add a separate /vidaa diagnostics route with same-origin synthetic Baseline/Main MP4/AAC tests.
   Include real MediaError/state/codec report and existing Shaka engine checks.
6. Compile with a conservative JS target; test original UI switch, adapted UI, search/settings,
   deterministic feed fixtures and real media decode/pause/seek in isolated Windows Chrome.
7. Publish a separate static test site plus corresponding source, preserving AGPL notifications.
   Keep the currently installed Probe URL/content unchanged. No Sidee/TV modifications.
8. Actual TV compatibility and playback require owner testing. Do not claim code 4 fixed first.

## Backend limits that the UI cannot remove

Static mode retains client features but needs an operational CORS-enabled Invidious/Companion
or a separately hosted Materialious full backend for server-side features.
backend.ts/isUnrestrictedPlatform is false on an ordinary static web deployment;
getVideoPageYTjs explicitly throws Platform not supported there. Do not remove that guard.
GitHub Pages cannot execute /api/proxy, /api/poToken, database/accounts or watch-party servers.
Do not claim that all full-server capabilities work with static hosting alone.

## Code 4 investigation

Original W3C Sintel: H264 High L3.0 (avc1.64001e), 854x480/24p/yuv420p;
AAC-LC 48kHz stereo. moov occurs AFTER mdat, not faststart. GET works from Windows.
Neither profile nor atom order alone establishes why VIDAA rejected it.
Four 24-second synthetic controls were generated locally and fully decoded by FFmpeg:
Baseline 360p/AAC44.1 mono; Baseline480p/AAC48 stereo; Main720p/AAC48 stereo;
Baseline360p without audio. All faststart. Not yet tested on the TV.
