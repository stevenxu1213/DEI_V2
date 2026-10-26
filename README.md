# BELONG — interactive local learning website

Open `index.html` directly, or run `node serve.mjs` and visit http://127.0.0.1:4173/. A local HTTP server is recommended for video seeking and consistent browser storage. No framework, build step, backend or package install is required.

## Content and assets

All 67 original screens and states remain in index.html. Existing fixed copy, images, design fonts and base stylesheet are preserved. Dynamic scores, selected answers, question counts, playback time and submitted conversation text now reflect the learner's actual record. The provided `video.mp4` is copied unchanged to assets/video.mp4 (1280 × 720, approximately 108.97 seconds).

The original demo notices and preview buttons remain verbatim. Preview actions and links from screens.html use `?preview=1` inside the hash: they display the original design states and do not write answers, watching completion, XP or course rewards. Main-navigation links leave preview mode and return to the real learning record.

## Learning behavior

- One video element is reused across the three video screens. Duration comes from metadata. Leaving pauses and saves playback; first viewing prevents seeking beyond watched content and uses normal speed. Only an actual end after watching the content unlocks the quiz.
- All eight answers use the existing answer-review text as their answer key. Submitted answers are immutable. Results are shown only after eight submissions.
- One correction round processes only missed questions. Original and corrected scores remain separate; XP equals ten times the number of correct first-attempt answers.
- Saving retains the requested navigation destination and the exact question or conversation turn. Learning data is persisted in this browser's localStorage under `belong-learning-v3`.
- Storage write failures use the original saving-error screen. Retry commits the retained in-memory answer before proceeding.
- Three role-play drafts and submitted responses persist. Hints and retries return to the same turn. Repeated submissions do not count twice. The original Maya replies and illustrative coaching feedback remain; there is no AI backend.
- Text validation rejects empty content, obvious repeated/gibberish text, and a small set of clearly unrelated examples. It does not claim general semantic understanding.
- A completion reward requires video completion, quiz target reached, three responses and acknowledgement of coach feedback. Below-target sessions can finish and return to the survey without a passed reward. Technical interruption is tracked separately.

## Survey configuration

Set `surveyReturnUrl` in config.js to the study's real HTTPS return URL, including any participant reference required by the study. It is empty by default: the existing survey handoff preview is retained and no external URL is invented.

## Limitations

Persistence is local to the same browser and origin, not a cross-device account. Clearing browser data removes the learning record. If storage itself is unavailable, failed writes retain data in memory until Retry saving succeeds. The original 80/100 coach score is explicitly illustrative and is not calculated from responses. No external AI API is required.

The `screens.html` review index preserves access to all 67 states, including the original unlinked save-error state. The main application reaches that state on a real storage error rather than through a new ordinary-user shortcut.
