import assert from "node:assert/strict";
import test from "node:test";
import { roadToArithmetic, roads, validateRoads } from "../dist/index.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Road to Arithmetic config passes reusable validation", () => {
  const issues = validateRoads(roads);
  assert.deepEqual(issues, []);
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
