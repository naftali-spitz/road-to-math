import type { AnswerValue, Level, QuestionFormat, QuestionGeneratorKey } from "../content/types.js";
import type { GeneratedQuestion, GenerateQuestionOptions, MultipleChoiceOption } from "./types.js";

type ArithmeticBaseQuestion = {
  sourceTemplateId: string;
  prompt: string;
  answer: AnswerValue;
  variables: Record<string, AnswerValue>;
};

type RandomSource = {
  nextInt(min: number, max: number): number;
  nextBoolean(): boolean;
};

type GeneratorFn = (random: RandomSource) => ArithmeticBaseQuestion;

const optionIds: MultipleChoiceOption["optionId"][] = ["1", "2", "3", "4"];

function hashSeed(seed: string | number): number {
  const text = String(seed);
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: string | number = Date.now()): RandomSource {
  let state = hashSeed(seed) || 1;

  function next() {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  }

  return {
    nextInt(min: number, max: number) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    nextBoolean() {
      return next() >= 0.5;
    }
  };
}

function pick<T>(random: RandomSource, values: T[]): T {
  return values[random.nextInt(0, values.length - 1)];
}

function renderAnswer(value: AnswerValue): string {
  return typeof value === "boolean" ? (value ? "true" : "false") : String(value);
}

function createNumericDistractors(correctAnswer: number, random: RandomSource) {
  const distractors = new Set<number>();
  const offsets = [-10, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 10];

  while (distractors.size < 3) {
    const candidate = correctAnswer + pick(random, offsets);

    if (candidate >= 0 && candidate <= 100 && candidate !== correctAnswer) {
      distractors.add(candidate);
    }
  }

  return [...distractors];
}

function createStringDistractors(correctAnswer: string) {
  if (["<", ">", "="].includes(correctAnswer)) {
    return ["<", ">", "=", "!="].filter((value) => value !== correctAnswer);
  }

  return ["yes", "no", "maybe"].filter((value) => value !== correctAnswer).slice(0, 3);
}

function createDistractors(correctAnswer: AnswerValue, random: RandomSource): AnswerValue[] {
  if (typeof correctAnswer === "number") {
    return createNumericDistractors(correctAnswer, random);
  }

  if (typeof correctAnswer === "boolean") {
    return [!correctAnswer, "true", "false"].filter((value) => value !== correctAnswer).slice(0, 3);
  }

  const stringDistractors = createStringDistractors(correctAnswer);

  while (stringDistractors.length < 3) {
    stringDistractors.push(`${correctAnswer}${stringDistractors.length + 1}`);
  }

  return stringDistractors.slice(0, 3);
}

function shuffle<T>(values: T[], random: RandomSource) {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = random.nextInt(0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function createOptions(correctAnswer: AnswerValue, random: RandomSource): MultipleChoiceOption[] {
  const values = shuffle([correctAnswer, ...createDistractors(correctAnswer, random)], random).slice(0, 4);

  return values.map((value, index) => ({
    optionId: optionIds[index],
    label: renderAnswer(value),
    value,
    isCorrect: value === correctAnswer
  }));
}

function createWrongAnswer(correctAnswer: AnswerValue, random: RandomSource): AnswerValue {
  return createDistractors(correctAnswer, random)[0];
}

function statementFrom(base: ArithmeticBaseQuestion, answer: AnswerValue) {
  if (base.prompt.includes("?")) {
    return base.prompt.replace("?", renderAnswer(answer));
  }

  return `${base.prompt} ${renderAnswer(answer)}`;
}

function countingStep(random: RandomSource): ArithmeticBaseQuestion {
  if (random.nextBoolean()) {
    const start = random.nextInt(1, 16);
    return {
      sourceTemplateId: "counting-step-next-number",
      prompt: `${start}, ${start + 1}, ${start + 2}, ?`,
      answer: start + 3,
      variables: { start }
    };
  }

  const number = random.nextInt(2, 20);
  return {
    sourceTemplateId: "counting-step-before-number",
    prompt: `What comes before ${number}?`,
    answer: number - 1,
    variables: { number }
  };
}

function numberCompare(random: RandomSource): ArithmeticBaseQuestion {
  const left = random.nextInt(1, 20);
  const right = random.nextBoolean() ? random.nextInt(1, 20) : left;

  if (random.nextBoolean()) {
    return {
      sourceTemplateId: "number-compare-bigger",
      prompt: `Which is bigger: ${left} or ${right}?`,
      answer: Math.max(left, right),
      variables: { left, right }
    };
  }

  return {
    sourceTemplateId: "number-compare-symbol",
    prompt: `${left} __ ${right}`,
    answer: left === right ? "=" : left < right ? "<" : ">",
    variables: { left, right }
  };
}

function makeTen(random: RandomSource): ArithmeticBaseQuestion {
  const known = random.nextInt(1, 9);
  const missing = 10 - known;
  const missingLeft = random.nextBoolean();

  return {
    sourceTemplateId: missingLeft ? "make-ten-missing-addend-left" : "make-ten-missing-addend-right",
    prompt: missingLeft ? `? + ${known} = 10` : `${known} + ? = 10`,
    answer: missing,
    variables: { known, total: 10 }
  };
}

function additionBuilder(random: RandomSource): ArithmeticBaseQuestion {
  const left = random.nextInt(1, 10);
  const right = random.nextInt(1, 10);

  return {
    sourceTemplateId: "addition-builder-total",
    prompt: `${left} + ${right} = ?`,
    answer: left + right,
    variables: { left, right }
  };
}

function subtractionSplitter(random: RandomSource): ArithmeticBaseQuestion {
  const answer = random.nextInt(1, 12);
  const removed = random.nextInt(1, 8);
  const total = answer + removed;

  if (random.nextBoolean()) {
    return {
      sourceTemplateId: "subtraction-splitter-leftover",
      prompt: `${total} - ${removed} = ?`,
      answer,
      variables: { total, removed }
    };
  }

  return {
    sourceTemplateId: "subtraction-splitter-missing",
    prompt: `${total} - ? = ${answer}`,
    answer: removed,
    variables: { total, answer }
  };
}

function multiplicationGroups(random: RandomSource): ArithmeticBaseQuestion {
  const groups = random.nextInt(2, 6);
  const size = random.nextInt(2, 6);

  if (random.nextBoolean()) {
    return {
      sourceTemplateId: "multiplication-groups-expression",
      prompt: `${groups} × ${size} = ?`,
      answer: groups * size,
      variables: { groups, size }
    };
  }

  return {
    sourceTemplateId: "multiplication-groups-language",
    prompt: `${groups} groups of ${size} = ?`,
    answer: groups * size,
    variables: { groups, size }
  };
}

function divisionFinder(random: RandomSource): ArithmeticBaseQuestion {
  const groups = random.nextInt(2, 10);
  const size = random.nextInt(2, 10);
  const total = groups * size;

  if (random.nextBoolean()) {
    return {
      sourceTemplateId: "division-finder-quotient",
      prompt: `${total} ÷ ${size} = ?`,
      answer: groups,
      variables: { total, size }
    };
  }

  return {
    sourceTemplateId: "division-finder-missing-groups",
    prompt: `? groups of ${size} make ${total}`,
    answer: groups,
    variables: { total, size }
  };
}

function orderSense(random: RandomSource): ArithmeticBaseQuestion {
  const addend = random.nextInt(1, 5);
  const factorLeft = random.nextInt(2, 5);
  const factorRight = random.nextInt(2, 5);

  if (random.nextBoolean()) {
    return {
      sourceTemplateId: "order-sense-multiply-before-add",
      prompt: `${addend} + ${factorLeft} × ${factorRight} = ?`,
      answer: addend + factorLeft * factorRight,
      variables: { addend, factorLeft, factorRight }
    };
  }

  return {
    sourceTemplateId: "order-sense-brackets-first",
    prompt: `(${addend} + ${factorLeft}) × ${factorRight} = ?`,
    answer: (addend + factorLeft) * factorRight,
    variables: { addend, factorLeft, factorRight }
  };
}

function unknownReady(random: RandomSource): ArithmeticBaseQuestion {
  if (random.nextBoolean()) {
    const missing = random.nextInt(1, 12);
    const addend = random.nextInt(1, 8);
    return {
      sourceTemplateId: "unknown-ready-x-plus",
      prompt: `x + ${addend} = ${missing + addend}`,
      answer: missing,
      variables: { missing, addend }
    };
  }

  const missing = random.nextInt(2, 9);
  const factor = random.nextInt(2, 6);
  return {
    sourceTemplateId: "unknown-ready-missing-factor",
    prompt: `${factor} × ? = ${factor * missing}`,
    answer: missing,
    variables: { missing, factor }
  };
}

const generators: Record<QuestionGeneratorKey, GeneratorFn> = {
  countingStep,
  numberCompare,
  makeTen,
  additionBuilder,
  subtractionSplitter,
  multiplicationGroups,
  divisionFinder,
  orderSense,
  unknownReady
};

export function generateQuestion(level: Level, options: GenerateQuestionOptions = {}): GeneratedQuestion {
  const random = createRandom(`${level.levelId}:${options.format ?? "any"}:${options.seed ?? Date.now()}`);
  const format = options.format ?? pick(random, level.supportedQuestionFormats);

  if (!level.supportedQuestionFormats.includes(format)) {
    throw new Error(`Question format '${format}' is not supported by level '${level.levelId}'.`);
  }

  const createBaseQuestion = generators[level.generatorKey];

  if (!createBaseQuestion) {
    throw new Error(`No question generator registered for '${level.generatorKey}'.`);
  }

  const base = createBaseQuestion(random);
  const questionTemplateId = `${level.levelId}.${format}.${base.sourceTemplateId}`;
  const payload = {
    generatorKey: level.generatorKey,
    sourceTemplateId: base.sourceTemplateId,
    variables: base.variables,
    correctAnswer: base.answer
  };

  if (format === "multipleChoice") {
    const options = createOptions(base.answer, random);
    const correctOption = options.find((option) => option.isCorrect);

    if (!correctOption) {
      throw new Error(`Multiple choice generation failed for '${questionTemplateId}'.`);
    }

    return {
      questionTemplateId,
      prompt: base.prompt,
      expectedAnswer: correctOption.optionId,
      format,
      roadId: level.roadId,
      worldId: level.worldId,
      levelId: level.levelId,
      instinctId: level.coreInstinct.instinctId,
      payload,
      options
    };
  }

  if (format === "trueFalse") {
    const isStatementTrue = random.nextBoolean();
    const assertedAnswer = isStatementTrue ? base.answer : createWrongAnswer(base.answer, random);

    return {
      questionTemplateId,
      prompt: `True or false: ${statementFrom(base, assertedAnswer)}`,
      expectedAnswer: isStatementTrue,
      format,
      roadId: level.roadId,
      worldId: level.worldId,
      levelId: level.levelId,
      instinctId: level.coreInstinct.instinctId,
      payload: {
        ...payload,
        assertedAnswer,
        isStatementTrue
      }
    };
  }

  return {
    questionTemplateId,
    prompt: base.prompt,
    expectedAnswer: base.answer,
    format,
    roadId: level.roadId,
    worldId: level.worldId,
    levelId: level.levelId,
    instinctId: level.coreInstinct.instinctId,
    payload
  };
}
