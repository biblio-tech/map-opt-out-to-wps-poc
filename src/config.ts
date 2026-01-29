export interface Config {
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
}

export function loadConfig(): Config {
  const apiBaseUrl = process.env.WATCHMAN_API_BASE_URL;
  const apiKey = process.env.WATCHMAN_API_KEY;
  const apiSecret = process.env.WATCHMAN_API_SECRET;

  if (!apiBaseUrl) {
    throw new Error("WATCHMAN_API_BASE_URL environment variable is required");
  }
  if (!apiKey) {
    throw new Error("WATCHMAN_API_KEY environment variable is required");
  }
  if (!apiSecret) {
    throw new Error("WATCHMAN_API_SECRET environment variable is required");
  }

  return {
    apiBaseUrl,
    apiKey,
    apiSecret,
  };
}
