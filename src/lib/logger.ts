import { configure, getLogger } from "@logtape/logtape";
import { getFileSink } from "@logtape/file";
import { existsSync, mkdirSync } from "fs";

const LOGS_DIR = "logs";

export async function setupLogger(): Promise<void> {
  if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFileName = `${LOGS_DIR}/opt-out-${timestamp}.log`;

  await configure({
    sinks: {
      file: getFileSink(logFileName),
      console: (record) => {
        const level = record.level.toUpperCase();
        const msg =
          typeof record.message === "string"
            ? record.message
            : record.message.map((m) => String(m)).join(" ");
        console.log(`[${level}] ${msg}`);
      },
    },
    loggers: [
      {
        category: ["opt-out"],
        lowestLevel: "debug",
        sinks: ["file", "console"],
      },
    ],
  });

  console.log(`Logging to: ${logFileName}`);
}

export function getAppLogger() {
  return getLogger(["opt-out"]);
}
