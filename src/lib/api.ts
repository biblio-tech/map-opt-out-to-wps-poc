import type { Config } from "../config";
import type { OptInOptOutDTO, ApiResponse } from "../types";
import { getCachedToken, refreshToken } from "./auth";
import { getAppLogger } from "./logger";

export async function getStatus(
  config: Config,
  retryOnAuth = true
): Promise<ApiResponse> {
  const logger = getAppLogger();
  const token = getCachedToken();

  if (!token) {
    throw new Error("No auth token available. Call getToken first.");
  }

  const url = `${config.apiBaseUrl}/cart/v1/admin/status`;

  logger.debug`GET ${url}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
      authorization: token,
      "api-key": config.apiKey,
    },
  });

  if (response.status === 401 && retryOnAuth) {
    logger.info`Token expired, refreshing...`;
    await refreshToken(config);
    return getStatus(config, false);
  }

  const responseText = await response.text();

  logger.debug`Response status: ${response.status}`;
  logger.debug`Response body: ${responseText}`;

  if (!response.ok) {
    return {
      status: response.status,
      error: responseText,
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = responseText;
  }

  return {
    status: response.status,
    data,
  };
}

export async function getTermList(
  config: Config,
  retryOnAuth = true
): Promise<ApiResponse> {
  const logger = getAppLogger();
  const token = getCachedToken();

  if (!token) {
    throw new Error("No auth token available. Call getToken first.");
  }

  const url = `${config.apiBaseUrl}/bursar_billing/v1/term/list`;

  logger.debug`GET ${url}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      authorization: token,
      "api-key": config.apiKey,
    },
  });

  if (response.status === 401 && retryOnAuth) {
    logger.info`Token expired, refreshing...`;
    await refreshToken(config);
    return getTermList(config, false);
  }

  const responseText = await response.text();

  logger.debug`Response status: ${response.status}`;
  logger.debug`Response body: ${responseText}`;

  if (!response.ok) {
    return {
      status: response.status,
      error: responseText,
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = responseText;
  }

  return {
    status: response.status,
    data,
  };
}

export async function getAdoptions(
  config: Config,
  term: string,
  retryOnAuth = true
): Promise<ApiResponse> {
  const logger = getAppLogger();
  const token = getCachedToken();

  if (!token) {
    throw new Error("No auth token available. Call getToken first.");
  }

  const params = new URLSearchParams({ termCode: term });
  const url = `${config.apiBaseUrl}/bursar_billing/v1/adoption/list?${params}`;

  logger.debug`GET ${url}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      authorization: token,
      "api-key": config.apiKey,
    },
  });

  if (response.status === 401 && retryOnAuth) {
    logger.info`Token expired, refreshing...`;
    await refreshToken(config);
    return getAdoptions(config, term, false);
  }

  const responseText = await response.text();

  logger.debug`Response status: ${response.status}`;
  logger.debug`Response body: ${responseText}`;

  if (!response.ok) {
    return {
      status: response.status,
      error: responseText,
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = responseText;
  }

  return {
    status: response.status,
    data,
  };
}

export async function postOptOut(
  config: Config,
  term: string,
  dto: OptInOptOutDTO,
  retryOnAuth = true
): Promise<ApiResponse> {
  const logger = getAppLogger();
  const token = getCachedToken();

  if (!token) {
    throw new Error("No auth token available. Call getToken first.");
  }

  const url = `${config.apiBaseUrl}/cart/v1/admin/opt_out/${encodeURIComponent(term)}`;

  logger.debug`POST ${url}`;
  logger.debug`Request body: ${JSON.stringify(dto)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: token,
      "api-key": config.apiKey,
    },
    body: JSON.stringify([dto]),
  });

  if (response.status === 401 && retryOnAuth) {
    logger.info`Token expired, refreshing...`;
    await refreshToken(config);
    return postOptOut(config, term, dto, false);
  }

  const responseText = await response.text();

  logger.debug`Response status: ${response.status}`;
  logger.debug`Response body: ${responseText}`;

  if (!response.ok) {
    return {
      status: response.status,
      error: responseText,
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = responseText;
  }

  return {
    status: response.status,
    data,
  };
}
