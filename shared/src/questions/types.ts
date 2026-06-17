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
};

export type AnswerCheckResult = {
  isCorrect: boolean;
  normalizedAnswer: string;
  expectedAnswer: string;
};
