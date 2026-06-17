import type { AnswerValue, Level, QuestionFormat, QuestionGeneratorKey } from "../content/types.js";
import type { GeneratedQuestion, GenerateQuestionOptions, MultipleChoiceOption } from "./types.js";

type BaseQuestion = { sourceTemplateId: string; prompt: string; answer: AnswerValue; variables: Record<string, AnswerValue> };
type RandomSource = { nextInt(min: number, max: number): number; nextBoolean(): boolean };
type GeneratorFn = (random: RandomSource) => BaseQuestion;

const optionIds: MultipleChoiceOption["optionId"][] = ["1", "2", "3", "4"];

function hashSeed(seed: string | number) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: string | number = Date.now()): RandomSource {
  let state = hashSeed(seed) || 1;
  const next = () => ((state = Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296;
  return {
    nextInt: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    nextBoolean: () => next() >= 0.5
  };
}

function pick<T>(random: RandomSource, values: T[]) {
  return values[random.nextInt(0, values.length - 1)];
}

function renderAnswer(value: AnswerValue) {
  return typeof value === "boolean" ? (value ? "true" : "false") : String(value);
}

function createNumericDistractors(correct: number, random: RandomSource) {
  const distractors = new Set<number>();
  const offsets = [-10, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 10];

  while (distractors.size < 3) {
    const candidate = correct + pick(random, offsets);
    if (candidate >= -100 && candidate <= 100 && candidate !== correct) {
      distractors.add(candidate);
    }
  }

  return [...distractors];
}

function createStringDistractors(correct: string) {
  if (["<", ">", "="].includes(correct)) {
    return ["<", ">", "=", "!="].filter((value) => value !== correct);
  }

  return ["yes", "no", "maybe"].filter((value) => value !== correct).slice(0, 3);
}

function createDistractors(correct: AnswerValue, random: RandomSource): AnswerValue[] {
  if (typeof correct === "number") return createNumericDistractors(correct, random);
  if (typeof correct === "boolean") return [!correct, "true", "false"].filter((value) => value !== correct).slice(0, 3);

  const distractors = createStringDistractors(correct);
  while (distractors.length < 3) distractors.push(`${correct}${distractors.length + 1}`);
  return distractors.slice(0, 3);
}

function shuffle<T>(values: T[], random: RandomSource) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = random.nextInt(0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createOptions(correct: AnswerValue, random: RandomSource): MultipleChoiceOption[] {
  return shuffle([correct, ...createDistractors(correct, random)], random)
    .slice(0, 4)
    .map((value, index) => ({ optionId: optionIds[index], label: renderAnswer(value), value, isCorrect: value === correct }));
}

function statementFrom(base: BaseQuestion, answer: AnswerValue) {
  const rendered = renderAnswer(answer);
  const { left, right, number } = base.variables;

  if (typeof number === "number" && base.sourceTemplateId.includes("before-number")) {
    return `${rendered} comes before ${number}`;
  }

  if (typeof left === "number" && typeof right === "number" && base.sourceTemplateId.includes("bigger")) {
    return `The greatest value among ${left} and ${right} is ${rendered}`;
  }

  if (base.prompt.includes("__")) {
    return base.prompt.replace("__", rendered);
  }

  if (base.prompt.includes("?")) {
    return base.prompt.replace("?", rendered).replace(/\?$/u, "");
  }

  return `${base.prompt} ${rendered}`;
}

function sequenceQuestion(sourceTemplateId: string, start: number, step: number): BaseQuestion {
  const values = [start, start + step, start + step * 2, start + step * 3];
  return { sourceTemplateId, prompt: `${values.join(", ")}, ?`, answer: start + step * 4, variables: { start, step } };
}

function compareQuestion(sourceTemplateId: string, left: number, right: number, random: RandomSource): BaseQuestion {
  if (random.nextBoolean()) {
    return { sourceTemplateId: `${sourceTemplateId}-bigger`, prompt: `Bigger number: ${left} or ${right} = ?`, answer: Math.max(left, right), variables: { left, right } };
  }
  return { sourceTemplateId: `${sourceTemplateId}-symbol`, prompt: `${left} __ ${right}`, answer: left === right ? "=" : left < right ? "<" : ">", variables: { left, right } };
}

function lineMoveQuestion(sourceTemplateId: string, start: number, move: number): BaseQuestion {
  return { sourceTemplateId, prompt: `Start at ${start}. Move ${move >= 0 ? "+" : ""}${move}. Land on ?`, answer: start + move, variables: { start, move } };
}

function countingStep(random: RandomSource): BaseQuestion {
  const step = pick(random, [1, 2]);
  const direction = random.nextBoolean() ? 1 : -1;
  const start = direction === 1 ? random.nextInt(0, 12) : random.nextInt(step * 3, 20);
  return sequenceQuestion(direction === 1 ? "counting-step-forward" : "counting-step-backward", start, direction * step);
}

function wholeNumberLine(random: RandomSource): BaseQuestion {
  if (random.nextBoolean()) {
    const start = random.nextInt(0, 20);
    const move = random.nextBoolean() ? random.nextInt(1, 8) : -random.nextInt(1, Math.min(8, start));
    return lineMoveQuestion("whole-number-line-move", start, move);
  }

  const left = random.nextInt(0, 16);
  const gap = pick(random, [2, 4, 6, 8]);
  return { sourceTemplateId: "whole-number-line-between", prompt: `Number halfway between ${left} and ${left + gap} = ?`, answer: left + gap / 2, variables: { left, right: left + gap } };
}

function wholeNumberCompare(random: RandomSource) {
  const left = random.nextInt(0, 50);
  const right = random.nextBoolean() ? random.nextInt(0, 50) : left;
  return compareQuestion("whole-number-compare", left, right, random);
}

function wholeNumberPatterns(random: RandomSource) {
  return sequenceQuestion("whole-number-pattern-add-step", random.nextInt(0, 10), random.nextInt(1, 6));
}

function quickAdd(random: RandomSource): BaseQuestion {
  const left = random.nextInt(1, 12);
  const right = random.nextInt(1, 12);
  return { sourceTemplateId: "quick-add-total", prompt: `${left} + ${right} = ?`, answer: left + right, variables: { left, right } };
}

function makeTen(random: RandomSource): BaseQuestion {
  const known = random.nextInt(1, 9);
  const missingLeft = random.nextBoolean();
  return { sourceTemplateId: missingLeft ? "make-ten-missing-addend-left" : "make-ten-missing-addend-right", prompt: missingLeft ? `? + ${known} = 10` : `${known} + ? = 10`, answer: 10 - known, variables: { known, total: 10 } };
}

function quickSubtract(random: RandomSource): BaseQuestion {
  const answer = random.nextInt(0, 15);
  const removed = random.nextInt(1, 10);
  const total = answer + removed;
  if (random.nextBoolean()) return { sourceTemplateId: "quick-subtract-leftover", prompt: `${total} - ${removed} = ?`, answer, variables: { total, removed } };
  return { sourceTemplateId: "quick-subtract-missing", prompt: `${total} - ? = ${answer}`, answer: removed, variables: { total, answer } };
}

function addSubtractMixed(random: RandomSource) {
  return random.nextBoolean() ? quickAdd(random) : quickSubtract(random);
}

function multiplicationGroups(random: RandomSource): BaseQuestion {
  const groups = random.nextInt(2, 10);
  const size = random.nextInt(2, 10);
  if (random.nextBoolean()) return { sourceTemplateId: "multiplication-groups-expression", prompt: `${groups} × ${size} = ?`, answer: groups * size, variables: { groups, size } };
  return { sourceTemplateId: "multiplication-groups-language", prompt: `${groups} groups of ${size} = ?`, answer: groups * size, variables: { groups, size } };
}

function divisionFinder(random: RandomSource): BaseQuestion {
  const groups = random.nextInt(2, 10);
  const size = random.nextInt(2, 10);
  const total = groups * size;
  if (random.nextBoolean()) return { sourceTemplateId: "division-finder-quotient", prompt: `${total} ÷ ${size} = ?`, answer: groups, variables: { total, size } };
  return { sourceTemplateId: "division-finder-missing-groups", prompt: `? groups of ${size} make ${total}`, answer: groups, variables: { total, size } };
}

function operationPatterns(random: RandomSource): BaseQuestion {
  if (random.nextBoolean()) return sequenceQuestion("operation-pattern-multiple-step", pick(random, [2, 3, 4, 5, 6, 7, 8, 9]), pick(random, [2, 3, 4, 5, 6, 7, 8, 9]));
  const multiplier = random.nextInt(2, 9);
  const input = random.nextInt(2, 9);
  return { sourceTemplateId: "operation-pattern-output", prompt: `Rule: ×${multiplier}. Input ${input}. Output ?`, answer: multiplier * input, variables: { multiplier, input } };
}

function missingNumberBasics(random: RandomSource): BaseQuestion {
  if (random.nextBoolean()) {
    const missing = random.nextInt(1, 12);
    const addend = random.nextInt(1, 10);
    return { sourceTemplateId: "missing-number-basic-add", prompt: `${addend} + ? = ${missing + addend}`, answer: missing, variables: { missing, addend } };
  }
  const missing = random.nextInt(2, 10);
  const factor = random.nextInt(2, 10);
  return { sourceTemplateId: "missing-number-basic-factor", prompt: `${factor} × ? = ${factor * missing}`, answer: missing, variables: { missing, factor } };
}

function orderSense(random: RandomSource): BaseQuestion {
  const addend = random.nextInt(1, 5);
  const factorLeft = random.nextInt(2, 5);
  const factorRight = random.nextInt(2, 5);
  if (random.nextBoolean()) return { sourceTemplateId: "order-sense-multiply-before-add", prompt: `${addend} + ${factorLeft} × ${factorRight} = ?`, answer: addend + factorLeft * factorRight, variables: { addend, factorLeft, factorRight } };
  return { sourceTemplateId: "order-sense-brackets-first", prompt: `(${addend} + ${factorLeft}) × ${factorRight} = ?`, answer: (addend + factorLeft) * factorRight, variables: { addend, factorLeft, factorRight } };
}

function negativeNumberLine(random: RandomSource) {
  return lineMoveQuestion("negative-number-line-move", random.nextInt(-10, 10), random.nextBoolean() ? random.nextInt(1, 8) : -random.nextInt(1, 8));
}

function compareNegativeNumbers(random: RandomSource) {
  const left = random.nextInt(-12, 5);
  const right = random.nextBoolean() ? random.nextInt(-12, 5) : left;
  return compareQuestion("compare-negative", left, right, random);
}

function negativeSteps(random: RandomSource): BaseQuestion {
  const step = random.nextInt(1, 4);
  const direction = random.nextBoolean() ? 1 : -1;
  const start = direction === 1 ? random.nextInt(-12, -1) : random.nextInt(0, 12);
  return sequenceQuestion(direction === 1 ? "negative-steps-forward" : "negative-steps-backward", start, direction * step);
}

function missingNumberMixed(random: RandomSource): BaseQuestion {
  const variant = random.nextInt(1, 4);
  if (variant === 1) {
    const missing = random.nextInt(1, 18);
    const removed = random.nextInt(1, 10);
    return { sourceTemplateId: "missing-number-mixed-subtract-left", prompt: `? - ${removed} = ${missing - removed}`, answer: missing, variables: { missing, removed } };
  }
  if (variant === 2) {
    const missing = random.nextInt(-8, 8);
    const addend = random.nextInt(1, 8);
    return { sourceTemplateId: "missing-number-mixed-negative-add", prompt: `? + ${addend} = ${missing + addend}`, answer: missing, variables: { missing, addend } };
  }
  if (variant === 3) {
    const missing = random.nextInt(2, 10);
    const factor = random.nextInt(2, 10);
    return { sourceTemplateId: "missing-number-mixed-factor-left", prompt: `? × ${factor} = ${missing * factor}`, answer: missing, variables: { missing, factor } };
  }
  const missing = random.nextInt(2, 10);
  const divisor = random.nextInt(2, 10);
  return { sourceTemplateId: "missing-number-mixed-division-left", prompt: `? ÷ ${divisor} = ${missing}`, answer: missing * divisor, variables: { missing, divisor } };
}

function arithmeticRoadblock(random: RandomSource): BaseQuestion {
  return pick(random, [quickAdd, quickSubtract, multiplicationGroups, divisionFinder, missingNumberBasics, orderSense, negativeNumberLine, compareNegativeNumbers, negativeSteps, missingNumberMixed])(random);
}

const generators: Record<QuestionGeneratorKey, GeneratorFn> = {
  countingStep,
  wholeNumberLine,
  wholeNumberCompare,
  wholeNumberPatterns,
  quickAdd,
  makeTen,
  quickSubtract,
  addSubtractMixed,
  multiplicationGroups,
  divisionFinder,
  operationPatterns,
  missingNumberBasics,
  orderSense,
  negativeNumberLine,
  compareNegativeNumbers,
  negativeSteps,
  missingNumberMixed,
  arithmeticRoadblock
};

export function generateQuestion(level: Level, options: GenerateQuestionOptions = {}): GeneratedQuestion {
  const random = createRandom(`${level.levelId}:${options.format ?? "any"}:${options.seed ?? Date.now()}`);
  const format: QuestionFormat = options.format ?? pick(random, level.supportedQuestionFormats);

  if (!level.supportedQuestionFormats.includes(format)) throw new Error(`Question format '${format}' is not supported by level '${level.levelId}'.`);

  const createBaseQuestion = generators[level.generatorKey];
  if (!createBaseQuestion) throw new Error(`No question generator registered for '${level.generatorKey}'.`);

  const base = createBaseQuestion(random);
  const questionTemplateId = `${level.levelId}.${format}.${base.sourceTemplateId}`;
  const payload = { generatorKey: level.generatorKey, sourceTemplateId: base.sourceTemplateId, variables: base.variables, correctAnswer: base.answer };

  if (format === "multipleChoice") {
    const options = createOptions(base.answer, random);
    const correctOption = options.find((option) => option.isCorrect);
    if (!correctOption) throw new Error(`Multiple choice generation failed for '${questionTemplateId}'.`);
    return { questionTemplateId, prompt: base.prompt, expectedAnswer: correctOption.optionId, format, roadId: level.roadId, worldId: level.worldId, levelId: level.levelId, instinctId: level.coreInstinct.instinctId, payload, options };
  }

  if (format === "trueFalse") {
    const isStatementTrue = random.nextBoolean();
    const assertedAnswer = isStatementTrue ? base.answer : createDistractors(base.answer, random)[0];
    return { questionTemplateId, prompt: `True or false: ${statementFrom(base, assertedAnswer)}`, expectedAnswer: isStatementTrue, format, roadId: level.roadId, worldId: level.worldId, levelId: level.levelId, instinctId: level.coreInstinct.instinctId, payload: { ...payload, assertedAnswer, isStatementTrue } };
  }

  return { questionTemplateId, prompt: base.prompt, expectedAnswer: base.answer, format, roadId: level.roadId, worldId: level.worldId, levelId: level.levelId, instinctId: level.coreInstinct.instinctId, payload };
}
