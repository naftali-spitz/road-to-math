# Road to Math — Master Product & Design Specification

*Single source of truth for the current Road to Math product direction. This file supersedes older Road to Math roadmap notes that assumed a 3-world / 9-level Arithmetic build.*

---

## 1. Final Vision

Road to Math is a mastery-based, continuous mathematical adventure that turns the core logic moves of mathematics into instinct.

It should look, sound, and feel like a high-velocity arcade puzzle game, but underneath the arcade layer is a serious learning engine built on:

- understanding first
- fluency second
- spaced review
- adaptive retention
- mastery-based progression
- long-term road climbing

The goal is not simply to help players answer math questions.

The goal is to help players reach the point where core math moves feel automatic — the same way times tables can become instant.

A player should not only know how to solve:

> 2x + 3 = 11

They should look at it and immediately feel:

> Remove 3, then divide by 2.

That is the heart of the product:

> **Turning logic into instinct.**

---

## 2. Product Identity

Road to Math should feel like:

- arcade speed game
- math fluency trainer
- world-map adventure
- personal mastery journey
- family competition platform

It should not feel like:

- a worksheet
- a school test
- a boring quiz app
- a speed-only drill
- a fake game with math pasted on top

The first target environment is family/home use: kids, teens, and parents playing short sessions on a local or private server.

The first identity is:

> **A family-focused arcade mastery game for math fluency.**

---

## 3. Emotional Promise

Road to Math should make the player feel:

- I am climbing.
- I am getting faster.
- I understand the move.
- I can beat my old self.
- Old skills are not disappearing.
- Mistakes show me what to sharpen, not that I failed.

Progression gates, Roadblocks, Pop Quizzes, and mastery decay must be framed as sharpening tools, not punishments.

---

## 4. Long-Term Road Map

The long-term map should remain visible, even when future Roads are locked.

```text
Road to Arithmetic
→ Road to Fractions / Decimals / Ratios
→ Road to Algebra
→ Road to Geometry
→ Road to Statistics
→ Road to Calculus
```

| Road | Subject | Status |
|------|---------|--------|
| Road to Arithmetic | Whole numbers, operations, negatives, pre-algebra gate | Phase 0 current build |
| Road to Fractions / Decimals / Ratios | Parts, precision, equivalence, ratio thinking | Phase 1 planned next |
| Road to Algebra | Variables, equations, functions, light graphs | Future major Road |
| Road to Geometry | Shapes, area, proofs, trigonometry | Future |
| Road to Statistics | Data, probability, distributions | Future |
| Road to Calculus | Limits, derivatives, integrals | Future |

Road to Algebra is still a major destination, but it should not be rushed before number-line, comparison, pattern, fraction, decimal, and ratio instincts are strong.

---

## 5. Structural Hierarchy

The game is built as a data-driven tree. Content should be decoupled from visual components.

```text
Road to Math
  └── Road
        └── World
              └── Level
                    └── One Core Instinct
                          └── Question Formats
                                └── Mode Loops
```

The core loop is:

```text
Player → Road → World → Level → Instinct → Practice/Rush → Attempts → Mastery → Unlock
```

Adding new math content should mainly require content configuration, question generators, and tests — not a rewrite of the engine.

---

## 6. What Is a Math Instinct?

A math instinct is a small, repeatable mental move that becomes fast and reliable through practice.

Examples:

| Topic | Instinct |
|-------|----------|
| Counting | Move by a fixed step forward/backward |
| Number line | See numbers as positions and movement |
| Comparison | Know which value is greater/smaller/equal |
| Patterns | Detect and continue a repeated rule |
| Make Ten | Use 10 as an anchor |
| Multiplication | See equal groups |
| Division | Reverse equal groups |
| Missing number | Use inverse operation to find the blank |
| Order sense | Apply operation priority before calculating |
| Negative numbers | Use number-line position across zero |
| Fractions | See parts as positions between whole numbers |
| Algebra | Treat variables as unknown values that can be transformed |

Instinct does not mean blind memorization. It means the player can:

- recognize the pattern
- know the correct move
- apply it accurately
- apply it quickly
- still apply it later

---

## 7. Spiral Mastery Rule

The key design correction for Phase 0 is **spiral mastery**.

Some ideas are not one-time levels. They are reusable instincts that come back at harder difficulty bands.

```text
Counting Step
Number Compare
Number Line
Patterns
Missing Number
```

These should repeat over time:

| Instinct | Early Form | Later Forms |
|----------|------------|-------------|
| Counting Step | 2, 4, 6, 8, ? | negative steps, fraction steps, decimal steps, algebraic sequences |
| Number Compare | 8 vs 15 | negatives, fractions, decimals, expressions |
| Number Line | start at 6, move +4 | crossing zero, fractions between numbers, coordinates, graphs |
| Patterns | +2 sequence | operation patterns, ratios, function tables |
| Missing Number | 7 + ? = 12 | mixed operations, fractions, equations, functions |

So the product should not treat “Number Line” or “Patterns” as one beginner lesson that disappears. They are recurring mental moves.

---

## 8. Question Format Model

Each level trains one instinct through several structural views.

Current Phase 0 formats:

| Format | Purpose |
|--------|---------|
| Solve | Directly perform the move |
| Fill Blank | Complete part of the structure |
| True / False | Verify whether a statement is valid |
| Multiple Choice | Recognize the answer among distractors |

Future format:

| Format | Purpose |
|--------|---------|
| Word Problem | Map language into the same structure |

The answer should stay simple:

- typed number
- short symbol
- true/false
- multiple choice option

No free-form algebra expression input is required in the core game loop.

---

## 9. Gameplay Modes

The long-term mode pipeline is:

```text
Learn → Practice → Rush → Review → Retention Check
```

### Learn Mode

Introduces the new instinct without pressure. It should feel like a short game tutorial, not a lecture.

### Practice Mode

Accuracy-focused. It answers:

> Can the player do this correctly without pressure?

Practice should track accuracy, question format, and attempts.

### Rush Mode

Timed arcade fluency proof. It answers:

> Can the player answer accurately and quickly under light pressure?

Rush should include timer, streak, combo, fast-answer bonus, instant next question, and summary.

### Review Mode

Player-triggered sharpening of older skills.

### Pop Quiz / Retention Check

System-triggered recall check based on mastery freshness and weak spots.

### Roadblock

Gate check before major transitions. It should verify that older instincts are still available before the player moves into a harder domain.

---

## 10. Mastery Model

Every submitted answer should be logged.

Mastery is based on multiple signals:

| Signal | Meaning |
|--------|---------|
| Understanding | Can answer correctly in Practice |
| Recognition | Can recognize the same instinct across formats |
| Fluency | Can answer quickly enough in Rush |
| Retention | Can still answer later after time has passed |

XP is emotional reward and progress feedback.

XP must never bypass mastery gates.

---

## 11. Phase 0 Current Build: Road to Arithmetic

Phase 0 is the first real playable Road to Math build.

It includes:

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
Starter XP rewards
Arithmetic Roadblock mixed-recall level
```

### World 1 — Whole Number Instinct

| Level | Name | Core Instinct | Sample |
|------|------|---------------|--------|
| 1 | Count Forward / Backward | Counting step with whole numbers | 5, 10, 15, ? → 20 |
| 2 | Whole Number Line | Numbers as position and movement | Start at 6, move +4 → 10 |
| 3 | Compare Whole Numbers | Bigger/smaller/equal by value | 7 __ 9 → < |
| 4 | Whole Number Patterns | Continue a repeated rule | 2, 4, 6, 8, ? → 10 |

### World 2 — Add / Subtract Instinct

| Level | Name | Core Instinct | Sample |
|------|------|---------------|--------|
| 5 | Quick Add | Combine small numbers quickly | 8 + 7 = ? → 15 |
| 6 | Make Ten | Use 10 as an anchor | 6 + ? = 10 → 4 |
| 7 | Quick Subtract | Removal / difference | 14 - 6 = ? → 8 |
| 8 | Add / Subtract Mixed | Choose combining vs taking away | 13 - 4 = ? → 9 |

### World 3 — Group / Split Instinct

| Level | Name | Core Instinct | Sample |
|------|------|---------------|--------|
| 9 | Multiplication Groups | Equal groups | 3 × 4 = ? → 12 |
| 10 | Division Finder | Reverse equal groups | 20 ÷ 5 = ? → 4 |
| 11 | Operation Patterns | Operation facts form rules | Rule ×3, input 5 → 15 |
| 12 | Missing Number Basics | Use inverse operation | 7 + ? = 12 → 5 |

### World 4 — Pre-Algebra Gate

| Level | Name | Core Instinct | Sample |
|------|------|---------------|--------|
| 13 | Order Sense | Operation priority and grouping | 2 + 3 × 4 = ? → 14 |
| 14 | Negative Number Line | Movement across zero | Start at -2, move +5 → 3 |
| 15 | Compare Negative Numbers | Farther right is greater | -6 __ -2 → < |
| 16 | Negative Steps | Step patterns through zero | -6, -4, -2, 0, ? → 2 |
| 17 | Missing Number Mixed | Unknowns in different positions | ? - 4 = 9 → 13 |
| 18 | Arithmetic Roadblock | Mixed recall | mixed older skills |

### Completion Gate

Before moving beyond Arithmetic, the player must prove:

- counting movement
- number-line movement
- comparison
- patterns
- addition/subtraction fluency
- multiplication/division foundation
- missing-number thinking
- order sense
- negative-number basics

In Phase 0 this is represented by a mixed Arithmetic Roadblock level. Later it can become a personalized adaptive Roadblock.

---

## 12. Phase 1 Planned Direction

Phase 1 should not jump directly to full Algebra.

The next best content slice is:

```text
Road to Fractions / Decimals / Ratios
```

Purpose:

> Reuse the same instincts from Arithmetic with harder number domains.

Suggested Phase 1 levels:

```text
1. Fraction Meaning
2. Fraction Number Line
3. Compare Fractions
4. Equivalent Fractions
5. Fraction Patterns
6. Decimal Number Line
7. Compare Decimals
8. Fraction / Decimal Conversion
9. Ratio Basics
10. Phase 1 Roadblock
```

This directly supports the spiral mastery model:

```text
Number Line → Fraction Number Line → Decimal Number Line
Number Compare → Compare Fractions → Compare Decimals
Patterns → Fraction Patterns → Ratio Patterns
Missing Number → Fraction/Ratio unknowns
```

Road to Algebra should start after this foundation is strong.

---

## 13. Road to Algebra Long-Term Direction

Road to Algebra remains a major future Road.

It should eventually include:

- variable meaning
- expression evaluation
- one-step equations
- two-step equations
- balance/transform instinct
- inequalities
- coordinate plane
- function tables
- linear functions
- slope
- systems
- quadratic foundations
- sequences and patterns

The old 28-level Algebra map is considered a long-term content reservoir, not the immediate next implementation target.

The first Algebra slice should be small and complete, with the full loop:

```text
Learn → Practice → Rush → Review → Retention Check
```

---

## 14. Retention and Roadblocks

Retention is not punishment. It is the proof that old instincts did not disappear.

The system should eventually track:

- weak levels
- weak question formats
- slow but correct answers
- forgotten older skills
- repeated mistakes
- retention interval per skill

Roadblocks should use a mix of:

- older weak skills
- recent skills
- transition-critical skills

If the player succeeds, retention frequency can go down.

If the player struggles, retention frequency should go up and include more targeted review.

---

## 15. Admin Hub vs Player Profile

These are separate concepts.

### Player Profile

For the player/child:

- name
- avatar/color/theme later
- XP
- current road/world/level
- recent wins
- settings/preferences

### Admin Hub

For the parent/developer:

- all players
- progress by player
- weak levels
- recent attempts
- rush sessions
- unlock state
- reset/debug tools later

The user-facing profile should not feel like a management dashboard.

---

## 16. Technical Direction

Current stack:

- React + Vite frontend
- Node + Express backend
- shared TypeScript package
- SQLite local database
- npm workspaces

SQLite is acceptable for the current family/local-server target.

Long-term scalability rule:

```text
Keep DB access isolated so PostgreSQL can replace SQLite later if concurrency grows.
```

Do not build game logic directly around SQLite quirks.

---

## 17. UI / Game Feel Direction

The current Phase 0 UI can be simple, but the target feeling is still a game.

Important future polish:

- stronger Road map layout
- player profile popup
- separate Admin hub
- satisfying but not headache-inducing correct answer effect
- noticeable but controlled confetti
- optional background music
- distinct sounds for actions
- Rush timer sound cues
- full themes: Futuristic, Modern, Kids / Colorful
- clear locked-level explanations
- clear “what to do next” guidance

The app should not feel like a developer dashboard once the engine is stable.

---

## 18. Phase 0 Exit Criteria

Phase 0 is ready for Phase 1 when:

```text
Clean clone builds
All tests pass
Road to Arithmetic has 4 Worlds / 18 Levels
Docs and code match
Question generation works for every level and format
Practice works
Rush works
XP works
Unlocks work
Arithmetic Roadblock exists
Player profile is understandable
Admin hub direction is clear
Frontend feels like a small game, not only a prototype
Home server deployment is repeatable
No gameplay progress depends on browser localStorage
```

---

## 19. Implementation Priority

### Stabilize Phase 0 first

```text
1. Keep content/docs/tests aligned
2. Improve question quality and distractors
3. Polish player flow
4. Improve Road map and session summary UX
5. Add player profile popup
6. Add separate Admin hub
7. Strengthen retention/Roadblock foundation
8. Deploy and playtest with fresh players
```

### Then build Phase 1

```text
1. Add Fractions / Decimals / Ratios road config
2. Add fraction/decimal/ration question generators
3. Reuse Number Line / Compare / Pattern / Missing Number instincts
4. Add Phase 1 Roadblock
5. Add retention checks across Arithmetic + Fractions
6. Polish Road transition from Arithmetic to Phase 1
```

### Then begin Road to Algebra

```text
1. Variables as unknowns
2. Expression evaluation
3. One-step equations
4. Balance/transform instinct
5. Two-step equations
6. Function tables
7. Coordinate graph foundations
```

---

## 20. Non-Negotiable Product Rules

1. **One level, one core instinct.**
2. **Instincts may repeat at harder difficulty bands.**
3. **Understanding first, fluency second.**
4. **XP rewards effort but does not bypass mastery.**
5. **Every attempt is logged.**
6. **Rush proves fluency; it is not the only learning mode.**
7. **Retention is sharpening, not punishment.**
8. **Answers stay simple.**
9. **The Road map should make the player feel they are climbing.**
10. **The game should remain fun enough for repetition.**

---

## 21. North-Star Statement

Road to Math turns repeated math logic into instinct through a visible adventure: understand the move, practice it, rush it, prove it later, and climb to the next Road.
