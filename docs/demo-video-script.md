# Sinistr'IA - Demo video script (2 minutes, silent screen capture)

No voiceover, no talking head: on-screen captions carry the narration over a
silent screen recording, so the video works with sound off. Captions are
short, appear top-left, and fade before the next one. Cursor moves
deliberately; pause 1 to 2 seconds after each click before moving on so a
viewer's eye can land.

Capture at 1440x900 or the recording tool's closest match, apps already
running (`pnpm dev` or Docker Compose), demo queue already seeded so the
cockpit is not empty when the video reaches it.

| Time      | Screen                                    | Action                                                                                   | Caption                                             |
| --------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 0:00-0:06 | Mobile app, "Let us capture what happened." | Open the page. Let the header and hero rise-in animation play.                            | "The first ten minutes after a crash, captured."     |
| 0:06-0:12 | Mobile app, hero                            | Click "Load demo case" (honest case).                                                     | "One honest claim."                                  |
| 0:12-0:22 | Mobile app, voice capture                   | Press the mic button. Let the waveform play and the typewriter reveal the Derja narrative. | "Derja voice, structured live."                      |
| 0:22-0:30 | Mobile app, guided capture                  | Toggle the photo, constat, and invoice evidence checks on.                                | "Guided evidence, not a blind upload."                |
| 0:30-0:36 | Mobile app, submit                          | Click submit. Show the brief loading state.                                               | "Submitted."                                          |
| 0:36-0:44 | Mobile app, result                          | Result screen: green fast-track badge, high-confidence badge, claim id.                   | "Fast-tracked, with a reason, not just a score."      |
| 0:44-0:50 | Mobile app, hero (reload)                   | Reload, click "Load suspicious demo" instead, submit through the same flow (sped up).      | "One suspicious claim, same flow."                    |
| 0:50-0:56 | Mobile app, result                          | Result screen: colored investigate badge, low-confidence badge.                           | "Flagged for investigation, not accused."              |
| 0:56-1:04 | Cockpit, claims queue                       | Load the queue page. Let the metrics strip count up (total claims, time to FNOL, completeness, route counts).                | "Every claim lands here, live."                        |
| 1:04-1:12 | Cockpit, claims queue                       | Scroll the table. Point (cursor hover, no click) at a fast-track row and an investigate row, showing their route and confidence badges. | "Route and confidence, at a glance."                  |
| 1:12-1:20 | Cockpit, claim detail (suspicious)          | Open the suspicious claim. Show the h1 (claim id + route badge) and the state/confidence line.                          | "The full Evidence Twin: one screen, one story."       |
| 1:20-1:34 | Cockpit, claim detail (suspicious)          | Scroll to the decision hierarchy (why, proof), then click "Reveal relationship graph."                                  | "A reused phone number, a reused photo. Not an accusation, a pattern."|
| 1:34-1:44 | Cockpit, claim detail (honest)              | Back to queue, open the honest claim. Scroll its Evidence Twin (coverage clause, consistency, completeness).            | "Coverage grounded in the actual policy clause."       |
| 1:44-1:52 | Cockpit, claim detail (honest)              | Click "Approve and notify customer." Show the state change.                                                             | "A human approves. The machine never pays."            |
| 1:52-2:00 | Mobile app or cockpit, brand mark close-up  | Hold on the brand mark and product name.                                                                                | "Sinistr'IA. Capture the truth. Fast-track the honest. Investigate the suspicious." |

## Notes for the person recording

- Both demo cases and both hero-case claim detail pages should already exist
  in the seeded queue (`CLM-DEMO-*` ids from `data/manifest.json`), so there
  is no risk of an empty state or a slow live network call breaking the take.
- Cut, do not narrate over, any loading spinner longer than half a second;
  speed up in the edit instead of waiting on camera.
- If a second take is needed for the suspicious case, submitting it again is
  safe: mobile always posts a new claim and does not overwrite the seeded one.
- Export at 1080p, no audio track needed, captions burned in or as an SRT
  file depending on where the video is uploaded.
