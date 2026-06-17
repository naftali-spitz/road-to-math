# Road to Math — Master Product & Design Specification

*Single source of truth. All prior roadmap documents superseded by this file.*

---

## Part 1 — Vision & Philosophy

### 1. The Final Vision

Road to Math is a mastery-based, continuous mathematical adventure that turns the core logic
moves of mathematics into instinct.

It is designed to look, sound, and feel like a high-velocity arcade puzzle game — but
underneath the arcade layer is a serious learning engine built on mastery, fluency, spaced
review, adaptive retention, and skill progression.

The goal is not simply to help players answer math questions.

The goal is to help players reach the point where core math moves feel **automatic** —
the same way times tables can become instant, Road to Math aims to make the repeated moves of
arithmetic, algebra, geometry, statistics, and calculus feel natural, fast, and confident.

A player should not only know how to solve:

> 2x + 3 = 11

They should look at it and immediately feel:

> *Remove 3, then divide by 2.*

That is the heart of the product: **turning logic into instinct.**

The long-term game map is a visible climb through major mathematical roads:

```
[Road to Arithmetic] → [Road to Algebra] → [Road to Geometry] → [Road to Statistics] → [Road to Calculus]
```

Locked roads are visible but greyed out. This creates a strong psychological sense of journey:

> *"I am climbing math."*  
> Not: *"I am solving random worksheets."*

The first proof of concept, **Math Rush**, proves the arcade rush mechanic works. Long-term,
Rush is not a separate game. Rush becomes one universal mode used across every road and every level.

---

### 2. Product Identity

Road to Math should feel like:

- Arcade speed game
- Math fluency trainer
- World-map adventure
- Personal mastery journey
- Family competition platform

It should not feel like:

- A worksheet
- A school test
- A boring quiz app
- A speed-only drill
- A fake game with math pasted on top

The game feeling matters because fluency requires repetition. If the repetition is boring,
players will not do enough of it. The product must make repetition feel rewarding, energetic,
and emotionally satisfying.

---

### 2A. Target Player and Product Boundary

Road to Math is first optimized for **family and home use**: children, teens, and parents
playing in short sessions on a local or private environment.

The primary target player is a child or teen who needs repeated practice to turn math skills
into confidence, but who will not tolerate a worksheet disguised as a game. The secondary
target player is an older learner who wants to sharpen weak foundations or regain speed.

The product should grow into a serious learning platform over time, but its first identity is:

> **A family-focused arcade mastery game for math fluency.**

It is not initially designed as a school LMS, teacher grading system, homework checker,
public multiplayer platform, or full curriculum replacement. Those may become future
extensions, but they must not shape the core experience too early.

---

### 2B. Emotional Promise

Road to Math should make the player feel:

- *I am climbing.*
- *I am getting faster.*
- *I understand the move.*
- *I can beat my old self.*
- *Old skills are not disappearing.*
- *Mistakes show me what to sharpen, not that I failed.*

The emotional center is growth, not judgment. Progression gates, roadblocks, pop quizzes,
and mastery decay must always be framed as sharpening tools, not punishments.

---

### 2C. Product Non-Goals

Road to Math is not:

- A worksheet generator
- A homework solver
- A symbolic algebra engine
- A full school curriculum replacement
- A teacher grading or classroom-management system
- A public competitive multiplayer platform at launch
- A mobile-first tap game during active gameplay
- A speed-only drill app

These non-goals protect the core identity. The product may expand later, but every expansion
must preserve the main promise: **understanding first, fluency second, instinct over time.**

---

### 3. Core Philosophy

**Understanding First. Fluency Second. Instinct Over Time.**

Speed without understanding creates fragile pattern memorization.
Explanation without repetition creates knowledge that fades.
Road to Math combines both.

Each skill is introduced clearly, practiced without pressure, then trained under timed arcade
conditions only after the player has enough understanding.

The learning flow is:

```
Understand the move → Practice the move → Recognize the move in different forms
→ Rush the move under light pressure → Prove it again later
```

The goal is not to eliminate thinking. The goal is to automate the repeated core moves so
the player's brain is free for higher reasoning.

---

## Part 2 — Architecture

### 4. The Structural Hierarchy

The game is built as a data-driven tree. Content is decoupled from visual components.
Adding a new math topic never requires changing the core codebase — it only requires a new
structural configuration file.

```
Road to Math
  └── Road (e.g., Algebra)
        └── World (e.g., Core Algebra)
              └── Level (e.g., Two-Step Equations)
                    └── One Core Instinct (e.g., strip the outside operation first)
                          └── Up to 5 Question Formats (structural angles)
                                └── Mode Loops (Learn → Practice → Rush → Review → Retention)
```

#### The Road Map

| Road | Subject | Status |
|------|---------|--------|
| **Road to Arithmetic** | Number sense, operations, speed — Math Rush proof of concept | ✅ Exists — the gate everyone starts at |
| **Road to Algebra** | Algebra, functions, light graphs | 🎯 Build next (this specification) |
| Road to Geometry | Shapes, area, proofs, trigonometry | 🔮 Future |
| Road to Statistics | Data, probability, distributions | 🔮 Future |
| Road to Calculus | Limits, derivatives, integrals | 🔮 Future |

One profile. One XP bar. One continuous journey. Locked roads are visible but greyed out —
the whole path is always visible, even the parts not yet unlocked.

---

### 4A. Product Scope Boundaries

The long-term Road to Math vision includes Arithmetic, Algebra, Geometry, Statistics, and
Calculus. The plan intentionally shows the whole mountain so the journey feels real.

However, the product should grow one strong slice at a time. A slice is considered complete
only when it includes the full learning loop:

```
Learn → Practice → Rush → Review → Retention Check
```

The first product-quality slice should prove the model with early Algebra content, not try to
ship the entire 28-level Algebra road at once. Worlds 3–5 are part of the long-term content
map, but the product identity must be proven earlier through a smaller complete experience.

This is a product boundary, not a development sequence. It prevents the plan from becoming
"unfinished" until every future topic exists.

---

## Part 3 — The Learning Engine

### 5. What Is a Math Instinct?

A math instinct is a small, repeatable mental move that becomes fast and reliable through practice.

**Hard design law:** every level trains exactly **one** core instinct. If a level requires two
new mental moves, it must be split into two levels. Difficulty may increase through numbers,
speed, formats, or retention pressure — not by sneaking multiple new instincts into one level.

| Topic | Instinct |
|-------|---------|
| Arithmetic | 8 + 7 → make 10, then add 5 |
| Multiplication | 6 × 8 → known fact: 48 |
| One-step algebra | x + 5 = 12 → subtract 5 |
| Two-step algebra | 2x + 3 = 11 → subtract 3, then divide by 2 |
| Slope | y = 3x − 2 → slope is 3 |
| Factoring | x² + 5x + 6 → find two numbers that multiply to 6 and add to 5 |
| Derivative | d/dx x³ → power rule → 3x² |

Instinct does not mean blind memorization. It means the player can:

- Recognize the pattern
- Know the correct move
- Apply it accurately
- Apply it quickly
- Still apply it later

---

### 6. The Five Structural Question Formats

Each level trains one instinct from up to five structural angles.
The formats are not random variety — they are different visual views of the same underlying move.

| Format | Purpose | Example |
|--------|---------|---------|
| **Solve** | Directly perform the move | 2x + 3 = 11, x = ? |
| **Fill the Blank** | Complete part of the structure | 2x + \_\_ = 11 when x = 4 |
| **True / False** | Verify whether a statement is valid | "x = 4 solves 2x + 3 = 11" |
| **Multiple Choice** | Recognize the correct answer among distractors | Which x value works? 2 / 3 / 4 / 5 |
| **Word Problem** | Map language into the same structure | *Phase 2 target* |

**Format vs. variant rule:** these five are the primary structural formats. Later labels such
as Evaluate, Identify, and Graph Question are specialized variants of Solve or Multiple Choice
used for specific topics. They do not expand the core five-format learning model; they only
change the framing or display while keeping the same simple input mechanics.

#### Example: one instinct, five angles

**Level: Two-Step Equations**
**Instinct:** Remove the constant first, then divide.

- **Solve:** 2x + 3 = 11
- **Fill the Blank:** 2x + \_\_ = 11 when x = 4
- **True / False:** "x = 4 solves 2x + 3 = 11"
- **Multiple Choice:** Which value of x works? A) 2  B) 3  C) 4  D) 5
- **Word Problem:** You have 3 bonus points. Each star gives 2 points. Total is 11. How many stars?

This trains recognition across formats, not just calculation in one format.

#### The answer-always-stays-simple rule

Even for advanced topics, the question must resolve to one of the approved input patterns:

- Typed number
- Single missing number
- Multiple choice key
- True / False key

No free-form algebra input is required in the core version. This is a hard product constraint,
not only a technical convenience. It keeps the game fast, keyboard-first, reliable, and easy
for younger players to understand.

❌ Bad: "Factor x² + 5x + 6 completely." (requires typed expression)  
✅ Good: "x² + 5x + 6 = (x + 2)(x + ?) — fill the blank." → type: 3  
✅ Good: "Which of these is x² + 5x + 6 factored?" → MC: A) (x+1)(x+6)  B) (x+2)(x+3)  C) (x–2)(x–3)  D) (x+3)(x+4)

This works for every topic through derivatives and integrals because advanced ideas can still
be tested through recognition, missing values, simple numeric outputs, and carefully designed
multiple-choice options.

---

### 7. Gameplay Modes

Every level can be played through a structured pipeline:

```
Learn → Practice → Rush → Review → Retention Check
```

#### Learn Mode — The Onboarding Ramp

Learn Mode introduces the new instinct without pressure.

**Part 1 — Concept Card**

A short explanation that connects the new idea to something the player already knows.

> *You already know that x + 4 = 10 is solved by removing 4.*
> *Two-step equations work the same way, but the variable has two layers.*
> *Remove the outside layer first, then divide.*

The Concept Card should feel like a game tutorial, not a classroom lecture. Brief and direct.

**Part 2 — Interactive Walkthrough**

A short step-by-step interaction showing the mechanical move.

> 2x + 3 = 11  
> Step 1: Remove +3. → 2x = 8  
> Step 2: Divide by 2. → x = 4

The walkthrough can include trial interactions, but guided onboarding steps are not counted
as mastery evidence.

---

#### Practice Mode — Accuracy and Recognition

Practice Mode is untimed or lightly pressured. Its purpose is correctness, comfort, and recognition.

Early in Practice, the engine isolates one format at a time:

```
Solve → Solve → Solve → Fill the Blank → Fill the Blank → True / False
```

**Format mixing trigger:** The engine switches from single-format to mixed-format delivery
once the player answers **3 consecutive questions correctly within a format**. This confirms
basic comfort before adding visual variety. Once all active formats for the level have been
introduced individually, every subsequent Practice question is drawn randomly from the full
format pool for that level.

As the player improves, Practice looks like:

```
Solve → True / False → Multiple Choice → Fill the Blank → Solve
```

This teaches recognition of the same instinct across different visual forms.

Practice answers the question: *"Can the player do this correctly without pressure?"*

---

#### Rush Mode — The Arcade Fluency Engine

Rush Mode is the timed, high-velocity validation loop.

Rush is not the main learning tool. Rush is the **fluency proof**.

A player should not be forced into Rush before they understand the move, unless they choose
the Express Pass path. Learn and Practice build the move; Rush proves that the move is becoming
fast, reliable, and automatic.

It is not the first learning step. It comes after the player has learned and practiced.

Rush Mode measures: accuracy, speed, streak, consistency, and confidence under light pressure.

**Combo profile:**

```
0–4 streak:   1x base
5–9 streak:   2x glow
10–14 streak: 3x sparks
15+ streak:   5x fever mode
```

**Rush Mode base scoring:**

| Action | Points |
|--------|--------|
| Correct answer | +10 |
| Fast answer (under benchmark time) | +5 bonus |
| Combo multiplier applied to total | × 1 / 2 / 3 / 5 |

Multiple Choice and True / False questions score the same as Solve questions — the instinct
being tested is identical, only the interface differs. A correct answer is a correct answer.

**Performance Rating — the cross-player comparison metric:**

```
Performance Rating = Accuracy% × Speed Multiplier

Speed Multiplier = level benchmark time ÷ player's actual avg answer time
Speed Multiplier is capped at 2.0 (so very fast players score at most 200)
```

Example: 90% accuracy, answering at 1.2× the benchmark speed → 90 × 1.2 = **108**

Performance Rating is used for:
- The Weekly Growth Score leaderboard (this week's rating minus last week's rating)
- The All-Time Age-Handicapped Score leaderboard (rating × age multiplier)
- Mastery signal calculation (Fluency requires rating meets the level's minimum threshold)

**Wrong answer behavior:**

> Wrong answer → streak breaks → multiplier resets → quick visual impact → next question instantly

An incorrect answer does not open a modal, stop the game, or force an explanation.
Mistake feedback belongs after the rush, not inside it.

**End-of-rush summary shows:**

- Questions missed
- Correct answers
- Weakest format
- Average answer time
- Personal best
- Mastery signal impact
- Recommended next action

**Abandoned Rush rule:** if a player exits a Rush before the timer ends, all submitted attempts
are still logged. The Rush does **not** count as a completed Rush for Express Pass, personal
best, leaderboard placement, Rush-completion XP, or positive mastery unlock requirements.
Those attempts may still count for diagnostic weakness tracking so the system can recommend
better review, but quitting early should never be an easy shortcut to progression.

---

#### Review Mode — The Normal Retention Stream

Review Mode keeps old skills active by injecting historical content into future Practice or Rush sessions.

**Standard content mix:**

```
75% current level
15% recent milestone reinforcement
10% historical weak-point injection
```

**Advanced player mix:**

```
60% current level
25% recent previous levels
15% older weak instincts
```

**Map node mastery states:**

```
Unlocked → Practicing → Rush Ready → Mastered → Gold Mastered → Needs Refresh
```

A "Gold Mastered" node visually tarnishes into "Needs Refresh" if retention weakens over time.
This must feel like a helpful reminder, not a punishment.

**Emotional guardrail:** Needs Refresh never erases the player's achievement history. It means:

> *"This skill wants a quick polish."*

The player keeps their earned history and badges, but the current mastery glow dims until the
skill is refreshed. The tone is maintenance, not failure.

---

### 8. Adaptive Retention System

Retention is not only passive review injection.

Road to Math uses an Adaptive Retention System made of four components:

- Pop Quizzes
- Roadblock Checks
- Review Frequency Adjustment
- Targeted Refresh Paths

The system answers one question: *"Does the player still own the instincts they already mastered?"*

If yes → reduce review frequency for those instincts.  
If no → increase frequency and build a short refresh path.

---

### 9. Pop Quizzes

Pop Quizzes are short, non-blocking retention checks.

**When they appear:**

- When starting a session after several days away
- After finishing a Rush
- When the system detects a skill may be fading
- Before entering a harder unit that depends on older skills

Pop Quizzes should feel light and fast. Not a punishment.

**If the player performs well:**

- Reviewed instincts stay strong
- Review interval extends
- Map node remains Mastered or Gold Mastered
- Player earns XP or a "still sharp" reward

**If the player struggles:**

- Instinct enters Needs Refresh state
- Review interval shortens
- Related questions appear more often
- System may recommend a short Practice refresh

Pop Quizzes adjust the review engine without blocking normal play.

**Pop Quiz feel — resolved rule:** Pop Quizzes use a calmer gameplay format than Rush.
They may use a gentle countdown of about 20–25 seconds per question, but they do not use
combo meters, fever mode, streak visuals, or dramatic failure effects. Feedback appears after
the quiz, and the tone is: *"still sharp"* or *"quick polish recommended."*

---

### 10. Roadblock Checks

Roadblocks are major retention gates reserved for important transition points only.

Roadblocks may be used:

- Before finishing or fully validating a World
- Before entering a new Road
- Before unlocking a major new concept family
- Before earning Gold Mastery for a World
- Before entering Road to Algebra from Road to Arithmetic

Roadblocks are **not** used between ordinary levels. Normal level progression should stay
lightweight; Roadblocks protect major foundations only.

A Roadblock says:

> *"Gateway Check: prove your foundation is still strong before climbing higher."*

Example before entering Road to Algebra:

> Check: Multiplication · Division · Negatives · Order of operations · Missing numbers

This makes sense because Algebra depends on Arithmetic instincts being automatic.

**Roadblock failure behavior:**

A failure should not feel like *"You failed. Go back."*  
It should feel like *"We found the weak link. Let's sharpen it."*

If a player does not pass a Roadblock, the game creates a short targeted refresh path:

> *Almost there. Your negatives and division need a quick refresh.*
> *Clear this 3-minute bridge challenge to unlock the gate.*

Roadblocks protect progression quality. They are used sparingly at major gates only, so the
game never becomes frustrating. The emotional message is not "you are blocked"; it is
"the bridge found exactly what to sharpen before the climb continues."

---

### 11. Adaptive Review Frequency

Each instinct has a review schedule that changes based on performance.

| Result | Next review interval |
|--------|---------------------|
| Newly mastered | 1 day |
| Passed first review | 3 days |
| Passed again | 7 days |
| Passed again | 14 days |
| Passed again | 30 days |
| Failed review | Next session |
| Failed badly | Trigger targeted refresh |

Strong instincts appear less often. Weak instincts appear more often.
Failed subjects get a targeted refresh. Old important foundations never disappear completely.

Two players on the same level may receive different retention questions because their weak spots differ.

---

### 12. Retention Question Selection

Retention questions are selected based on:

- Age of the skill
- Recent performance on that skill
- Importance to upcoming levels
- Historical weakness
- Roadblock relevance
- Time since last successful review
- Question-format weakness (e.g., strong in Solve but weak in True / False)

Example:

> A player entering Algebra with weak negative-number performance receives more retention
> questions involving negatives.
>
> A player who has not played for two weeks receives a wider foundation check.

Retention adjusts both frequency and the subject/format mix.

---

### 13. Mastery and Progression

Road to Math separates XP from mastery.

```
XP = motivation     Mastery = progression     Gold Mastery = long-term retention
```

**XP is awarded for:**

Playing · Maintaining streaks · Daily use · Personal bests · Completing sessions ·
Family challenges · Passing pop quizzes · Clearing roadblocks

XP does not unlock serious progression by itself. XP rewards effort, consistency, courage, and
celebration moments. Mastery unlocks progression.

#### Starter XP Economy

These values are starting numbers, not sacred constants. They give the product a clear first
balance model that can be tuned after real playtesting.

| Event | Starter XP |
|-------|------------|
| Correct Practice answer | +1 XP |
| Correct Rush answer | +2 XP |
| Practice session completed | +10 XP |
| Rush completed | +10 XP |
| New personal best | +25 XP |
| Pop Quiz passed | +20 XP |
| Roadblock cleared | +75 XP |
| Level Mastered | +100 XP |
| Gold Mastery earned | +150 XP |
| World completed | +500 XP |
| Daily play streak bonus | +10 XP × streak day, capped at +100 XP |

**XP guardrail:** XP may unlock cosmetics, badges, profile flair, celebrations, or family-facing
status. XP must not bypass Understanding, Recognition, Fluency, Retention, or Roadblock rules.

#### The Four Mastery Signals

| Signal | Question it answers | How it's measured |
|--------|--------------------|--------------------|
| **Understanding** | Can the player answer correctly without pressure? | Untimed accuracy ≥ 80% in Practice Mode |
| **Recognition** | Does performance hold across all question formats? | Accuracy does not collapse when format changes (e.g., Solve → True / False) |
| **Fluency** | Can the player answer accurately and quickly? | Rush Mode response time below the level's benchmark |
| **Retention** | Can the player still perform the instinct later? | Pop Quizzes, Roadblock Checks, or Review Mode across separate sessions |

---

### 14. Level Unlock, Express Pass, and Gold Mastery

The system has two tiers of progression, with an Express Pass lane for players who clearly
already own the material.

#### Session definition

A session is bounded by **30+ minutes of inactivity**. Closing and reopening the app within
30 minutes counts as the same session. This stops the minimum session count from being gamed
in one long sitting, without forcing a player to wait until the next day.

#### Standard Level Unlock

A level unlocks the next level when:

```
Understanding ≥ 80%   (untimed accuracy in Practice Mode)
Recognition  ≥ 75%   (accuracy holds across mixed question formats)
Fluency      ≥ 75%   (Rush Mode responses meet the level's speed benchmark)
Minimum 20 attempts
Minimum 2 sessions    (30+ minute gap)
```

#### Express Pass

A player can bypass the standard minimums entirely by demonstrating they already own the instinct.

**Trigger:** 2 Rushes averaging ≥ 90% accuracy AND meeting the level's minimum speed benchmark.

**Effect:** Immediate unlock — no minimum attempts, no session gap, no cooldown.
Applies equally to level-to-level and World-to-World transitions.

**Why 90% and not 100%:** One careless typo should not block a player who clearly owns
the material. An average of 90%+ across 2 full mixed-format Rushes at speed proves
Understanding, Recognition, and Fluency simultaneously.

**Level entry choice:** Every time a player opens a level for the first time they see:

> *"Start with the tutorial"*  
> *"I already know this — go straight to Rush"*

If they choose Rush and hit the Express Pass threshold, they move on immediately.
If they don't hit it, they can try again or drop into Learn or Practice Mode.

**Express Pass failure path:** If a player attempts Rush directly and does not hit the
threshold after 3 attempts, the game offers a gentle nudge — not a block:

> *"Want to try the walkthrough? It only takes a minute and usually helps."*

The player can dismiss this and keep trying Rush. It is a suggestion, never a gate.

**Express Pass summary:**

| Transition | Accuracy needed | Speed needed | Session gap |
|------------|----------------|-------------|-------------|
| Level → Level | ≥ 90% avg over 2 Rushes | ✅ Must meet benchmark | None |
| World → World | ≥ 90% avg over 2 Rushes | ✅ Must meet benchmark | None |
| Road → Road | Roadblock Check required | ✅ | None |

#### Gold Mastery

Gold Mastery requires the standard unlock signals **plus** retention verification.
Express Pass does not award Gold Mastery — it only unlocks the next level.

```
Understanding ≥ 80%
Recognition  ≥ 75%
Fluency      ≥ 75%
Retention verified through spaced review or pop quiz
```

Gold Mastery is what makes a map node fully glow. It is long-term proof that the instinct
is owned — not just demonstrated once under good conditions.

#### Road Gate

Crossing from one Road to the next (e.g., Road to Arithmetic → Road to Algebra) requires
a Roadblock Check — a structured set of retention questions covering the key instincts of
the completed Road. Express Pass does not bypass a Road Gate. This is the one hard
boundary in the system, because the new Road genuinely depends on the old one being solid.

---

## Part 4 — Player Experience

### 15. Keyboard-First Gameplay

Menus, maps, profile screens, and settings support mouse and touch.

Inside any active gameplay session (Learn · Practice · Rush · Review · Pop Quiz · Roadblock),
the goal is zero-mouse ergonomics.

| Format | Key behavior |
|--------|-------------|
| Solve / Fill the Blank | Number row and numpad input values · Enter or Space submits |
| Multiple Choice | Keys 1, 2, 3, 4 select options instantly — no confirmation step |
| True / False | T = True · F = False — triggers instant evaluation |
| Escape | Pause or exit confirmation depending on mode |

This keeps gameplay fast and physical — closer to an arcade rhythm game than a school form.

---

### 16. Family and Small-Group Competition

The product is first optimized for private environments: family · small group · home server ·
local network.

Competition should motivate without humiliating. A 6-year-old should have a genuine path to
beating a 12-year-old — not through fake adjustments, but through smart design.

The leaderboard uses **two parallel scoring systems**:

---

#### Weekly Leaderboard — Growth Score

Compete on how much each player improved relative to themselves this week.

```
Growth Score = (this week's avg Performance Rating) − (last week's avg Performance Rating)
```

A 6-year-old who jumped from 60% to 85% accuracy at their level scores +25.
A 12-year-old who stayed flat at 90% scores 0.
**The 6-year-old wins the week — genuinely, not artificially.**

The weekly window is a rolling 7 days. If someone skips a week, their previous rating
carries forward as the baseline. Growth Score resets each Monday.

This drives daily motivation: the 12-year-old cannot coast. They need to push into harder
levels to keep improving. The 6-year-old is always rewarded for effort.

---

#### All-Time Family Ranking — Age-Handicapped Score

A persistent ranking showing the family's all-time standings, adjusted for age.

```
Family Rank Score = Performance Rating × Age Handicap Multiplier
```

| Age | Multiplier |
|-----|-----------|
| 5–6 | × 3.0 |
| 7–8 | × 2.4 |
| 9–10 | × 1.8 |
| 11–12 | × 1.3 |
| 13–14 | × 1.1 |
| 15+ | × 1.0 |

The multiplier is **visible** next to each player's name — like a golf handicap.
Winning with a handicap is still winning. Younger players know the odds are against them
and win anyway. Older players know the challenge and aim to overcome it.

Age is stored as birth year in the player profile. The multiplier is recalculated automatically
as the player gets older.

---

#### Additional family metrics (supporting categories)

Beyond the two main leaderboards, the family screen shows:

| Metric | What it rewards |
|--------|----------------|
| Level Leader | Highest level reached on the current Road |
| Mastery Champion | Most Gold Masteries earned all-time |
| Streak Holder | Current daily play streak |
| Most Improved | Highest Growth Score this week |
| Roadblock Crusher | Most Roadblock Checks cleared |

Every family member has at least one category where they can be the current champion.

---

The best emotional reward is: *"I am getting stronger."*

---

## Part 5 — Content Maps

### 17. Road to Arithmetic — Starting Gate

Road to Arithmetic is the first Road every player sees. It is the bridge between the existing
Math Rush proof of concept and the full Road to Math model. It focuses on number sense,
operation fluency, and the foundations needed before Algebra can feel natural.

The first version maps the existing Math Rush idea into three Worlds and nine Levels. Each
Level still follows the same product law: one level trains one core instinct.

```
WORLD 1              WORLD 2              WORLD 3
Number Sense         Core Operations      Mixed Fluency
Levels 1–3           Levels 4–6           Levels 7–9
```

| Level | World | Name | Core Instinct | Sample Questions |
|-------|-------|------|---------------|-----------------|
| **1** | Number Sense | Number Sprint | Recognize and answer small addition facts quickly | "3 + 4 = ?" → 7 |
| **2** | Number Sense | Make Ten | Use 10 as an anchor for addition | "8 + 7 = ?" → make 10, then 5 → 15 |
| **3** | Number Sense | Difference Finder | See subtraction as distance or missing addend | "12 - 5 = ?" → 7, "5 + ? = 12" → 7 |
| **4** | Core Operations | Multiplication Facts | Recall core multiplication facts | "6 × 8 = ?" → 48 |
| **5** | Core Operations | Division Facts | See division as inverse multiplication | "48 ÷ 6 = ?" → 8 |
| **6** | Core Operations | Operation Mix | Choose the correct operation instinct under light pressure | "7 × 4 = ?", "28 ÷ 7 = ?", "9 + 6 = ?" |
| **7** | Mixed Fluency | Missing Number Bridge | Treat blanks as unknowns before letters appear | "? + 6 = 14" → 8, "3 × ? = 21" → 7 |
| **8** | Mixed Fluency | Negative Starter | Handle simple negatives and absolute value | "-3 + 5 = ?" → 2, "\|-6\| = ?" → 6 |
| **9** | Mixed Fluency | Order of Operations Gate | Apply operation priority before Algebra | "2 + 3 × 4 = ?" → 14 |

**Road to Arithmetic completion gate:** before entering Road to Algebra, the player must pass
a Roadblock Check covering multiplication, division, negatives, order of operations, and missing
numbers. This protects the Algebra experience because Algebra depends on these instincts being
available without heavy calculation.

**Math Rush relationship:** the original Math Rush experience becomes the Rush mode inside
Road to Arithmetic. It is no longer a separate game loop; it is the arcade fluency layer used
across the full Road to Math product.

---

### 18. Road to Algebra — Structure Overview

Road to Algebra is organized into 5 Worlds containing 28 Levels.

This is the long-term Algebra content map. The full map is included now so progression is
coherent from the beginning, but the product does not need all 28 levels to prove the Road to
Math experience. The first complete product slice should feel complete because the learning
loop works, not because every future Algebra topic already exists.

```
WORLD 1         WORLD 2         WORLD 3           WORLD 4           WORLD 5
Foundation      Core Algebra    Algebra Expanded  Advanced Algebra  The Summit
Pre-algebra     Linear eqs      Functions         Quadratics        Uni-level
Levels 1–5      Levels 6–11     Levels 12–17      Levels 18–22      Levels 23–28
```

Each World has a name, colour, and visual identity. Completing a World triggers a celebration
cinematic. Levels are numbered globally (1–28) so progress feels continuous.

Each level contains one core instinct, up to 4 active question formats in Phase 1
(Solve, Fill the Blank, True / False, Multiple Choice), and supports all five gameplay modes.

---

### 19. World 1 — Foundation

**Theme:** Pre-Algebra, approximately Grades 1–6  
**Goal:** Build the mental model that math is a language with rules that make sense.

| Level | Name | Core Instinct | Sample Questions |
|-------|------|---------------|-----------------|
| **1** | Pattern Spotter | Patterns & sequences | "2, 4, 6, 8, ?" → 10 |
| **2** | Missing Number | Intro to unknowns | "? + 3 = 7" → 4 |
| **3** | Variable Hunter | Named variables | "x + 5 = 9, x = ?" → 4 |
| **4** | Order Master | PEMDAS / BODMAS | "2 + 3 × 4 = ?" → 14 |
| **5** | Negative Explorer | Negatives & absolute value | "\|-7\| = ?" → 7, "(-4) + 6 = ?" → 2 |

**Jump check:** Level 1→2 is just naming the unknown box. Level 2→3 gives it a letter.
Level 3→4 adds brackets. Level 4→5 adds negative numbers. Each step is exactly one new idea.

---

### 20. World 2 — Core Algebra

**Theme:** ~Grades 6–9  
**Goal:** Solve any linear equation confidently.

| Level | Name | Core Instinct | Sample Questions |
|-------|------|---------------|-----------------|
| **6** | One-Step Solver | Single operation inverse | "3x = 12, x = ?" → 4, "x – 7 = 2, x = ?" → 9 |
| **7** | Two-Step Solver | Strip outside layer first, then divide | "2x + 3 = 11, x = ?" → 4 |
| **8** | Like-Terms Combiner | Simplify before solving | "3x + 2x – 4 = 11, x = ?" → 3 |
| **9** | Ratio & Proportion | Cross-multiply | "3/x = 6/10, x = ?" → 5 |
| **10** | Inequality Ranger | Same moves, flip sign on negative divide | "2x – 1 > 7, x > ?" → 4 |
| **11** | Slope Spotter | Read slope and intercept from y = mx + b | "y = 3x – 2, slope = ?" → 3, "y-intercept = ?" → -2 |

**Jump check:** Each level adds exactly one new mechanic. A player who can do Level 10 is
already halfway to Level 11 — slope is just "what happens per step."

---

### 21. World 3 — Algebra Expanded

**Theme:** ~Grades 9–10  
**Goal:** Functions feel natural; polynomials feel manageable.

| Level | Name | Core Instinct | Sample Questions |
|-------|------|---------------|-----------------|
| **12** | Function Reader | Evaluate f(x) — plug in the value | "f(x) = 2x + 1, f(4) = ?" → 9 |
| **13** | System Solver | Substitution to find x and y | "x + y = 5, x – y = 1, x = ?" → 3 |
| **14** | Exponent Climber | Laws of exponents — add and multiply powers | "x³ × x⁴ = x^?" → 7 |
| **15** | Poly Builder | Add and subtract polynomial terms | "(3x² + 2x) + (x² – 5x) = ?" → MC: 4x² – 3x |
| **16** | Poly Multiplier | FOIL and distribution | "(x + 3)(x + 2) — middle term?" → 5x |
| **17** | Factor Finder | Factor GCF and simple trinomials | "x² + 5x + 6 = (x + 2)(x + ?)" → 3 |

---

### 22. World 4 — Advanced Algebra

**Theme:** ~Grades 10–11  
**Goal:** Quadratics feel as natural as linear equations did in World 2.

| Level | Name | Core Instinct | Sample Questions |
|-------|------|---------------|-----------------|
| **18** | Parabola Pilot | Recognize quadratic shape and roots | "x² – 4 = 0, roots = ?" → MC: 2 and –2 |
| **19** | Formula Fighter | Apply the quadratic formula | "x² – 5x + 6 = 0, smaller root = ?" → 2 |
| **20** | Square Completer | Complete the square to find vertex form | "x² + 6x + ? = (x + 3)²" → 9 |
| **21** | Exponent Rider | Evaluate exponential functions | "f(x) = 2^x, f(4) = ?" → 16 |
| **22** | Log Unlocked | Invert the exponent | "log₂(8) = ?" → 3 |

---

### 23. World 5 — The Summit

**Theme:** ~Grades 11 through University  
**Goal:** The player is thinking mathematically, not just calculating.

| Level | Name | Core Instinct | Sample Questions |
|-------|------|---------------|-----------------|
| **23** | Sequence Surfer | Arithmetic and geometric pattern rules | "1, 3, 9, 27, next = ?" → 81 |
| **24** | Rational Ranger | Simplify rational expressions | "(x² – 4) / (x + 2) = x + ?" → –2 (MC) |
| **25** | Matrix Mover | 2×2 determinant and basic operations | "det([[2,1],[3,4]]) = ?" → 5 |
| **26** | Limit Chaser | Evaluate limits as x approaches a value | "lim x→2 of (x²–4)/(x–2) = ?" → 4 |
| **27** | Derivative Dasher | Power rule for polynomials | "f(x) = x³, f'(x) = ?" → MC: 3x² |
| **28** | Integral Initiator | Antiderivatives of simple functions | "∫2x dx = ?" → MC: x² + C |

---

### 24. Question Type and Variant Library

This library describes the five primary structural formats plus specialized variants used by
specific topics. Evaluate, Identify, and Graph Question are not extra structural formats; they
are variants of Solve or Multiple Choice that preserve the same simple-answer input rule.

| Type | Description | Best for | Example |
|------|-------------|---------|---------|
| **Solve** | Numeric answer, typed | All levels | "3x + 2 = 11" → 3 |
| **Evaluate** | Plug in a value, type result | Functions (Level 12+) | "f(3) when f(x) = 2x + 1" → 7 |
| **Identify** | Find one property — slope, intercept, degree | Level 11+ | "y = 3x – 2, slope = ?" → 3 |
| **Multiple Choice** | 4 options, 1 key press | Concepts, expressions, graphs | "Which is the factored form?" 1/2/3/4 |
| **True / False** | T or F instantly | Rules and properties | "x² + 4x + 4 = (x+2)²" → T |
| **Fill the Blank** | Expression with one gap, type the missing number | Polynomials, sequences | "x² + ?x + 6 = (x+2)(x+3)" → 5 |
| **Word Problem** | Real-world scenario, numeric answer | Level 6+ (Phase 2) | "3 items cost $12, price each = ?" → 4 |
| **Graph Question** | SVG graph shown, numeric or MC answer | Level 11, 18, 21 | "Slope of this line = ?" → 2 |

**Graph question rule:** The graph is always rendered by the SVG engine. A graph question is
usually a Solve, Identify, or Multiple Choice variant with visual support. The player never draws
or plots. The answer is always numeric, true/false, or MC.

---

### 25. World Completion Celebration

When a player completes all levels in a World:

- Full-screen animated cinematic (PixiJS)
- World badge awarded to profile
- Unlock of a "gateway challenge" — a harder preview question showing what World N+1 will feel like
- No pressure to proceed immediately

This is one of the primary moments where the PixiJS investment is most visible and impactful.

---

### 26. Placement Quiz

A new player can take a 10-question placement quiz per World to skip past levels they already
know confidently. One attempt per World. Placement skip does not award Gold Mastery — only
normal play does.

---

## Part 6 — The Visual World

### 27. Overworld Visual Identity (Hand-Crafted Per World)

Each World's overworld scene is hand-built in PixiJS with its own distinct look.
The goal: glancing at a screenshot of any World should make it instantly identifiable.
The progression from World 1 → World 5 should feel like genuinely climbing toward something.

| World | Palette | Scene Mood | Map Motif |
|-------|---------|-----------|-----------|
| 🟦 World 1 — Foundation | Soft cyan / sky blue | Bright, friendly, daytime | Gentle rolling path, simple geometric shapes drifting in background |
| 🟩 World 2 — Core Algebra | Green / teal | Open plains, more structured | Straight connecting paths — echoes "linear" |
| 🟨 World 3 — Algebra Expanded | Gold / amber | Golden-hour, energetic | Branching paths — systems of equations, multiple routes |
| 🟧 World 4 — Advanced Algebra | Orange / deep purple twilight | Dramatic, higher stakes | Curved, arcing paths — visually nods to parabolas |
| 🟥 World 5 — The Summit | Deep red / cosmic purple, starfield | Mysterious, prestigious | Path winds upward toward a glowing peak |

The PixiJS overworld map also serves a functional purpose: node visual states (Mastered,
Gold Mastered, Needs Refresh) mean the map is a living display of the player's retention
health — not only decoration.

---

## Part 7 — Technical Architecture

This section defines the technical direction and constraints that protect the product vision.
It is not a development task list. The purpose is to prevent architecture choices that would
break the core experience: keyboard-first gameplay, fast sessions, local-server friendliness,
simple answer input, and one codebase / one deploy.

### 28. Tech Stack

The current stack is proven — fast, simple, runs on a home server with zero ongoing cost.
The plan is to keep everything that works and add a dedicated graphics layer.

#### Core stack (unchanged)

| Layer | Tech | Reason |
|-------|------|--------|
| Frontend | Vite + React + TypeScript | Built, fast dev loop, type-safe content configs |
| Styling | Plain CSS + CSS variables | Arcade visual identity defined and working |
| Sound | Web Audio API (synthesized) | Zero asset files, full drum-kit + SFX engine already built |
| Backend | Node.js + Express | Lightweight, matches deployment target |
| Database | SQLite via better-sqlite3 | File-based, perfect for home server — upgradeable later |
| Hosting | Debian home server + Nginx | Already working, zero cost, no external dependency |

#### Graphics layer — three tiers

```
┌──────────────────────────────────────────────────────────────┐
│  TIER 3 — MOTION (Framer Motion, ~6kb gzipped)                │
│  Screen transitions, level-up cinematics, world-unlock        │
│  sequences, badge reveals, roadblock gate animation           │
├──────────────────────────────────────────────────────────────┤
│  TIER 2 — GAME WORLD (PixiJS via @pixi/react, ~90kb, lazy)    │
│  Hand-crafted overworld map, avatar movement, hundreds of     │
│  GPU-accelerated particles, parallax, node glow states,       │
│  world-completion effects, retention-decay animations         │
├──────────────────────────────────────────────────────────────┤
│  TIER 1 — UI & CONTENT (React + CSS + SVG + KaTeX, ~25kb)     │
│  Question cards, buttons, stats, profiles, math notation,     │
│  SVG graphs — everything that exists today, unchanged         │
└──────────────────────────────────────────────────────────────┘
```

| Addition | Gzipped size | Loaded when |
|----------|-------------|-------------|
| KaTeX | ~25kb | World 3+ questions with advanced notation |
| Framer Motion | ~6kb | Always — small enough to include globally |
| PixiJS + @pixi/react | ~90kb | Lazy-loaded — only when map or celebration opens, never blocks Rush |

The Rush gameplay itself — the part that must feel instant — stays on the current CSS + Web Audio
path. The new weight only loads for screens where game graphics actually matter.

#### Math notation

KaTeX is used for World 3–5 notation: fractions, roots, exponents, integrals, matrices,
logarithms, derivatives. CSS superscripts are sufficient for Worlds 1–2 and are used there.

#### SVG graphs

Hand-written SVG — no charting library. A small `<GraphCanvas>` component renders linear,
quadratic, and exponential plots from level configuration. Full control over the neon visual
style; consistent with the zero-image-asset philosophy.

#### Why not Godot or Three.js

- **Godot web export** — second toolchain, second asset pipeline, hard seam between the game
  part and the React app. PixiJS inside React keeps one codebase, one build, one deploy.
- **Three.js** — not needed yet. Algebra is 2D. If a future Geometry Road needs rotating 3D
  solids, that is a scoped addition at that point, not a foundation requirement now.
- **PixiJS is the sweet spot** — WebGL performance but just an npm package. Current CSS particles
  cap at ~50 before performance drops; PixiJS handles thousands at 60fps. The existing visual
  language (streaks, flashes, bursts) can be ported into PixiJS incrementally.

---

### 29. Why Not a Native Game Engine?

Road to Math needs:

Fast web UI · Typed math logic · Local persistence · Keyboard-first gameplay ·
2D animated maps · Particles · Math notation · Simple graph rendering · Easy deployment

React, TypeScript, Vite, CSS, Web Audio, Node, Express, and SQLite cover these needs inside
one stack. PixiJS, Framer Motion, SVG, and KaTeX add game graphics without splitting the build.

**Principle: one codebase · one build · one deploy.**

---

### 30. Backend and Database Direction

#### Phase 1 database

```
SQLite · better-sqlite3 · Node.js · Express
```

Simple, file-based, fast, and easy to deploy on the local Debian home server.

#### Long-term migration path

| Phase | Database | Trigger |
|-------|---------|---------|
| Phase 1 | SQLite (current) | Local home-server, family use |
| Phase 2 | SQLite + WAL mode + indexes + cached summaries | More players, same hardware |
| Phase 3 | PostgreSQL | High write concurrency or public usage |

The schema and data-access layer should stay SQL-portable so PostgreSQL migration is realistic.
This avoids overengineering today while keeping a serious long-term path.

---

### 31. Database Design

The database stores **submitted answer attempts**, not raw keystrokes.

#### Core event log

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    avatar_icon TEXT,
    avatar_color TEXT,
    birth_year INTEGER,          -- used to calculate age handicap multiplier
    xp_total INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE play_sessions (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    FOREIGN KEY(player_id) REFERENCES users(id)
);

CREATE TABLE question_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    session_id TEXT,
    road_id TEXT NOT NULL,
    world_id TEXT NOT NULL,
    level_id TEXT NOT NULL,
    instinct_id TEXT NOT NULL,
    question_template_id TEXT,
    question_type TEXT CHECK(question_type IN (
        'solve', 'evaluate', 'identify', 'multipleChoice',
        'trueFalse', 'fillBlank', 'wordProblem', 'graphQuestion'
    )),
    mode TEXT CHECK(mode IN (
        'learn', 'practice', 'rush', 'review', 'popQuiz', 'roadblock'
    )),
    is_correct BOOLEAN NOT NULL,
    answer_value TEXT,
    expected_answer TEXT,
    answer_time_ms INTEGER,
    question_payload_json TEXT,
    is_review_injected BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES users(id)
);
```

`question_attempts` is the append-only source of truth. If mastery thresholds are ever retuned,
the full history can be recomputed — this would not be possible with pre-aggregated tables alone.

#### Indexes

```sql
CREATE INDEX idx_attempts_player_level_created
ON question_attempts (player_id, level_id, created_at DESC);

CREATE INDEX idx_attempts_player_instinct_created
ON question_attempts (player_id, instinct_id, created_at DESC);

CREATE INDEX idx_attempts_player_mode_created
ON question_attempts (player_id, mode, created_at DESC);

CREATE INDEX idx_attempts_player_review_created
ON question_attempts (player_id, is_review_injected, created_at DESC);

CREATE INDEX idx_sessions_player_activity
ON play_sessions (player_id, last_activity_at DESC);
```

#### SQLite runtime settings

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
```

#### Summary tables for fast UI reads

The event log is the source of truth, but live gameplay cannot recalculate mastery signals
from raw attempts on every screen render. Summary tables provide fast reads:

```
level_progress       — current signal values per player per level
mastery_snapshots    — point-in-time mastery state for history / decay tracking
review_queue         — next-up content for the current session
retention_schedule   — per-instinct review scheduling
retention_checks     — pop quiz and roadblock results
rush_sessions        — aggregated rush outcomes
practice_sessions    — aggregated practice outcomes
player_stats         — top-level profile stats
```

---

### 32. Retention Data Model

```sql
CREATE TABLE retention_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    instinct_id TEXT NOT NULL,
    road_id TEXT NOT NULL,
    level_id TEXT NOT NULL,
    retention_state TEXT CHECK(retention_state IN (
        'new', 'strong', 'watch', 'needsRefresh', 'gold'
    )),
    next_review_at DATETIME,
    interval_days INTEGER DEFAULT 1,
    last_review_result TEXT CHECK(last_review_result IN ('passed', 'failed', 'partial')),
    success_streak INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES users(id)
);

CREATE INDEX idx_retention_due
ON retention_schedule (player_id, next_review_at, retention_state);

CREATE TABLE retention_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    check_type TEXT CHECK(check_type IN ('popQuiz', 'roadblock')),
    road_id TEXT,
    world_id TEXT,
    target_unlock_id TEXT,
    result TEXT CHECK(result IN ('passed', 'failed', 'partial')),
    score_percent INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES users(id)
);
```

This lets the game know: what skill needs review · when it should return · whether it was
checked through pop quiz or roadblock · whether the interval should expand or shrink ·
whether the map node should visually decay.

---

### 33. Content and Question Engine

The question engine is data-driven. Adding new levels within existing question formats
requires only a new content configuration file, not new application code.

Adding a completely new interaction type (e.g., a geometry angle-dragging question) requires
a small engine extension. This is more realistic than claiming all future content is always
data-only — but the system covers the full Road to Algebra content without any engine changes.

#### Example level configuration

```json
{
  "levelId": "algebra-linear-two-step",
  "worldId": "linear-equations",
  "roadId": "algebra",
  "name": "Two-Step Linear Engine",
  "instinctId": "instinct-isolate-two-step",
  "benchmarkAnswerSeconds": 5,
  "rushDurationSeconds": 90,

  "activeQuestionTypes": ["solve", "multipleChoice", "trueFalse", "fillBlank"],

  "modes": {
    "learn": true,
    "practice": true,
    "rush": true,
    "review": true,
    "popQuiz": true,
    "roadblockEligible": true
  },

  "masteryPolicy": {
    "minUnderstanding": 80,
    "minRecognition": 75,
    "minFluency": 75,
    "minAttempts": 20,
    "minSessions": 2,
    "retentionRequiredForLevelUnlock": false,
    "retentionRequiredForGoldMastery": true,
    "retentionRequiredForRoadGate": true
  },

  "retentionPolicy": {
    "initialReviewDelayDays": 1,
    "passIntervalsDays": [3, 7, 14, 30],
    "failReviewDelayDays": 1,
    "popQuizEligible": true,
    "roadblockEligible": true,
    "importanceWeight": 0.9,
    "prerequisiteFor": ["algebra-linear-systems", "algebra-inequalities"]
  },

  "learnMode": {
    "conceptCard": {
      "title": "Stripping Layers",
      "priorKnowledgeHook": "You already know how to solve x + 4 = 10 by subtracting 4.",
      "bridgeStatement": "When a variable has two numbers stuck to it, strip away the outside layer first before dividing.",
      "visualEquationMarkdown": "3x + 4 = 19 → subtract 4 → 3x = 15 → divide by 3 → x = 5"
    },
    "interactiveSlideshow": [
      {
        "slideType": "reveal_move",
        "instructionText": "Look at 2x - 3 = 7. Cancel the -3 first by adding 3 to both sides.",
        "equationDisplay": "2x = 7 + 3 → 2x = 10"
      },
      {
        "slideType": "interactive_dummy",
        "instructionText": "Now isolate x by dividing by 2. Type the correct value.",
        "equationDisplay": "2x = 10",
        "targetInputValue": "5"
      }
    ]
  },

  "generators": {
    "symbolic": {
      "template": "{{a}}x + {{b}} = {{c}}",
      "variables": {
        "a": "range(2, 9)",
        "x": "range(2, 12)",
        "b": "range(1, 15)"
      },
      "evaluations": {
        "calculate_c": "a * x + b"
      }
    },
    "wordProblemStub": {
      "enabled": false,
      "phase": 2,
      "textTemplates": []
    }
  }
}
```

---

### 34. Testing Strategy

With hundreds of level templates, automated testing is not optional.

**Test every template for:**

- Generated question has a valid, unambiguous answer
- Multiple Choice has exactly one correct option
- Wrong options are plausible but not accidentally correct
- Random variable ranges produce safe, age-appropriate values
- Level configs are structurally complete
- Question-type mixes are valid
- Mastery and retention policies are internally consistent
- Roadblock checks contain appropriate prerequisite instincts
- No template creates impossible or ambiguous questions

A single bad formula can silently teach the wrong thing to many players.
The test suite is the defense.

**Tools:** Vitest + TypeScript strict checks + template validation scripts

---

### 35. Hosting and Deployment

**Production target:**

```
Debian home server · Nginx · Static frontend build · Local Node/Express API · SQLite database
```

**Deploy process:**

```
Build frontend
Copy static files to Nginx web directory
Restart backend service when API changes
Run database migrations
Verify health endpoint
Open game
```

Every implementation milestone should include an explicit deploy plan.

---

## Part 8 — Build Plan

### 36. First Implementation Priority — Build the Spine

Not full graphics yet. Not every algebra level yet. Not advanced notation yet.

**Build the spine first:**

```
1.  Define roads, worlds, levels, instincts, and modes as typed config files
2.  Convert Math Rush into the shared Road to Math model (Rush = one mode)
3.  Add Learn / Practice / Rush / Review / Pop Quiz / Roadblock at the data level
4.  Log every submitted question attempt
5.  Calculate understanding, recognition, fluency, and retention signals
6.  Add automatic level unlocks
7.  Add Gold Mastery and Needs Refresh states
8.  Add adaptive retention scheduling
9.  Add pop quiz generation
10. Add roadblock checks for major gates
11. Add local server persistence with the full schema above
12. Show progress clearly in the UI
```

**Then build content and polish:**

```
1.  Build Road to Algebra World 1 (Levels 1–5)
2.  Add first real multi-format level with all four active question types
3.  Add Learn and Practice flows
4.  Add Algebra Rush mode
5.  Add adaptive retention questions
6.  Add first Roadblock gate (World 1 → World 2)
7.  Add PixiJS overworld map for Worlds 1–2
8.  Extend through Worlds 3–5 progressively
```

---

### 37. Open Decisions

| Decision | Status | Notes |
|----------|--------|-------|
| Name / URL | ✅ Resolved | One game, "Road to Math" — no separate branded URLs per Road |
| Shared player profile | ✅ Resolved | One profile, one XP bar, one continuous journey |
| Tech stack for graphics | ✅ Resolved | PixiJS (overworld) + Framer Motion (sequences) on existing React/CSS stack |
| Overworld art style | ✅ Resolved | Hand-crafted PixiJS per World — see World visual identity table |
| Mobile inside gameplay | ✅ Resolved | Keyboard-first for all gameplay sessions; touch/mouse for menus and maps |
| Session definition | ✅ Resolved | 30+ minutes of inactivity = new session |
| Pop Quiz UI feel | ✅ Resolved | Gentle countdown (~20–25s per question), no combo meter, no streak visual — calm, not rushed |
| Rush length per World | ✅ Resolved | Configurable per World: Worlds 1–2 = 90s · World 3 = 75s · Worlds 4–5 = 60s |
| Express Pass | ✅ Resolved | 2 Rushes averaging ≥ 90% + speed benchmark → immediate unlock, no cooldown, applies to levels and Worlds equally. Road Gate still requires Roadblock Check. |
| Level entry choice | ✅ Resolved | Every new level offers "Start with tutorial" or "I already know this — go straight to Rush" |
| Family leaderboard detail | ✅ Resolved | Two systems: weekly Growth Score (improvement vs self) + all-time Age-Handicapped Score (Performance Rating × age multiplier). Birth year stored in player profile. |
| Five formats vs variants | ✅ Resolved | Five primary structural formats; Evaluate, Identify, and Graph Question are specialized variants, not additional core formats. |
| Road to Arithmetic map | ✅ Resolved | Starting gate defined as 3 Worlds and 9 Levels, mapped from Math Rush into the Road to Math model. |
| Starter XP economy | ✅ Resolved | Initial XP values defined; tuneable after playtesting; XP cannot bypass mastery gates. |
| Abandoned Rush behavior | ✅ Resolved | Submitted attempts are logged; unfinished Rushes do not count for Express Pass, records, leaderboards, completion XP, or positive unlocks. |

---

## Part 9 — Closing

### 38. North-Star Statement

Road to Math is a mastery-based math adventure that turns the core logic moves of mathematics
into instinct.

Every Road is broken into Worlds and Levels. Every Level trains one small instinct through
multiple structural question formats. Every Level can be learned, practiced, rushed, reviewed,
and retention-checked.

Progress is unlocked by demonstrated understanding, recognition, and fluency. Long-term Gold
Mastery is earned through retention. Major Road transitions are protected by adaptive roadblock
checks. Pop quizzes and review scheduling keep old skills alive without making the game
feel punitive.

XP motivates play. Mastery controls progression.

The game is keyboard-first during gameplay — fast, arcade-like, and flow-focused. Wrong answers
break streaks but do not stop the session. Feedback happens after the run so the player stays
immersed.

Technically, Road to Math stays lightweight and local-server friendly: React, TypeScript, Vite,
CSS, Web Audio, Node, Express, and SQLite for Phase 1 — with PixiJS, Framer Motion, SVG, and
KaTeX added as the product grows. The database design stays SQL-portable so PostgreSQL can
replace SQLite later if concurrency grows.

The goal is not just for players to solve math.

The goal is for players to feel:

> *"I see the move. I know the move. I can do it. And I still own it later."*

**That is math becoming instinct.**

