# Road to Math — Phase 0: First Build Definition

*Bridge document between the master product plan and the development plan.*

---

## 1. Purpose of Phase 0

Phase 0 defines the first real version of **Road to Math** that will be built.

The master plan describes the full long-term product vision. Phase 0 narrows that vision into a clear first build boundary so development can start without scope drift.

Phase 0 is not a task list, sprint plan, or implementation plan. It answers:

> What exactly are we building first, what are we not building yet, and which product rules must not be broken?

---

## 2. Core Build Decision

Road to Math will be built **from zero**.

The existing Math Rush game is treated as a prototype and research reference only.

It may influence:

- the feeling of Rush Mode
- timing and pacing lessons
- sound and animation preferences
- what felt fun
- what felt annoying or messy
- family play observations

It should **not** be used as the foundation for:

- architecture
- database structure
- routing
- UI component hierarchy
- local storage model
- progression logic
- player/session model
- mastery engine

Reason:

> Math Rush proved the arcade mechanic. Road to Math is the real product.

---

## 3. First Product Slice

The first build should create a small but real Road to Math experience.

The first product slice is:

```text
Road to Arithmetic
3 Worlds
9 Levels
Practice Mode
Rush Mode
Player profile
Session tracking
Attempt logging
Basic mastery calculation
Level unlocks
Simple progress screen
Starter XP rewards
```

The first version is not only a single quiz screen. It should already prove the core Road to Math structure:

```text
Player → Road → World → Level → Instinct → Practice/Rush → Attempts → Mastery → Unlock
```

---

## 4. First Road Scope

Only **Road to Arithmetic** is included in the first build.

Road to Arithmetic is the foundation gate before Road to Algebra. It trains the basic number instincts Algebra depends on.

### World 1 — Number Sense

| Level | Name | Core Instinct | Main Question Formats |
|------|------|---------------|-----------------------|
| 1 | Quick Add | Combine small numbers quickly | Solve, Fill Blank, MC, True/False |
| 2 | Quick Subtract | Understand subtraction as distance / removal | Solve, Fill Blank, MC, True/False |
| 3 | Make Ten | Use 10 as an anchor for faster addition | Solve, Fill Blank, MC |

### World 2 — Core Operations

| Level | Name | Core Instinct | Main Question Formats |
|------|------|---------------|-----------------------|
| 4 | Multiplication Facts | Recall and recognize core multiplication facts | Solve, Fill Blank, MC, True/False |
| 5 | Division Facts | Division as inverse of multiplication | Solve, Fill Blank, MC, True/False |
| 6 | Missing Number | Treat unknowns as fillable values | Solve, Fill Blank, MC |

### World 3 — Mixed Fluency / Algebra Gate

| Level | Name | Core Instinct | Main Question Formats |
|------|------|---------------|-----------------------|
| 7 | Mixed Operations | Choose the correct operation under light pressure | Solve, MC, True/False |
| 8 | Order Sense | Respect operation order in simple expressions | Solve, MC, True/False |
| 9 | Negative Basics | Understand simple negative movement and absolute value | Solve, Fill Blank, MC, True/False |

### Road to Arithmetic Completion Gate

Before entering Road to Algebra later, the player must pass an Arithmetic Roadblock covering:

- addition fluency
- subtraction fluency
- multiplication facts
- division facts
- missing numbers
- order of operations
- negative-number basics

In the first build, the Roadblock can be represented as a placeholder state or simple locked gate. The full Roadblock experience can be implemented later.

---

## 5. Included in the First Build

The first build includes:

- fresh project foundation
- local frontend app
- local backend API
- SQLite database
- player creation/selection
- player settings foundation
- Road to Arithmetic config
- 3 Worlds / 9 Levels
- generated questions from config
- Practice Mode
- Rush Mode
- submitted answer logging
- session tracking
- basic XP earning
- basic mastery calculation
- level unlocks
- simple progress display
- abandoned Rush rules
- keyboard-first gameplay input

---

## 6. Not Included Yet

The following remain in the master plan, but are **not part of the first build**:

- PixiJS overworld map
- world-completion cinematics
- Road to Algebra gameplay
- Geometry / Statistics / Calculus Roads
- full adaptive retention engine
- full Pop Quiz system
- full Roadblock system
- full family leaderboard
- placement quiz
- Word Problems
- advanced KaTeX-heavy notation
- graph questions
- public/cloud deployment
- school/classroom/teacher features
- mobile-first gameplay redesign

These are intentionally postponed so the first build can prove the core engine cleanly.

---

## 7. First Mode Scope

### Included Now

#### Practice Mode

Practice Mode is calm and accuracy-focused.

Purpose:

> Can the player answer correctly without pressure?

Practice Mode should support:

- untimed or lightly pressured questions
- one level at a time
- simple results after a short session
- accuracy tracking
- question type tracking
- submitted attempt logging

#### Rush Mode

Rush Mode is the arcade fluency proof.

Purpose:

> Can the player answer accurately and quickly under light pressure?

Rush Mode should support:

- timer
- streak
- combo multiplier
- fast-answer bonus
- instant next question after correct or wrong answer
- wrong answer breaks streak but does not stop play
- end-of-rush summary
- abandoned Rush handling
- attempt logging

### Known Modes, Not Fully Built Yet

The data model should know these modes exist, but they do not need full UX in the first build:

- Learn Mode
- Review Mode
- Pop Quiz
- Roadblock

---

## 8. Non-Negotiable Product Rules

These rules must guide all development.

### One Level, One Instinct

Every level trains exactly one core instinct.

If a level requires two new instincts, it must be split.

### Simple Answer Input Only

Every gameplay question must resolve to one of:

- typed number
- single missing number
- multiple-choice key
- true/false key

No free-form algebra input in the first major version.

### XP Motivates, Mastery Unlocks

XP rewards effort, consistency, streaks, and achievements.

XP never unlocks serious progression by itself.

### Rush Proves Fluency

Rush is not the main teaching tool.

Rush proves speed and accuracy after the player has enough comfort, unless the player chooses the Express Pass-style path later.

### Practice Builds Comfort

Practice exists to build correctness, comfort, and recognition before pressure.

### Gameplay Is Keyboard-First

Menus can support mouse/touch.

Active gameplay should prioritize keyboard input.

### Attempts Are Always Logged

Every submitted answer attempt is saved.

The system stores what happened, even if the final session result does not count for positive progression.

### Wrong Answers Do Not Stop Rush

Wrong answer behavior:

```text
Wrong answer → streak breaks → multiplier resets → quick feedback → next question
```

No blocking modal during Rush.

### The Tone Must Stay Encouraging

Mistakes should feel like useful signals, not failure labels.

Road to Math should feel like:

> “We found what to sharpen.”

Not:

> “You failed.”

---

## 9. Starter XP Rules

Starter values are intentionally simple and tuneable.

| Event | Starter XP |
|------|------------|
| Correct Practice answer | +1 XP |
| Correct Rush answer | +2 XP |
| Practice session completed | +10 XP |
| Rush completed | +10 XP |
| New personal best | +25 XP |
| Level Mastered | +100 XP |
| Gold Mastery earned | +150 XP |
| World completed | +500 XP |
| Daily play streak bonus | +10 XP × streak day, capped at +100 |
| Pop Quiz passed | +20 XP, later phase |
| Roadblock cleared | +75 XP, later phase |

XP does not replace mastery.

If XP and mastery ever conflict, mastery wins.

---

## 10. Abandoned Rush Rule

If a player exits Rush before the timer ends:

- all submitted attempts are still logged
- the Rush does not count as completed
- no Rush completion XP is awarded
- it does not count for Express Pass
- it does not count for personal best
- it does not count for leaderboard records
- it does not count as positive evidence for level unlock
- the attempts may still be used for weakness diagnostics later

This preserves useful learning data without allowing abandoned Rushes to inflate progression.

---

## 11. First Data Scope

The first build must store enough data to support mastery and future retention.

Minimum first-build data entities:

```text
players
player_settings
play_sessions
question_attempts
rush_sessions
level_progress
xp_events
```

Every submitted answer attempt should store:

```text
player_id
session_id
road_id
world_id
level_id
instinct_id
question_template_id
question_type
mode
is_correct
answer_value
expected_answer
answer_time_ms
question_payload_json
created_at
```

The exact schema can be finalized in the dev architecture phase, but these data concepts are required from the start.

---

## 12. First Mastery Scope

The first build should include basic mastery signals:

| Signal | Included in First Build? | Notes |
|-------|---------------------------|-------|
| Understanding | Yes | Practice accuracy |
| Recognition | Yes, basic | Accuracy across question formats |
| Fluency | Yes | Rush speed and accuracy |
| Retention | Structure only | Full adaptive retention later |

First build unlock can use:

```text
Understanding ≥ 80%
Recognition ≥ 75%
Fluency ≥ 75%
Minimum attempts rule
```

The exact thresholds can follow the master plan and be tuned after playtesting.

Gold Mastery can exist as a state but should not become a full feature until retention exists.

---

## 13. First UX Scope

The first build can be visually simple, but it must already feel like a game.

Required feeling:

- Practice feels calm
- Rush feels fast
- progress feels visible
- feedback feels encouraging
- keyboard input feels immediate
- the player feels they are moving through a Road, not answering random questions

Acceptable for first build:

- simple screen layout
- simple progress list instead of full map
- basic animations
- basic sound
- basic profile screen

Not acceptable:

- messy architecture
- unclear progression
- answers not saved
- XP unlocking levels directly
- Rush blocking on wrong answers
- questions that require complex free-form input

---

## 14. First Version Success Definition

The first version is successful when:

```text
A player can create or choose a profile, enter Road to Arithmetic, play Practice and Rush across real configured levels, have every submitted answer saved, see simple progress, earn XP, and unlock new levels through mastery signals.
```

That is the first complete Road to Math product slice.

It does not need to be visually final.

It does need to prove the product engine.

---

## 15. Decisions Still Needed Before Dev Planning

Only a few product decisions remain before turning this into a macro dev plan.

### Decision 1 — Learn Mode in First Build

Choose one:

**Option A — Postpone Learn Mode**

First build includes Practice + Rush only. Learn Mode comes after the core engine works.

**Option B — Basic Learn Mode Included**

Each level gets a simple concept card before Practice.

Recommendation: **Option A** for cleanest first build, unless the first testers need guidance immediately.

---

### Decision 2 — Roadblock in First Build

Choose one:

**Option A — Placeholder Gate Only**

Road to Algebra remains visually locked. No full Roadblock gameplay yet.

**Option B — Simple Arithmetic Roadblock Included**

After Level 9, the player gets a mixed final check.

Recommendation: **Option A** first. Build Roadblocks properly when Review/Retention starts.

---

### Decision 3 — First UI Navigation Style

Choose one:

**Option A — Simple Road List**

Road → World → Level displayed as clean cards/lists.

**Option B — Early Mini Map**

A simple non-Pixi visual path of nodes.

Recommendation: **Option A** first. Do not start visual map work before mastery data is reliable.

---

### Decision 4 — Account Model

Choose one:

**Option A — Local Players Only**

No passwords or login. Family members choose their player profile on the home server.

**Option B — Simple PIN/Password Per Player**

Each player can protect their profile with a simple local PIN/password.

Recommendation: **Option A** for first build, unless kids changing each other's profiles becomes a real concern.

---

## 16. Phase 0 Exit Criteria

Phase 0 is complete when these are approved:

```text
Build from zero: approved
First Road: Road to Arithmetic
First content: 3 Worlds / 9 Levels
First modes: Practice + Rush
First progression: mastery-based unlocks
First storage: players, sessions, attempts, progress, XP
First exclusions: PixiJS, Algebra, full retention, full leaderboard
Remaining decisions: answered
```

After Phase 0 is approved, the next step is the macro dev plan.
