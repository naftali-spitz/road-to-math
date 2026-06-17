import type { AnswerValue } from "../content/types.js";
import type { GeneratedQuestion, AnswerCheckResult } from "./types.js";

function normalize(value: AnswerValue | string | null | undefined): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
  }

  return String(value ?? "").trim().toLowerCase();
}

function normalizeBooleanAnswer(value: AnswerValue | string | null | undefined): string {
  const normalized = normalize(value);

  if (["t", "true", "yes", "y"].includes(normalized)) {
    return "true";
  }

  if (["f", "false", "no", "n"].includes(normalized)) {
    return "false";
  }

  return normalized;
}

function normalizeNumericAnswer(value: AnswerValue | string | null | undefined): string {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());

  if (!Number.isFinite(parsed)) {
    return normalize(value);
  }

  return Number.isInteger(parsed) ? String(parsed) : String(Number(parsed.toFixed(4)));
}

export function checkAnswer(
  question: GeneratedQuestion,
  submittedAnswer: AnswerValue | string | null | undefined
): AnswerCheckResult {
  const normalizedAnswer =
    question.format === "trueFalse"
      ? normalizeBooleanAnswer(submittedAnswer)
      : typeof question.expectedAnswer === "number"
        ? normalizeNumericAnswer(submittedAnswer)
        : normalize(submittedAnswer);
  const expectedAnswer =
    question.format === "trueFalse"
      ? normalizeBooleanAnswer(question.expectedAnswer)
      : typeof question.expectedAnswer === "number"
        ? normalizeNumericAnswer(question.expectedAnswer)
        : normalize(question.expectedAnswer);

  return {
    isCorrect: normalizedAnswer === expectedAnswer,
    normalizedAnswer,
    expectedAnswer
  };
}
