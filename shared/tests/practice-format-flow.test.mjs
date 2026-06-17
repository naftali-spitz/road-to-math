import assert from "node:assert/strict";
import test from "node:test";
import {
  advancePracticeFormatState,
  choosePracticeQuestionFormat,
  getCurrentPracticeFormat,
  initialPracticeFormatState
} from "../dist/index.js";

const formats = ["solve", "fillBlank", "trueFalse", "multipleChoice"];

function answerMany(state, results) {
  return results.reduce((current, isCorrect) => advancePracticeFormatState(formats, current, isCorrect), state);
}

test("Practice starts with one format and introduces the next after 3 consecutive correct answers", () => {
  let state = initialPracticeFormatState;

  assert.equal(getCurrentPracticeFormat(formats, state), "solve");
  state = answerMany(state, [true, true]);
  assert.equal(getCurrentPracticeFormat(formats, state), "solve");
  assert.equal(state.consecutiveCorrect, 2);

  state = advancePracticeFormatState(formats, state, true);
  assert.deepEqual(state.introducedFormats, ["solve"]);
  assert.equal(getCurrentPracticeFormat(formats, state), "fillBlank");
  assert.equal(state.consecutiveCorrect, 0);
});

test("Practice resets the current format streak on a wrong answer without removing introduced formats", () => {
  let state = answerMany(initialPracticeFormatState, [true, true, true]);
  assert.deepEqual(state.introducedFormats, ["solve"]);

  state = answerMany(state, [true, false]);
  assert.equal(getCurrentPracticeFormat(formats, state), "fillBlank");
  assert.deepEqual(state.introducedFormats, ["solve"]);
  assert.equal(state.consecutiveCorrect, 0);
});

test("Practice mixes all active formats after each format has been introduced", () => {
  const state = answerMany(initialPracticeFormatState, [
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  ]);

  assert.deepEqual(state.introducedFormats, formats);
  assert.equal(getCurrentPracticeFormat(formats, state), "mixed");
  assert.equal(choosePracticeQuestionFormat(formats, state, 0), "solve");
  assert.equal(choosePracticeQuestionFormat(formats, state, 3), "multipleChoice");
  assert.equal(choosePracticeQuestionFormat(formats, state, 4), "solve");
});
