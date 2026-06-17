import assert from "node:assert/strict";
import test from "node:test";
import { roadToArithmetic, roads, validateRoads } from "../dist/index.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const levels = roadToArithmetic.worlds.flatMap((world) => world.levels);

test("Road to Arithmetic config passes reusable validation", () => {
  assert.deepEqual(validateRoads(roads), []);
});

test("Road to Arithmetic Phase 0 uses the spiral mastery level plan", () => {
  assert.equal(roadToArithmetic.worlds.length, 4);
  assert.equal(levels.length, 18);
  assert.deepEqual(levels.map((level) => level.displayName), [
    "Count Forward / Backward",
    "Whole Number Line",
    "Compare Whole Numbers",
    "Whole Number Patterns",
    "Quick Add",
    "Make Ten",
    "Quick Subtract",
    "Add / Subtract Mixed",
    "Multiplication Groups",
    "Division Finder",
    "Operation Patterns",
    "Missing Number Basics",
    "Order Sense",
    "Negative Number Line",
    "Compare Negative Numbers",
    "Negative Steps",
    "Missing Number Mixed",
    "Arithmetic Roadblock"
  ]);
});

test("reusable instincts recur in later levels", () => {
  const instincts = levels.map((level) => level.coreInstinct.instinctId);
  assert.ok(instincts.filter((id) => id === "instinct-counting-step").length >= 2);
  assert.ok(instincts.filter((id) => id === "instinct-number-line").length >= 2);
  assert.ok(instincts.filter((id) => id === "instinct-number-compare").length >= 2);
  assert.ok(instincts.filter((id) => id === "instinct-patterns").length >= 2);
  assert.ok(instincts.filter((id) => id === "instinct-missing-number").length >= 2);
});

test("config validation rejects unsupported question formats", () => {
  const invalidRoad = clone(roadToArithmetic);
  invalidRoad.worlds[0].levels[0].supportedQuestionFormats = ["solve", "graphQuestion"];
  const issues = validateRoads([invalidRoad]);
  assert.ok(issues.some((issue) => issue.message.includes("unsupported question format 'graphQuestion'")));
});

test("config validation catches duplicate level IDs and missing mastery thresholds", () => {
  const invalidRoad = clone(roadToArithmetic);
  invalidRoad.worlds[0].levels[1].levelId = invalidRoad.worlds[0].levels[0].levelId;
  delete invalidRoad.worlds[0].levels[2].masteryPolicy.minFluencyPercent;
  const issues = validateRoads([invalidRoad]);
  assert.ok(issues.some((issue) => issue.message.includes("duplicated")));
  assert.ok(issues.some((issue) => issue.message.includes("minFluencyPercent")));
});
