export const supportedQuestionFormats = [
  "solve",
  "fillBlank",
  "trueFalse",
  "multipleChoice"
] as const;

export type QuestionFormat = (typeof supportedQuestionFormats)[number];

export type QuestionGeneratorKey =
  | "countingStep"
  | "numberCompare"
  | "makeTen"
  | "additionBuilder"
  | "subtractionSplitter"
  | "multiplicationGroups"
  | "divisionFinder"
  | "orderSense"
  | "unknownReady";

export type AnswerValue = string | number | boolean;

export type Instinct = {
  instinctId: string;
  description: string;
};

export type QuestionTemplate = {
  templateId: string;
  format: QuestionFormat;
  prompt: string;
  answer: AnswerValue;
  choices?: AnswerValue[];
};

export type MasteryPolicy = {
  minUnderstandingPercent: number;
  minRecognitionPercent: number;
  minFluencyPercent: number;
  minAttempts: number;
  minSessions: number;
  retention: {
    requiredForLevelUnlock: boolean;
    placeholderOnly: boolean;
  };
};

export type XPPolicy = {
  correctPracticeAnswer: number;
  correctRushAnswer: number;
  practiceSessionCompleted: number;
  rushCompleted: number;
  newPersonalBest: number;
  levelMastered: number;
  goldMasteryEarned: number;
  worldCompleted: number;
  dailyPlayStreakBase: number;
  dailyPlayStreakCap: number;
};

export type Level = {
  levelId: string;
  roadId: string;
  worldId: string;
  order: number;
  displayName: string;
  coreInstinct: Instinct;
  generatorKey: QuestionGeneratorKey;
  supportedQuestionFormats: QuestionFormat[];
  benchmarkAnswerSeconds: number;
  masteryPolicy: MasteryPolicy;
  sampleQuestionTemplates: QuestionTemplate[];
};

export type World = {
  worldId: string;
  roadId: string;
  order: number;
  displayName: string;
  levels: Level[];
};

export type Road = {
  roadId: string;
  displayName: string;
  worlds: World[];
  xpPolicy: XPPolicy;
};
