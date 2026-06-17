# Road to Math — Phase 0: First Build Definition

*Bridge document between the master product plan and the development plan.*

---

## 1. Purpose of Phase 0

Phase 0 defines the first real playable Road to Math build.

The master plan describes the long-term product vision. This document narrows that vision into a clear first build boundary so development can continue without scope drift.

Phase 0 must prove the core loop:

```text
Player → Road → World → Level → Instinct → Practice/Rush → Attempts → Mastery → Unlock
```

---

## 2. Core Build Decision

Road to Math is built from zero.

The earlier Math Rush game remains useful as a prototype and research reference for:

- Rush pacing
- answer timing
- sound/animation preferences
- what felt fun
- what felt annoying or messy
- family play observations

It should not define the architecture, persistence model, progression logic, mastery engine, or Road to Math content structure.

Reason:

> Math Rush proved the arcade mechanic. Road to Math is the real product.

---

## 3. First Product Slice

The first product slice is:

```text
Road to Arithmetic
4 Worlds
18 Levels
Practice Mode
Rush Mode
Player profile
Session tracking
Attempt logging
Basic mastery calculation
Level unlocks
Simple progress screen
Starter XP rewards
Arithmetic Roadblock placeholder/mixed check
```

The first version is not only a quiz screen. It should already prove the Road to Math structure and learning engine.

---

## 4. First Road Scope

Only Road to Arithmetic is included in Phase 0.

Road to Arithmetic is the foundation gate before Road to Algebra. It trains basic number instincts Algebra depends on.

The important design correction is **spiral mastery**:

```text
Counting Step, Number Compare, Number Line, and Patterns are not one-time starter levels.
They are reusable instincts that come back at harder difficulty bands.
```

Examples:

```text
Counting Step: whole numbers → negatives → fractions → decimals
Number Compare: whole numbers → negatives → fractions → expressions
Number Line: whole numbers → negatives → fractions → coordinates → graphs
Patterns: skip counting → operation patterns → function tables
```

---

## 5. Road to Arithmetic Level Plan

### World 1 — Whole Number Instinct

| Level | Name | Core Instinct | Main Question Formats |
|------|------|---------------|-----------------------|
| 1 | Count Forward / Backward | Counting step with whole numbers | Solve, Fill Blank, MC, True/False |
| 2 | Whole Number Line | Numbers as positions and movement | Solve, Fill Blank, MC, True/False |
| 3 | Compare Whole Numbers | Bigger/smaller/equal by value | Solve, Fill Blank, MC, True/False |
| 4 | Whole Number Patterns | Continue a sequence by detecting the repeated rule | Solve, Fill Blank, MC, True/False |

### World 2 — Add / Subtract Instinct

| Level | Name | Core Instinct | Main Question Formats |
|------|------|---------------|-----------------------|
| 5 | Quick Add | Combine small numbers quickly | Solve, Fill Blank, MC, True/False |
| 6 | Make Ten | Use 10 as an anchor for faster addition | Solve, Fill Blank, MC, True/False |
| 7 | Quick Subtract | Understand subtraction as removal / difference | Solve, Fill Blank, MC, True/False |
| 8 | Add / Subtract Mixed | Choose combining vs taking away | Solve, Fill Blank, MC, True/False |

### World 3 — Group / Split Instinct

| Level | Name | Core Instinct | Main Question Formats |
|------|------|---------------|-----------------------|
| 9 | Multiplication Groups | Multiplication as equal groups | Solve, Fill Blank, MC, True/False |
| 10 | Division Finder | Division as inverse grouping / sharing | Solve, Fill Blank, MC, True/False |
| 11 | Operation Patterns | Operation facts form repeated patterns | Solve, Fill Blank, MC, True/False |
| 12 | Missing Number Basics | Use inverse operations to find unknowns | Solve, Fill Blank, MC, True/False |

### World 4 — Pre-Algebra Gate

| Level | Name | Core Instinct | Main Question Formats |
|------|------|---------------|-----------------------|
| 13 | Order Sense | Respect operation order and grouping | Solve, Fill Blank, MC, True/False |
| 14 | Negative Number Line | Number-line movement can cross zero | Solve, Fill Blank, MC, True/False |
| 15 | Compare Negative Numbers | For negatives, farther right is greater | Solve, Fill Blank, MC, True/False |
| 16 | Negative Steps | Counting steps can move through zero | Solve, Fill Blank, MC, True/False |
| 17 | Missing Number Mixed | Unknowns can appear in different operations and positions | Solve, Fill Blank, MC, True/False |
| 18 | Arithmetic Roadblock | Mixed recall proves older instincts stayed available | Solve, Fill Blank, MC, True/False |

---

## 6. Road to Arithmetic Completion Gate

Before entering Road to Algebra later, the player must pass an Arithmetic Roadblock covering:

- counting steps / movement
- number-line reasoning
- comparing values
- patterns
- addition fluency
- subtraction fluency
- multiplication groups
- division finder
- missing numbers
- order of operations
- negative-number basics

In Phase 0, the Roadblock is a simple mixed-recall level. The later adaptive Roadblock system can replace or expand it with personalized retention logic.

---

## 7. Included in Phase 0

The first build includes:

- fresh project foundation
- local frontend app
- local backend API
- SQLite database
- player creation/selection
- player settings foundation
- Road to Arithmetic config
- 4 Worlds / 18 Levels
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

## 8. Not Included Yet

The following remain in the master plan, but are not part of this Phase 0 implementation pass:

- PixiJS overworld map
- world-completion cinematics
- Road to Algebra gameplay
- Geometry / Statistics / Calculus Roads
- full adaptive retention engine
- full Pop Quiz system
- full adaptive Roadblock system
- full family leaderboard
- placement quiz
- Word Problems
- advanced KaTeX-heavy notation
- graph questions
- public/cloud deployment
- school/classroom/teacher features
- mobile-first gameplay redesign

---

## 9. Mode Scope

### Practice Mode

Practice Mode is calm and accuracy-focused.

Purpose:

> Can the player answer correctly without pressure?

Practice Mode should support:

- one level at a time
- simple results after a short session
- accuracy tracking
- question type tracking
- submitted attempt logging

### Rush Mode

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

---

## 10. Non-Negotiable Product Rules

### One Level, One Instinct

Every level trains exactly one core instinct.

If a level requires two new instincts, it must be split.

### Spiral Instincts

Core instincts are allowed and expected to repeat across harder domains.

So `Number Line` is not one level forever. It is a reusable mental move that reappears when the math domain gets harder.

### Simple Answer Input Only

Every gameplay question must resolve to one of:

- number
- short symbol
- true/false
- multiple choice option

### Understanding First, Fluency Second

Practice proves understanding. Rush proves fluency. Roadblocks later prove retention.

### Phase 0 Exit Criteria

Phase 0 is complete when these are approved:

```text
Build from zero: approved
First Road: Road to Arithmetic
First content: 4 Worlds / 18 Levels
First modes: Practice + Rush
First progression: mastery-based unlocks
First storage: players, sessions, attempts, progress, XP
First exclusions: PixiJS, Algebra, full adaptive retention, full leaderboard
```
