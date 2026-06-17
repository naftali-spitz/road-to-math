import { firstBuildMasteryPolicy, starterXPPolicy } from "./default-policies.js";
import type { Level, QuestionFormat, QuestionGeneratorKey, QuestionTemplate, Road } from "./types.js";

const roadId = "road-to-arithmetic";
const allFirstBuildFormats: QuestionFormat[] = ["solve", "fillBlank", "trueFalse", "multipleChoice"];

type LevelSeed = {
  levelId: string;
  worldId: string;
  order: number;
  displayName: string;
  generatorKey: QuestionGeneratorKey;
  instinctId: string;
  instinctDescription: string;
  benchmarkAnswerSeconds: number;
  sampleQuestionTemplates: QuestionTemplate[];
};

function createLevel(seed: LevelSeed): Level {
  const { instinctId, instinctDescription, ...level } = seed;

  return {
    ...level,
    roadId,
    coreInstinct: {
      instinctId,
      description: instinctDescription
    },
    supportedQuestionFormats: allFirstBuildFormats,
    masteryPolicy: firstBuildMasteryPolicy
  };
}

const world1Id = "whole-number-instinct";
const world2Id = "add-subtract-instinct";
const world3Id = "group-split-instinct";
const world4Id = "pre-algebra-gate";

const levels: LevelSeed[] = [
  {
    levelId: "arithmetic-count-forward-backward",
    worldId: world1Id,
    order: 1,
    displayName: "Count Forward / Backward",
    generatorKey: "countingStep",
    instinctId: "instinct-counting-step",
    instinctDescription: "Numbers can move by a fixed step forward or backward.",
    benchmarkAnswerSeconds: 2.5,
    sampleQuestionTemplates: [
      { templateId: "counting-step-next-number", format: "fillBlank", prompt: "7, 8, 9, ?", answer: 10 },
      { templateId: "counting-step-skip-by-five", format: "solve", prompt: "5, 10, 15, ?", answer: 20 }
    ]
  },
  {
    levelId: "arithmetic-whole-number-line",
    worldId: world1Id,
    order: 2,
    displayName: "Whole Number Line",
    generatorKey: "wholeNumberLine",
    instinctId: "instinct-number-line",
    instinctDescription: "Numbers are positions, and addition/subtraction are movement.",
    benchmarkAnswerSeconds: 3,
    sampleQuestionTemplates: [
      { templateId: "whole-number-line-move-forward", format: "solve", prompt: "Start at 6. Move +4. Land on ?", answer: 10 },
      { templateId: "whole-number-line-between", format: "fillBlank", prompt: "Number halfway between 4 and 8 = ?", answer: 6 }
    ]
  },
  {
    levelId: "arithmetic-compare-whole-numbers",
    worldId: world1Id,
    order: 3,
    displayName: "Compare Whole Numbers",
    generatorKey: "wholeNumberCompare",
    instinctId: "instinct-number-compare",
    instinctDescription: "Bigger/smaller/equal is based on number value.",
    benchmarkAnswerSeconds: 3,
    sampleQuestionTemplates: [
      { templateId: "whole-number-compare-bigger", format: "multipleChoice", prompt: "Bigger number: 8 or 15 = ?", answer: 15, choices: [8, 15] },
      { templateId: "whole-number-compare-symbol", format: "fillBlank", prompt: "7 __ 9", answer: "<" }
    ]
  },
  {
    levelId: "arithmetic-whole-number-patterns",
    worldId: world1Id,
    order: 4,
    displayName: "Whole Number Patterns",
    generatorKey: "wholeNumberPatterns",
    instinctId: "instinct-patterns",
    instinctDescription: "A sequence can follow a repeated rule.",
    benchmarkAnswerSeconds: 3.5,
    sampleQuestionTemplates: [
      { templateId: "whole-number-pattern-plus-two", format: "fillBlank", prompt: "2, 4, 6, 8, ?", answer: 10 },
      { templateId: "whole-number-pattern-plus-five", format: "solve", prompt: "5, 10, 15, ?", answer: 20 }
    ]
  },
  {
    levelId: "arithmetic-quick-add",
    worldId: world2Id,
    order: 5,
    displayName: "Quick Add",
    generatorKey: "quickAdd",
    instinctId: "instinct-quick-add",
    instinctDescription: "Addition combines values into a total.",
    benchmarkAnswerSeconds: 4,
    sampleQuestionTemplates: [
      { templateId: "quick-add-eight-seven", format: "solve", prompt: "8 + 7 = ?", answer: 15 },
      { templateId: "quick-add-nine-six", format: "solve", prompt: "9 + 6 = ?", answer: 15 }
    ]
  },
  {
    levelId: "arithmetic-make-ten",
    worldId: world2Id,
    order: 6,
    displayName: "Make Ten",
    generatorKey: "makeTen",
    instinctId: "instinct-make-ten",
    instinctDescription: "10 is an anchor that makes addition faster.",
    benchmarkAnswerSeconds: 3.5,
    sampleQuestionTemplates: [
      { templateId: "make-ten-missing-addend-right", format: "fillBlank", prompt: "6 + ? = 10", answer: 4 },
      { templateId: "make-ten-missing-addend-left", format: "fillBlank", prompt: "? + 3 = 10", answer: 7 }
    ]
  },
  {
    levelId: "arithmetic-quick-subtract",
    worldId: world2Id,
    order: 7,
    displayName: "Quick Subtract",
    generatorKey: "quickSubtract",
    instinctId: "instinct-quick-subtract",
    instinctDescription: "Subtraction finds what is left or the difference.",
    benchmarkAnswerSeconds: 4,
    sampleQuestionTemplates: [
      { templateId: "quick-subtract-fourteen-six", format: "solve", prompt: "14 - 6 = ?", answer: 8 },
      { templateId: "quick-subtract-missing", format: "fillBlank", prompt: "15 - ? = 9", answer: 6 }
    ]
  },
  {
    levelId: "arithmetic-add-subtract-mixed",
    worldId: world2Id,
    order: 8,
    displayName: "Add / Subtract Mixed",
    generatorKey: "addSubtractMixed",
    instinctId: "instinct-choose-operation",
    instinctDescription: "Choose whether a situation is combining or taking away.",
    benchmarkAnswerSeconds: 4.5,
    sampleQuestionTemplates: [
      { templateId: "add-subtract-mixed-add", format: "solve", prompt: "9 + 4 = ?", answer: 13 },
      { templateId: "add-subtract-mixed-subtract", format: "solve", prompt: "13 - 4 = ?", answer: 9 }
    ]
  },
  {
    levelId: "arithmetic-multiplication-groups",
    worldId: world3Id,
    order: 9,
    displayName: "Multiplication Groups",
    generatorKey: "multiplicationGroups",
    instinctId: "instinct-multiplication-groups",
    instinctDescription: "Multiplication means equal groups.",
    benchmarkAnswerSeconds: 5,
    sampleQuestionTemplates: [
      { templateId: "multiplication-groups-three-four", format: "solve", prompt: "3 × 4 = ?", answer: 12 },
      { templateId: "multiplication-groups-five-of-three", format: "solve", prompt: "5 groups of 3 = ?", answer: 15 }
    ]
  },
  {
    levelId: "arithmetic-division-finder",
    worldId: world3Id,
    order: 10,
    displayName: "Division Finder",
    generatorKey: "divisionFinder",
    instinctId: "instinct-division-finder",
    instinctDescription: "Division reverses multiplication into equal groups.",
    benchmarkAnswerSeconds: 5,
    sampleQuestionTemplates: [
      { templateId: "division-finder-twenty-five", format: "solve", prompt: "20 ÷ 5 = ?", answer: 4 },
      { templateId: "division-finder-missing-groups", format: "fillBlank", prompt: "? groups of 4 make 20", answer: 5 }
    ]
  },
  {
    levelId: "arithmetic-operation-patterns",
    worldId: world3Id,
    order: 11,
    displayName: "Operation Patterns",
    generatorKey: "operationPatterns",
    instinctId: "instinct-patterns",
    instinctDescription: "Operation facts form repeated patterns that reveal a rule.",
    benchmarkAnswerSeconds: 5,
    sampleQuestionTemplates: [
      { templateId: "operation-pattern-times-four", format: "fillBlank", prompt: "4, 8, 12, 16, ?", answer: 20 },
      { templateId: "operation-pattern-output", format: "solve", prompt: "Rule: ×3. Input 5. Output ?", answer: 15 }
    ]
  },
  {
    levelId: "arithmetic-missing-number-basics",
    worldId: world3Id,
    order: 12,
    displayName: "Missing Number Basics",
    generatorKey: "missingNumberBasics",
    instinctId: "instinct-missing-number",
    instinctDescription: "A missing number can be found by using the inverse operation.",
    benchmarkAnswerSeconds: 5,
    sampleQuestionTemplates: [
      { templateId: "missing-number-basic-add", format: "fillBlank", prompt: "7 + ? = 12", answer: 5 },
      { templateId: "missing-number-basic-factor", format: "fillBlank", prompt: "3 × ? = 18", answer: 6 }
    ]
  },
  {
    levelId: "arithmetic-order-sense",
    worldId: world4Id,
    order: 13,
    displayName: "Order Sense",
    generatorKey: "orderSense",
    instinctId: "instinct-order-sense",
    instinctDescription: "Multiplication happens before addition unless brackets change it.",
    benchmarkAnswerSeconds: 5,
    sampleQuestionTemplates: [
      { templateId: "order-sense-multiply-before-add", format: "solve", prompt: "2 + 3 × 4 = ?", answer: 14 },
      { templateId: "order-sense-brackets-first", format: "solve", prompt: "(2 + 3) × 4 = ?", answer: 20 }
    ]
  },
  {
    levelId: "arithmetic-negative-number-line",
    worldId: world4Id,
    order: 14,
    displayName: "Negative Number Line",
    generatorKey: "negativeNumberLine",
    instinctId: "instinct-number-line",
    instinctDescription: "The number line continues below zero, and movement can cross zero.",
    benchmarkAnswerSeconds: 5,
    sampleQuestionTemplates: [
      { templateId: "negative-number-line-cross-zero", format: "solve", prompt: "Start at -2. Move +5. Land on ?", answer: 3 },
      { templateId: "negative-number-line-left", format: "solve", prompt: "Start at 3. Move -6. Land on ?", answer: -3 }
    ]
  },
  {
    levelId: "arithmetic-compare-negative-numbers",
    worldId: world4Id,
    order: 15,
    displayName: "Compare Negative Numbers",
    generatorKey: "compareNegativeNumbers",
    instinctId: "instinct-number-compare",
    instinctDescription: "For negatives, numbers farther right on the number line are greater.",
    benchmarkAnswerSeconds: 5,
    sampleQuestionTemplates: [
      { templateId: "compare-negative-bigger", format: "multipleChoice", prompt: "Bigger number: -3 or -7 = ?", answer: -3, choices: [-3, -7] },
      { templateId: "compare-negative-symbol", format: "fillBlank", prompt: "-6 __ -2", answer: "<" }
    ]
  },
  {
    levelId: "arithmetic-negative-steps",
    worldId: world4Id,
    order: 16,
    displayName: "Negative Steps",
    generatorKey: "negativeSteps",
    instinctId: "instinct-counting-step",
    instinctDescription: "Counting steps can move through zero and into negative values.",
    benchmarkAnswerSeconds: 5,
    sampleQuestionTemplates: [
      { templateId: "negative-steps-plus-two", format: "fillBlank", prompt: "-6, -4, -2, 0, ?", answer: 2 },
      { templateId: "negative-steps-minus-three", format: "solve", prompt: "3, 0, -3, ?", answer: -6 }
    ]
  },
  {
    levelId: "arithmetic-missing-number-mixed",
    worldId: world4Id,
    order: 17,
    displayName: "Missing Number Mixed",
    generatorKey: "missingNumberMixed",
    instinctId: "instinct-missing-number",
    instinctDescription: "Unknowns can appear in different operations and positions.",
    benchmarkAnswerSeconds: 5.5,
    sampleQuestionTemplates: [
      { templateId: "missing-number-mixed-subtract", format: "fillBlank", prompt: "? - 4 = 9", answer: 13 },
      { templateId: "missing-number-mixed-negative", format: "fillBlank", prompt: "? + 5 = 2", answer: -3 }
    ]
  },
  {
    levelId: "arithmetic-roadblock",
    worldId: world4Id,
    order: 18,
    displayName: "Arithmetic Roadblock",
    generatorKey: "arithmeticRoadblock",
    instinctId: "instinct-retention-mixed-recall",
    instinctDescription: "Older arithmetic instincts must stay available after new skills appear.",
    benchmarkAnswerSeconds: 5.5,
    sampleQuestionTemplates: [
      { templateId: "arithmetic-roadblock-mixed-add", format: "solve", prompt: "8 + 6 = ?", answer: 14 },
      { templateId: "arithmetic-roadblock-negative-line", format: "solve", prompt: "Start at -4. Move +7. Land on ?", answer: 3 }
    ]
  }
];

function levelsFor(worldId: string) {
  return levels.filter((level) => level.worldId === worldId).map(createLevel);
}

export const roadToArithmetic: Road = {
  roadId,
  displayName: "Road to Arithmetic",
  xpPolicy: starterXPPolicy,
  worlds: [
    { worldId: world1Id, roadId, order: 1, displayName: "Whole Number Instinct", levels: levelsFor(world1Id) },
    { worldId: world2Id, roadId, order: 2, displayName: "Add / Subtract Instinct", levels: levelsFor(world2Id) },
    { worldId: world3Id, roadId, order: 3, displayName: "Group / Split Instinct", levels: levelsFor(world3Id) },
    { worldId: world4Id, roadId, order: 4, displayName: "Pre-Algebra Gate", levels: levelsFor(world4Id) }
  ]
};

export const roads: Road[] = [roadToArithmetic];
