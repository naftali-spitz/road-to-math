import type { MasteryPolicy, XPPolicy } from "./types.js";

export const firstBuildMasteryPolicy: MasteryPolicy = {
  minUnderstandingPercent: 80,
  minRecognitionPercent: 75,
  minFluencyPercent: 75,
  minAttempts: 20,
  minSessions: 1,
  retention: {
    requiredForLevelUnlock: false,
    placeholderOnly: true
  }
};

export const starterXPPolicy: XPPolicy = {
  correctPracticeAnswer: 1,
  correctRushAnswer: 2,
  practiceSessionCompleted: 10,
  rushCompleted: 10,
  newPersonalBest: 25,
  levelMastered: 100,
  goldMasteryEarned: 150,
  worldCompleted: 500,
  dailyPlayStreakBase: 10,
  dailyPlayStreakCap: 100
};
