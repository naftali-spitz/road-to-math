import { generateQuestion, roadToArithmetic } from "../dist/index.js";

const examplesPerFormat = Number(process.env.SAMPLE_QUESTIONS_PER_FORMAT || 4);

function answerFor(question) {
  if (question.format === "multipleChoice") {
    const correctOption = question.options.find((option) => option.isCorrect);
    return correctOption ? `${correctOption.optionId}) ${correctOption.label}` : String(question.expectedAnswer);
  }

  return String(question.expectedAnswer);
}

function printQuestion(question) {
  if (question.format === "multipleChoice") {
    console.log(`- ${question.prompt}`);

    for (const option of question.options) {
      console.log(`  ${option.optionId}) ${option.label}`);
    }

    console.log(`  answer: ${answerFor(question)}`);
    console.log(`  fingerprint: ${question.fingerprint}`);
    return;
  }

  console.log(`- ${question.prompt}   answer: ${answerFor(question)}`);
  console.log(`  fingerprint: ${question.fingerprint}`);
}

for (const world of roadToArithmetic.worlds) {
  console.log(`World ${world.order} - ${world.displayName}`);
  console.log("");

  for (const level of world.levels) {
    console.log(`Level ${level.order} - ${level.displayName}`);
    console.log("");

    for (const format of level.supportedQuestionFormats) {
      console.log(`${format}:`);

      for (let index = 0; index < examplesPerFormat; index += 1) {
        const question = generateQuestion(level, {
          format,
          seed: `sample:${level.levelId}:${format}:${index}`
        });

        printQuestion(question);
      }

      console.log("");
    }
  }
}
