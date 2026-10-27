# Phase 1 — Question correctness and reliable progression

This is the stabilization phase. The curriculum's Fractions / Decimals / Ratios phase remains separate.

## Behavior and policy

- Server-issued questions carry a durable question ID. Before submission the browser receives presentation data only, never the expected answer or correct-option flags.
- A question accepts one answer. Retrying returns its original saved result and counters, including after completion. Client-supplied answer keys and timings are ignored.
- Practice rounds require 10 submitted answers; Arithmetic Roadblock rounds require 20. Completion awards XP once and returns the same result on retry.
- Practice round counts, format introductions, streaks and pending questions survive navigation and refresh. Progress is stored in SQLite; localStorage only remembers the selected player.
- Rushes last 60 seconds. The server enforces the deadline. Requests received at/after the deadline cannot add new answers. No late-arrival grace period is applied. A retry of an already-saved answer still returns its result.
- One active Rush per player resumes with the original deadline and counters. The browser uses a monotonic countdown and rechecks it when visibility changes.
- Completion and abandonment are final. Repeated requests cannot award more XP; a conflicting terminal action returns 409. Empty completed Rushes earn no completion or personal-best XP.
- The UI locks submissions immediately, supports retries, and waits for an in-flight answer request before requesting the final Rush summary.
- Correct Practice answers award 1 XP; correct Rush answers 2 XP; validated completion 10 XP; a new Rush best 25 XP; first mastery 100 XP.

The configurable defaults are in `shared/src/content/default-policies.ts`:

| Standard mastery requirement | Default |
| --- | --- |
| Understanding (Practice accuracy) | 80% |
| Recognition (lowest qualifying per-format accuracy) | 75% |
| Fluency (best qualifying Rush accuracy) | 75% |
| Total attempts | 20 |
| Distinct play sessions | 1 |
| Practice attempts in each format | 3 |
| Answers in a qualifying Rush | 10 |

The 3-attempt format minimum and 10-answer Rush minimum are provisional product defaults, introduced to prevent single-answer evidence. They can be changed in the shared policy. Recognition remains zero until every format has sufficient evidence. Qualifying Rushes must also meet the level's average-answer-time benchmark. Express Pass requires two qualifying Rushes averaging at least 90% accuracy and bypasses standard Practice/attempt/session minimums.

The Arithmetic Roadblock cycles through all 17 constituent level generators. Mastery additionally requires submitted coverage of every constituent skill; random samples alone cannot pass that gate.

Understanding still uses lifetime Practice accuracy and fluency still uses the best qualifying Rush. Adaptive recent-history scoring and retention are deliberately deferred.

## Existing player compatibility and deployment

Migration 2 adds tables and columns. It preserves existing players, attempts, XP, mastered states, Gold Mastery and unlocked levels. Existing metrics are recalculated when that level is played again; earned unlocks are not removed. Old unfinished Rushes are marked abandoned with reason `protocol_upgrade`, because they have no server-issued questions. Their attempts remain intact.

Back up the SQLite database before deployment using SQLite's backup facility while the service is running, or stop the service before copying the database and associated WAL files. Deploy the frontend and backend together; the previous question-submission payload is no longer supported. Reload any browser tabs that were open during the upgrade. Do not reset the database.

Use Node 22 (at least 22.12; `.nvmrc` selects 22). Run `npm ci` after switching Node versions so the native SQLite module matches the runtime.

## Validation

```sh
npm ci
npm test
npm run validate:content
npx playwright install --with-deps chromium --only-shell
npm run test:e2e
```

`npm test` builds every workspace and runs shared and backend tests. Browser tests serve the production bundle against a real API and disposable SQLite database at `test-results/e2e.sqlite`. Only that disposable database is recreated by the test server. Browser tests must not be pointed at live player data.

Coverage includes independent mathematical truth checks, numeric blanks, boundaries, question ownership, forged payloads, duplicate retries, completion XP, abandonment, expiry, Practice persistence, mastery minima, Express Pass, Roadblock coverage and upgrading a version-1 database.

Browser tests cover real Practice completion, refresh, rapid input, lost-response retry, Rush resume/abandonment, completion while an answer is in flight, and a full Practice → Rush → next-level-unlock journey. CI runs build, unit/integration tests, content validation and Chromium tests, preserving traces on failure.

For an environment with an existing Chromium installation, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select its executable. Normal CI uses Playwright's pinned browser.

## Scope limits

This phase does not add authentication, public hosting, new curriculum, a graphics renderer or adaptive retention. The API remains for a trusted local/family network. Server-owned questions protect grading integrity; they do not make local player IDs an authentication mechanism.
