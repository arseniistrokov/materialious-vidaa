# Validation of the VIDAA derivative

Target reported by the owner: Chromium 111.0.5563.146 / VIDAA-MT9602.
The original Probe launches on the TV, but its original W3C MP4 failed with MediaError code 4.
No Materialious code has yet been executed or installed on the target TV by this agent.

## Baseline

Upstream b08caf2310cea7340f897c5576795984b02e63b8, version 1.18.9.
Original static web build succeeded before UI modifications.
Original SPA rendered /setup in Windows Chrome 155 with no uncaught runtime exceptions.
No APK, Electron application or Node server was built/run.

## Automated desktop checks

Type-check: zero errors (upstream and adaptation accessibility/reactivity warnings remain).
ESLint: zero errors; two pre-existing unused-disable warnings remain.
Production build: adapter-static, JS target Chromium 111, fixed Pages subpath.

Real HTML5 and Shaka media tests (not mocked video.play):
- A Baseline 360p / AAC-LC 44.1 kHz mono: video frames and nonzero PCM.
- B Baseline 480p / AAC-LC 48 kHz stereo: video frames and nonzero PCM.
- C Main 720p / AAC-LC 48 kHz stereo: video frames and nonzero PCM.
- D Baseline 360p without audio: video frames and zero audio PCM.
Both engines passed pause, forward seek 10 s, resume and backward seek 10 s.
Windows full-file FFmpeg decode also succeeded for all four files.
A separate two-variant DASH control is generated from these same test patterns.

UI regression checks use a local deterministic Invidious-shaped API fixture:
original API/store flow, grid/card rendering, BBC LRUD right/down, Russian input into
original search, original settings, and the original-UI comparison switch.
The fixture data is NOT published as a real feed and is NOT evidence of live YouTube playback.
The full original TV Player and quality control are checked with the generated DASH control.
A test removes Promise.withResolvers before page loading to exercise the compatibility shim.
This tests that missing API, not a full emulation of Chromium 111 or VIDAA hardware.

## What remains unverified

Physical TV remote events, TV native/audio/MSE decoding, code 4 remediation on TV,
YouTube availability/ad-free playback, SponsorBlock against a real video, backend accounts,
full-server features, persistence across reboot and operation after reboot with the PC off.
All of these require either an owner hardware test or an operational external backend.

## Privacy / deployment

Publish this derivative separately. Keep arseniistrokov/vidaa-youtube-test main commit
8217ede9a0057dc2fda1f5ab5489299709277799 unchanged.
Do not register, launch, remove or update TV tiles; do not change pairing or system settings.
Source archive must include original LICENSE/README plus the actual modified source/build script.
No local Sidee runtime/session, credentials, private IP addresses or Windows user paths belong
in the publication. Only repository source and generated static application assets are deployed.
