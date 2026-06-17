import { firstBuildMasteryPolicy, starterXPPolicy } from "./default-policies.js";
import type { Level, QuestionFormat, Road } from "./types.js";

const roadId = "road-to-arithmetic";

const allFirstBuildFormats: QuestionFormat[] = [
  "solve",
  "fillBlank",
  "trueFalse",
  "multipleChoice"
];

function createLevel(level: Omit<Level, "roadId" | "masteryPolicy" | "supportedQuestionFormats">): Level {
  return {
    ...level,
    roadId,
    supportedQuestionFormats: allFirstBuildFormats,
    masteryPolicy: firstBuildMasteryPolicy
  };
}

const world1Id = "number-sense";
const world2Id = "core-operations";
const world3Id = "mixed-fluency-algebra-gate";

export const roadToArithmetic: Road = {
  roadId,
  displayName: "Road to Arithmetic",
  xpPolicy: starterXPPolicy,
  worlds: [
    {
      worldId: world1Id,
      roadId,
      order: 1,
      displayName: "Number Sense",
      levels: [
        createLevel({
          levelId: "arithmetic-counting-step",
          worldId: world1Id,
          order: 1,
          displayName: "Counting Step",
          generatorKey: "countingStep",
          coreInstinct: {
            instinctId: "instinct-counting-step",
            description: "Numbers move forward and backward by 1."
          },
          benchmarkAnswerSeconds: 2.5,
          sampleQuestionTemplates: [
            {
              templateId: "counting-step-next-number",
              format: "fillBlank",
              prompt: "7, 8, 9, ?",
              answer: 10
            },
            {
              templateId: "counting-step-before-number",
              format: "solve",
              prompt: "What comes before 12?",
              answer: 11
            }
          ]
        }),
        createLevel({
          levelId: "arithmetic-number-compare",
          worldId: world1Id,
          order: 2,
          displayName: "Number Compare",
          generatorKey: "numberCompare",
          coreInstinct: {
            instinctId: "instinct-number-compare",
            description: "Bigger/smaller/equal is based on number value."
          },
          benchmarkAnswerSeconds: 3,
          sampleQuestionTemplates: [
            {
              templateId: "number-compare-bigger",
              format: "multipleChoice",
              prompt: "Which is bigger: 8 or 5?",
              answer: 8,
              choices: [8, 5]
            },
            {
              templateId: "number-compare-symbol",
              format: "fillBlank",
              prompt: "7 __ 9",
              answer: "<"
            }
          ]
        }),
        createLevel({
          levelId: "arithmetic-make-ten",
          worldId: world1Id,
          order: 3,
          displayName: "Make Ten",
          generatorKey: "makeTen",
          coreInstinct: {
            instinctId: "instinct-make-ten",
            description: "Pairs can combine to make 10."
          },
          benchmarkAnswerSeconds: 3.5,
          sampleQuestionTemplates: [
            {
              templateId: "make-ten-missing-addend-right",
              format: "fillBlank",
              prompt: "6 + ? = 10",
              answer: 4
            },
            {
              templateId: "make-ten-missing-addend-left",
              format: "fillBlank",
              prompt: "? + 3 = 10",
              answer: 7
            }
          ]
        })
      ]
    },
    {
      worldId: world2Id,
      roadId,
      order: 2,
      displayName: "Core Operations",
      levels: [
        createLevel({
          levelId: "arithmetic-addition-builder",
          worldId: world2Id,
          order: 4,
          displayName: "Addition Builder",
          generatorKey: "additionBuilder",
          coreInstinct: {
            instinctId: "instinct-addition-builder",
            description: "Addition combines values into a total."
          },
          benchmarkAnswerSeconds: 4,
          sampleQuestionTemplates: [
            {
              templateId: "addition-builder-eight-seven",
              format: "solve",
              prompt: "8 + 7 = ?",
              answer: 15
            },
            {
              templateId: "addition-builder-nine-six",
              format: "solve",
              prompt: "9 + 6 = ?",
              answer: 15
            }
          ]
        }),
        createLevel({
          levelId: "arithmetic-subtraction-splitter",
          worldId: world2Id,
          order: 5,
          displayName: "Subtraction Splitter",
          generatorKey: "subtractionSplitter",
          coreInstinct: {
            instinctId: "instinct-subtraction-splitter",
            description: "Subtraction finds what is left or the difference."
          },
          benchmarkAnswerSeconds: 4,
          sampleQuestionTemplates: [
            {
              templateId: "subtraction-splitter-fourteen-six",
              format: "solve",
              prompt: "14 - 6 = ?",
              answer: 8
            },
            {
              templateId: "subtraction-splitter-missing",
              format: "fillBlank",
              prompt: "15 - ? = 9",
              answer: 6
            }
          ]
        }),
        createLevel({
          levelId: "arithmetic-multiplication-groups",
          worldId: world2Id,
          order: 6,
          displayName: "Multiplication Groups",
          generatorKey: "multiplicationGroups",
          coreInstinct: {
            instinctId: "instinct-multiplication-groups",
            description: "Multiplication means equal groups."
          },
          benchmarkAnswerSeconds: 5,
          sampleQuestionTemplates: [
            {
              templateId: "multiplication-groups-three-four",
              format: "solve",
              prompt: "3 × 4 = ?",
              answer: 12
            },
            {
              templateId: "multiplication-groups-five-of-three",
              format: "solve",
              prompt: "5 groups of 3 = ?",
              answer: 15
            }
          ]
        })
      ]
    },
    {
      worldId: world3Id,
      roadId,
      order: 3,
      displayName: "Mixed Fluency / Algebra Gate",
      levels: [
        createLevel({
          levelId: "arithmetic-division-finder",
          worldId: world3Id,
          order: 7,
          displayName: "Division Finder",
          generatorKey: "divisionFinder",
          coreInstinct: {
            instinctId: "instinct-division-finder",
            description: "Division reverses multiplication into equal groups."
          },
          benchmarkAnswerSeconds: 5,
          sampleQuestionTemplates: [
            {
              templateId: "division-finder-twenty-five",
              format: "solve",
              prompt: "20 ÷ 5 = ?",
              answer: 4
            },
            {
              templateId: "division-finder-missing-groups",
              format: "fillBlank",
              prompt: "? groups of 4 make 20",
              answer: 5
            }
          ]
        }),
        createLevel({
          levelId: "arithmetic-order-sense",
          worldId: world3Id,
          order: 8,
          displayName: "Order Sense",
          generatorKey: "orderSense",
          coreInstinct: {
            instinctId: "instinct-order-sense",
            description: "Multiplication happens before addition unless brackets change it."
          },
          benchmarkAnswerSeconds: 5,
          sampleQuestionTemplates: [
            {
              templateId: "order-sense-multiply-before-add",
              format: "solve",
              prompt: "2 + 3 × 4 = ?",
              answer: 14
            },
            {
              templateId: "order-sense-brackets-first",
              format: "solve",
              prompt: "(2 + 3) × 4 = ?",
              answer: 20
            }
          ]
        }),
        createLevel({
          levelId: "arithmetic-unknown-ready",
          worldId: world3Id,
          order: 9,
          displayName: "Unknown Ready",
          generatorKey: "unknownReady",
          coreInstinct: {
            instinctId: "instinct-unknown-ready",
            description: "A missing number can be found by using the inverse operation."
          },
          benchmarkAnswerSeconds: 5,
          sampleQuestionTemplates: [
            {
              templateId: "unknown-ready-x-plus-five",
              format: "solve",
              prompt: "x + 5 = 12",
              answer: 7
            },
            {
              templateId: "unknown-ready-missing-factor",
              format: "fillBlank",
              prompt: "3 × ? = 18",
              answer: 6
            }
          ]
        })
      ]
    }
  ]
};

export const roads: Road[] = [roadToArithmetic];
