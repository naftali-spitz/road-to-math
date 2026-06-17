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
      assert.equal(question.payload.generatorKey, level.generatorKey);
      assert.equal(typeof JSON.stringify(question.payload), "string");
      assertSimpleValue(question.payload.correctAnswer);
      assertSimpleValue(question.expectedAnswer);
      assert.equal(checkAnswer(question, question.expectedAnswer).isCorrect, true);
      assert.equal(checkAnswer(question, wrongAnswerFor(question)).isCorrect, false);
    }
  }
});

test("multiple choice questions have four options and exactly one correct answer", () => {
  for (const level of levels) {
    const question = generateQuestion(level, { format: "multipleChoice", seed: `${level.levelId}:mc` });
    assert.equal(question.options.length, 4);
    assert.deepEqual(question.options.map((option) => option.optionId), ["1", "2", "3", "4"]);
    assert.equal(question.options.filter((option) => option.isCorrect).length, 1);
    assert.equal(question.options.find((option) => option.isCorrect).optionId, question.expectedAnswer);
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

test("answer checking accepts simple typed equivalents centrally", () => {
  const numericQuestion = generateQuestion(levels[3], { format: "solve", seed: "numeric-equivalent" });
  assert.equal(checkAnswer(numericQuestion, String(numericQuestion.expectedAnswer)).isCorrect, true);
  assert.equal(checkAnswer(numericQuestion, `${numericQuestion.expectedAnswer}.0`).isCorrect, true);

  const trueFalseQuestion = generateQuestion(levels[0], { format: "trueFalse", seed: "true-false-equivalent" });
  assert.equal(checkAnswer(trueFalseQuestion, trueFalseQuestion.expectedAnswer ? "t" : "f").isCorrect, true);
});
