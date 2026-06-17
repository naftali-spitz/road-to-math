import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveFromServerRoot(value: string) {
  return path.isAbsolute(value) ? value : path.resolve(serverRoot, value);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4100),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  databasePath: resolveFromServerRoot(process.env.DATABASE_PATH || "./data/road-to-math.sqlite")
};
