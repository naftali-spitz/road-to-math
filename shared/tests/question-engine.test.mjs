import assert from "node:assert/strict";
import test from "node:test";
import { checkAnswer, generateQuestion, roadToArithmetic, supportedQuestionFormats } from "../dist/index.js";

const levels = roadToArithmetic.worlds.flatMap((world) => world.levels);

function assertSimpleValue(value) {
  if (typeof value === "number") {
    assert.ok(Number.isInteger(value), `Expected integer value, got ${value}`);
    assert.ok(value >= -100 && value <= 100, `Expected bounded value, got ${value}`);
  }
}

function wrongAnswerFor(question) {
  if (question.format === "trueFalse") return question.expectedAnswer === true ? "false" : "true";
  if (question.format === "multipleChoice") return question.options.find((option) => !option.isCorrect).optionId;
  if (typeof question.expectedAnswer === "number") return question.expectedAnswer + 1;
  return `${question.expectedAnswer}-wrong`;
}

test("generates valid questions for every Road to Arithmetic level and format", () => {
  assert.equal(levels.length, 18);

  for (const level of levels) {
    for (const format of supportedQuestionFormats) {
      const question = generateQuestion(level, { format, seed: `${level.levelId}:${format}:primary` });

      assert.ok(question.questionTemplateId.startsWith(`${level.levelId}.${format}.`));
      assert.ok(question.prompt);
      assert.notEqual(question.expectedAnswer, undefined);
      assert.equal(question.format, format);
      assert.equal(question.roadId, level.roadId);
      assert.equal(question.worldId, level.worldId);
      assert.equal(question.levelId, level.levelId);
      assert.equal(question.instinctId, level.coreInstinct.instinctId);
      assert.ok(question.fingerprint);
      assert.equal(typeof question.fingerprint, "string");
      assert.equal(question.payload.generatorKey, level.generatorKey);
      assert.equal(typeof JSON.stringify(question.payload), "string");
      assertSimpleValue(question.payload.correctAnswer);
      assertSimpleValue(question.expectedAnswer);
      assert.equal(checkAnswer(question, question.expectedAnswer).isCorrect, true);
      assert.equal(checkAnswer(question, wrongAnswerFor(question)).isCorrect, false);
    }
  }
});

test("same seed gives the same fingerprint", () => {
  const level = levels[0];
  const firstQuestion = generateQuestion(level, { format: "solve", seed: "stable-fingerprint" });
  const secondQuestion = generateQuestion(level, { format: "solve", seed: "stable-fingerprint" });

  assert.equal(firstQuestion.fingerprint, secondQuestion.fingerprint);
});

test("different generated variables give different fingerprints", () => {
  const level = levels[0];
  const fingerprints = new Set();

  for (let seed = 0; seed < 20; seed += 1) {
    fingerprints.add(generateQuestion(level, { format: "solve", seed: `variable-fingerprint:${seed}` }).fingerprint);
  }

  assert.ok(fingerprints.size > 1);
});

test("recentFingerprints causes generation to avoid a recent question when alternatives exist", () => {
  const level = levels[0];
  const recentQuestion = generateQuestion(level, { format: "solve", seed: "avoid-recent" });
  const nextQuestion = generateQuestion(level, {
    format: "solve",
    seed: "avoid-recent",
    recentFingerprints: [recentQuestion.fingerprint],
    maxGenerationAttempts: 8
  });

  assert.notEqual(nextQuestion.fingerprint, recentQuestion.fingerprint);
});

test("recentFingerprints uses a capped retry and returns a question when the recent list is large", () => {
  const level = levels[0];
  const recentFingerprints = [];

  for (let seed = 0; seed < 100; seed += 1) {
    recentFingerprints.push(generateQuestion(level, { format: "solve", seed: `large-recent:${seed}` }).fingerprint);
  }

  const question = generateQuestion(level, {
    format: "solve",
    seed: "large-recent:0",
    recentFingerprints,
    maxGenerationAttempts: 3
  });

  assert.ok(question.fingerprint);
  assert.equal(question.format, "solve");
});

test("fingerprint is present for every first-build question format", () => {
  const level = levels[0];

  for (const format of ["solve", "fillBlank", "trueFalse", "multipleChoice"]) {
    const question = generateQuestion(level, { format, seed: `fingerprint-format:${format}` });

    assert.ok(question.fingerprint);
    assert.ok(question.fingerprint.includes(level.levelId));
    assert.ok(question.fingerprint.includes(format));
    assert.ok(question.fingerprint.includes(question.payload.sourceTemplateId));
  }
});

test("first counting level stays beginner-friendly", () => {
  const firstLevel = levels[0];

  for (let seed = 0; seed < 400; seed += 1) {
    const question = generateQuestion(firstLevel, { format: "solve", seed: `counting-friendly:${seed}` });
    const step = Math.abs(question.payload.variables.step);
    const start = question.payload.variables.start;

    assert.ok(step === 1 || step === 2, `Expected step 1 or 2, got ${step} from ${question.prompt}`);
    assert.ok(start >= 0 && start <= 20, `Expected small start value, got ${start} from ${question.prompt}`);
    assert.ok(question.payload.correctAnswer >= 0, `Expected nonnegative answer from ${question.prompt}`);
    assert.ok(question.payload.correctAnswer <= 24, `Expected small answer from ${question.prompt}`);
  }
});

test("Arithmetic Roadblock can produce World 1 style source templates", () => {
  const roadblockLevel = levels.find((level) => level.generatorKey === "arithmeticRoadblock");
  assert.ok(roadblockLevel);

  const world1StylePrefixes = new Set([
    "counting-step",
    "whole-number-line",
    "whole-number-compare",
    "whole-number-pattern"
  ]);
  const seenPrefixes = new Set();

  for (let seed = 0; seed < 300; seed += 1) {
    const question = generateQuestion(roadblockLevel, { format: "solve", seed: `roadblock-world1:${seed}` });
    const prefix = [...world1StylePrefixes].find((entry) => question.payload.sourceTemplateId.startsWith(entry));

    if (prefix) {
      seenPrefixes.add(prefix);
    }
  }

  assert.ok(seenPrefixes.has("counting-step"), "Roadblock should include counting step review");
  assert.ok(seenPrefixes.has("whole-number-line"), "Roadblock should include whole number line review");
  assert.ok(seenPrefixes.has("whole-number-compare"), "Roadblock should include whole number compare review");
  assert.ok(seenPrefixes.has("whole-number-pattern"), "Roadblock should include whole number pattern review");
});

test("missingNumberMixed division-left answers stay within the Phase 0 cap", () => {
  const mixedLevel = levels.find((level) => level.generatorKey === "missingNumberMixed");
  assert.ok(mixedLevel);

  let sawDivisionLeft = false;

  for (let seed = 0; seed < 500; seed += 1) {
    const question = generateQuestion(mixedLevel, { format: "solve", seed: `division-left-cap:${seed}` });

    if (question.payload.sourceTemplateId === "missing-number-mixed-division-left") {
      sawDivisionLeft = true;
      assert.ok(question.payload.correctAnswer <= 40, `Expected capped answer, got ${question.payload.correctAnswer}`);
      assert.ok(question.payload.variables.missing >= 2 && question.payload.variables.missing <= 8);
      assert.ok(question.payload.variables.divisor >= 2 && question.payload.variables.divisor <= 5);
    }
  }

  assert.equal(sawDivisionLeft, true, "Expected seeds to cover missing-number mixed division-left variant");
});

test("multiple choice questions have four options and exactly one correct answer", () => {
  for (const level of levels) {
    for (let seed = 0; seed < 30; seed += 1) {
      const question = generateQuestion(level, { format: "multipleChoice", seed: `${level.levelId}:mc:${seed}` });
      const optionValueKeys = question.options.map((option) => `${typeof option.value}:${String(option.value)}`);

      assert.equal(question.options.length, 4);
      assert.deepEqual(question.options.map((option) => option.optionId), ["1", "2", "3", "4"]);
      assert.equal(new Set(optionValueKeys).size, 4, `Expected unique option values for ${question.prompt}`);
      assert.equal(question.options.filter((option) => option.isCorrect).length, 1);
      assert.equal(question.options.find((option) => option.isCorrect).optionId, question.expectedAnswer);
    }
  }
});

test("numeric multiple choice distractors are bounded and do not hang near answer boundaries", () => {
  const multiplicationLevel = levels.find((level) => level.generatorKey === "multiplicationGroups");
  assert.ok(multiplicationLevel);

  let foundHundredAnswer = false;

  for (let seed = 0; seed < 300; seed += 1) {
    const question = generateQuestion(multiplicationLevel, { format: "multipleChoice", seed: `boundary:${seed}` });

    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.value)).size, 4);

    for (const option of question.options) {
      assert.equal(typeof option.value, "number");
      assert.ok(option.value >= -100 && option.value <= 100, `Expected bounded distractor, got ${option.value}`);
    }

    foundHundredAnswer ||= question.payload.correctAnswer === 100;
  }

  assert.equal(foundHundredAnswer, true, "Expected test seeds to cover the upper numeric boundary answer 100");
});

test("true/false false statements use varied wrong asserted answers over time", () => {
  for (const level of levels) {
    const wrongAssertedAnswers = new Set();

    for (let seed = 0; seed < 80; seed += 1) {
      const question = generateQuestion(level, { format: "trueFalse", seed: `${level.levelId}:wrong-variety:${seed}` });

      if (question.expectedAnswer === false) {
        wrongAssertedAnswers.add(`${typeof question.payload.assertedAnswer}:${String(question.payload.assertedAnswer)}`);
      }
    }

    assert.ok(wrongAssertedAnswers.size >= 2, `${level.levelId} should use varied false asserted answers`);
  }
});

test("true/false generation produces true and false examples over time", () => {
  for (const level of levels) {
    const outcomes = new Set();
    for (let seed = 0; seed < 24; seed += 1) {
      const question = generateQuestion(level, { format: "trueFalse", seed: `${level.levelId}:tf:${seed}` });
      outcomes.add(question.expectedAnswer);
      assert.equal(typeof question.expectedAnswer, "boolean");
    }
    assert.deepEqual(outcomes, new Set([true, false]), `${level.levelId} should produce true and false statements`);
  }
});

test("true/false prompts are complete statements, not malformed questions", () => {
  for (const level of levels) {
    for (let seed = 0; seed < 24; seed += 1) {
      const question = generateQuestion(level, { format: "trueFalse", seed: `${level.levelId}:statement:${seed}` });
      const lowerPrompt = question.prompt.toLowerCase();

      assert.equal(question.prompt.includes("__"), false, question.prompt);
      assert.equal(question.prompt.includes("?"), false, question.prompt);
      assert.equal(lowerPrompt.includes("true or false: what"), false, question.prompt);
      assert.equal(lowerPrompt.includes("true or false: which"), false, question.prompt);
    }
  }
});

test("answer checking accepts simple typed equivalents centrally", () => {
  const numericQuestion = generateQuestion(levels[3], { format: "solve", seed: "numeric-equivalent" });
  assert.equal(checkAnswer(numericQuestion, String(numericQuestion.expectedAnswer)).isCorrect, true);
  assert.equal(checkAnswer(numericQuestion, `${numericQuestion.expectedAnswer}.0`).isCorrect, true);

  const trueFalseQuestion = generateQuestion(levels[0], { format: "trueFalse", seed: "true-false-equivalent" });
  assert.equal(checkAnswer(trueFalseQuestion, trueFalseQuestion.expectedAnswer ? "t" : "f").isCorrect, true);
});
