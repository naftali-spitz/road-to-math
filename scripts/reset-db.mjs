import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(repoRoot, "server", "data");
const deletableSuffixes = [".sqlite", ".sqlite-shm", ".sqlite-wal"];

if (!fs.existsSync(dataDir)) {
  console.log("No server/data directory found. Nothing to reset.");
  process.exit(0);
}

const deleted = [];

for (const entry of fs.readdirSync(dataDir)) {
  if (!deletableSuffixes.some((suffix) => entry.endsWith(suffix))) {
    continue;
  }

  const filePath = path.join(dataDir, entry);
  fs.rmSync(filePath, { force: true });
  deleted.push(path.relative(repoRoot, filePath));
}

if (deleted.length === 0) {
  console.log("No local SQLite dev DB files found.");
} else {
  console.log("Deleted local SQLite dev DB files:");
  for (const file of deleted) {
    console.log(`- ${file}`);
  }
}
