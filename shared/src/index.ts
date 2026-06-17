export type DatabaseStatus = {
  status: "connected" | "error";
  file: string;
  journalMode: string;
};

export type HealthResponse = {
  status: "ok" | "degraded";
  service: string;
  message: string;
  timestamp: string;
  environment: string;
  uptimeSeconds: number;
  database: DatabaseStatus;
};

export { firstBuildMasteryPolicy, starterXPPolicy } from "./content/default-policies.js";
export { roadToArithmetic, roads } from "./content/road-to-arithmetic.js";
export { supportedQuestionFormats } from "./content/types.js";
export { validateRoads } from "./content/validation.js";
export {
  advancePracticeFormatState,
  choosePracticeQuestionFormat,
  getCurrentPracticeFormat,
  initialPracticeFormatState
} from "./practice/format-flow.js";
export { checkAnswer } from "./questions/answer-checking.js";
export { generateQuestion } from "./questions/generation.js";
export type {
  AnswerValue,
  Instinct,
  Level,
  MasteryPolicy,
  QuestionFormat,
  QuestionGeneratorKey,
  QuestionTemplate,
  Road,
  World,
  XPPolicy
} from "./content/types.js";
export type {
  ContentValidationIssue
} from "./content/validation.js";
export type {
  PracticeFormatState
} from "./practice/format-flow.js";
export type {
  AnswerCheckResult,
  GeneratedQuestion,
  GeneratedQuestionPayload,
  GenerateQuestionOptions,
  MultipleChoiceOption
} from "./questions/types.js";
