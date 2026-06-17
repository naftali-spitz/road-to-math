import type { QuestionFormat } from "../content/types.js";

export type PracticeFormatState = {
  formatIndex: number;
  introducedFormats: QuestionFormat[];
  consecutiveCorrect: number;
};

export const initialPracticeFormatState: PracticeFormatState = {
  formatIndex: 0,
  introducedFormats: [],
  consecutiveCorrect: 0
};

export function getCurrentPracticeFormat(activeFormats: QuestionFormat[], state: PracticeFormatState) {
  if (state.introducedFormats.length >= activeFormats.length) {
    return "mixed" as const;
  }

  return activeFormats[state.formatIndex] ?? activeFormats[0];
}

export function choosePracticeQuestionFormat(activeFormats: QuestionFormat[], state: PracticeFormatState, seed: number) {
  if (activeFormats.length === 0) {
    throw new Error("Practice requires at least one active question format.");
  }

  if (state.introducedFormats.length >= activeFormats.length) {
    return activeFormats[Math.abs(seed) % activeFormats.length];
  }

  return activeFormats[state.formatIndex] ?? activeFormats[0];
}

export function advancePracticeFormatState(
  activeFormats: QuestionFormat[],
  state: PracticeFormatState,
  isCorrect: boolean
): PracticeFormatState {
  if (activeFormats.length === 0) {
    throw new Error("Practice requires at least one active question format.");
  }

  if (state.introducedFormats.length >= activeFormats.length) {
    return state;
  }

  if (!isCorrect) {
    return {
      ...state,
      consecutiveCorrect: 0
    };
  }

  const consecutiveCorrect = state.consecutiveCorrect + 1;

  if (consecutiveCorrect < 3) {
    return {
      ...state,
      consecutiveCorrect
    };
  }

  const currentFormat = activeFormats[state.formatIndex] ?? activeFormats[0];
  const introducedFormats = state.introducedFormats.includes(currentFormat)
    ? state.introducedFormats
    : [...state.introducedFormats, currentFormat];
  const nextIndex =
    introducedFormats.length >= activeFormats.length
      ? state.formatIndex
      : Math.min(state.formatIndex + 1, activeFormats.length - 1);

  return {
    formatIndex: nextIndex,
    introducedFormats,
    consecutiveCorrect: 0
  };
}
