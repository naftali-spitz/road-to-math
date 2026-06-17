import { supportedQuestionFormats } from "./types.js";
import type { MasteryPolicy, Road } from "./types.js";

export type ContentValidationIssue = {
  path: string;
  message: string;
};

function hasPercent(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function hasPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function validateMasteryPolicy(
  issues: ContentValidationIssue[],
  path: string,
  masteryPolicy: MasteryPolicy | undefined
) {
  if (!masteryPolicy) {
    issues.push({ path, message: "masteryPolicy is required." });
    return;
  }

  if (!hasPercent(masteryPolicy.minUnderstandingPercent)) {
    issues.push({ path, message: "minUnderstandingPercent must be present and between 0 and 100." });
  }

  if (!hasPercent(masteryPolicy.minRecognitionPercent)) {
    issues.push({ path, message: "minRecognitionPercent must be present and between 0 and 100." });
  }

  if (!hasPercent(masteryPolicy.minFluencyPercent)) {
    issues.push({ path, message: "minFluencyPercent must be present and between 0 and 100." });
  }

  if (!hasPositiveInteger(masteryPolicy.minAttempts)) {
    issues.push({ path, message: "minAttempts must be present and greater than 0." });
  }

  if (!hasPositiveInteger(masteryPolicy.minSessions)) {
    issues.push({ path, message: "minSessions must be present and greater than 0." });
  }

  if (!masteryPolicy.retention || masteryPolicy.retention.placeholderOnly !== true) {
    issues.push({ path, message: "retention placeholder must be present for the first build." });
  }
}

export function validateRoads(roads: Road[]) {
  const issues: ContentValidationIssue[] = [];
  const supportedFormatSet = new Set(supportedQuestionFormats);

  for (const road of roads) {
    const roadIds = new Set(roads.map((entry) => entry.roadId));
    const worldIds = new Set(road.worlds.map((world) => world.worldId));
    const levelIds = new Set<string>();

    if (!road.roadId) {
      issues.push({ path: "roads", message: "roadId is required." });
    }

    for (const world of road.worlds) {
      const worldPath = `${road.roadId}.${world.worldId}`;

      if (!roadIds.has(world.roadId)) {
        issues.push({ path: worldPath, message: `roadId '${world.roadId}' does not exist.` });
      }

      for (const level of world.levels) {
        const levelPath = `${worldPath}.${level.levelId || "unknown-level"}`;

        if (!level.levelId) {
          issues.push({ path: levelPath, message: "levelId is required." });
        } else if (levelIds.has(level.levelId)) {
          issues.push({ path: levelPath, message: `levelId '${level.levelId}' is duplicated.` });
        } else {
          levelIds.add(level.levelId);
        }

        if (!roadIds.has(level.roadId)) {
          issues.push({ path: levelPath, message: `roadId '${level.roadId}' does not exist.` });
        }

        if (!worldIds.has(level.worldId)) {
          issues.push({ path: levelPath, message: `worldId '${level.worldId}' does not exist.` });
        }

        if (!level.coreInstinct || Array.isArray(level.coreInstinct)) {
          issues.push({ path: levelPath, message: "level must have exactly one core instinct object." });
        } else {
          if (!level.coreInstinct.instinctId) {
            issues.push({ path: `${levelPath}.coreInstinct`, message: "instinctId is required." });
          }

          if (!level.coreInstinct.description) {
            issues.push({ path: `${levelPath}.coreInstinct`, message: "description is required." });
          }
        }

        if (!level.generatorKey) {
          issues.push({ path: levelPath, message: "generatorKey is required." });
        }

        if (!Array.isArray(level.supportedQuestionFormats) || level.supportedQuestionFormats.length === 0) {
          issues.push({ path: levelPath, message: "level must have at least one question format." });
        } else {
          for (const format of level.supportedQuestionFormats) {
            if (!supportedFormatSet.has(format)) {
              issues.push({ path: levelPath, message: `unsupported question format '${format}' on level.` });
            }
          }
        }

        validateMasteryPolicy(issues, `${levelPath}.masteryPolicy`, level.masteryPolicy);

        if (!Array.isArray(level.sampleQuestionTemplates) || level.sampleQuestionTemplates.length === 0) {
          issues.push({ path: levelPath, message: "level must include at least one sample question template." });
        } else {
          for (const template of level.sampleQuestionTemplates) {
            if (!supportedFormatSet.has(template.format)) {
              issues.push({
                path: `${levelPath}.sampleQuestionTemplates.${template.templateId || "unknown"}`,
                message: `unsupported question format '${template.format}' on question template.`
              });
            }
          }
        }
      }
    }
  }

  return issues;
}
