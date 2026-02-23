import type { Config } from "../config";
import { getAppLogger } from "./logger";

let cachedToken: string | null = null;

export async function getToken(config: Config): Promise<string> {
  const logger = getAppLogger();
  const url = `${config.apiBaseUrl}/cart/v1/admin/${config.apiKey}/token?secret=${encodeURIComponent(config.apiSecret)}`;

  logger.info`Fetching auth token...`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error`Token fetch failed: ${response.status} - ${errorText}`;
    throw new Error(`Failed to get token: ${response.status} - ${errorText}`);
  }

  const token = await response.text();
  cachedToken = token;
  logger.info`Auth token obtained successfully`;

  return token;
}

export function getCachedToken(): string | null {
  return cachedToken;
}

export async function refreshToken(config: Config): Promise<string> {
  cachedToken = null;
  return getToken(config);
}
