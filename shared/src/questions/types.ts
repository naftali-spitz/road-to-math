import type { AnswerValue, Level, QuestionFormat } from "../content/types.js";

export type MultipleChoiceOption = {
  optionId: "1" | "2" | "3" | "4";
  label: string;
  value: AnswerValue;
  isCorrect: boolean;
};

export type GeneratedQuestionPayload = {
  generatorKey: Level["generatorKey"];
  sourceTemplateId: string;
  variables: Record<string, AnswerValue>;
  correctAnswer: AnswerValue;
  assertedAnswer?: AnswerValue;
  isStatementTrue?: boolean;
};

export type GeneratedQuestion = {
  questionTemplateId: string;
  fingerprint: string;
  prompt: string;
  expectedAnswer: AnswerValue;
  format: QuestionFormat;
  roadId: string;
  worldId: string;
  levelId: string;
  instinctId: string;
  payload: GeneratedQuestionPayload;
  options?: MultipleChoiceOption[];
};

export type GenerateQuestionOptions = {
  format?: QuestionFormat;
  seed?: string | number;
  recentFingerprints?: string[];
  maxGenerationAttempts?: number;
};

export type AnswerCheckResult = {
  isCorrect: boolean;
  normalizedAnswer: string;
  expectedAnswer: string;
};


// Only presentation data crosses the wire before an answer is submitted.
export type IssuedQuestion = Pick<GeneratedQuestion,
  "questionTemplateId" | "prompt" | "format" | "roadId" | "worldId" | "levelId" | "instinctId"
> & {
  questionId: string;
  inputKind: "numeric" | "text";
  options?: { optionId: "1" | "2" | "3" | "4"; label: string }[];
};

export type AttemptResult = {
  attemptId: number;
  isCorrect: boolean;
  expectedAnswer: string;
  normalizedAnswer: string;
  answerTimeMs: number;
  xpAwarded: number;
};
