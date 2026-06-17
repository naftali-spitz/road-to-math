import { roads, validateRoads } from "../dist/index.js";

const issues = validateRoads(roads);

if (issues.length > 0) {
  console.error("Road to Math content validation failed:");

  for (const issue of issues) {
    console.error(`- ${issue.path}: ${issue.message}`);
  }

  process.exit(1);
}

const levelCount = roads.flatMap((road) => road.worlds.flatMap((world) => world.levels)).length;
console.log(`Road to Math content validation passed: ${roads.length} road(s), ${levelCount} level(s).`);
