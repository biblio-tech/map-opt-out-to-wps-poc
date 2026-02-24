import type { Config } from "../config";
import type { OptInOptOutDTO, Adoption, AdoptionWrapper, EnrollmentWrapper, ApiResponse } from "../types";
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

export interface AdoptionFilter {
  dept: string;
  course?: string;
  section?: string;
  itemScanCode?: string;
  crn?: string;
}

export async function getAdoptionFiltered(
  config: Config,
  term: string,
  filters: AdoptionFilter,
  retryOnAuth = true
): Promise<ApiResponse> {
  const logger = getAppLogger();
  const token = getCachedToken();

  if (!token) {
    throw new Error("No auth token available. Call getToken first.");
  }

  const params = new URLSearchParams({ dept: filters.dept });
  if (filters.course) params.set("course", filters.course);
  if (filters.section) params.set("section", filters.section);
  if (filters.itemScanCode) params.set("itemScanCode", filters.itemScanCode);
  if (filters.crn) params.set("crn", filters.crn);

  const url = `${config.apiBaseUrl}/cart/v1/admin/adoption/${encodeURIComponent(term)}?${params}`;

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
    return getAdoptionFiltered(config, term, filters, false);
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

export async function postAdoption(
  config: Config,
  term: string,
  adoption: Adoption,
  retryOnAuth = true
): Promise<ApiResponse> {
  const logger = getAppLogger();
  const token = getCachedToken();

  if (!token) {
    throw new Error("No auth token available. Call getToken first.");
  }

  const url = `${config.apiBaseUrl}/cart/v1/admin/adoption/${encodeURIComponent(term)}`;

  logger.debug`POST ${url}`;
  logger.debug`Request body: ${JSON.stringify(adoption)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: token,
      "api-key": config.apiKey,
    },
    body: JSON.stringify(adoption),
  });

  if (response.status === 401 && retryOnAuth) {
    logger.info`Token expired, refreshing...`;
    await refreshToken(config);
    return postAdoption(config, term, adoption, false);
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

export async function postAdoptionsBulk(
  config: Config,
  adoptions: Adoption[],
  retryOnAuth = true
): Promise<ApiResponse> {
  const logger = getAppLogger();
  const token = getCachedToken();

  if (!token) {
    throw new Error("No auth token available. Call getToken first.");
  }

  const url = `${config.apiBaseUrl}/bursar_billing/v1/adoption/json`;
  const body = { adoptions };

  logger.debug`POST ${url}`;
  logger.debug`Request body: ${adoptions.length} adoptions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: token,
      "api-key": config.apiKey,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401 && retryOnAuth) {
    logger.info`Token expired, refreshing...`;
    await refreshToken(config);
    return postAdoptionsBulk(config, adoptions, false);
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

export async function getEnrollment(
  config: Config,
  termCode: string,
  customer: string,
  retryOnAuth = true
): Promise<ApiResponse> {
  const logger = getAppLogger();
  const token = getCachedToken();

  if (!token) {
    throw new Error("No auth token available. Call getToken first.");
  }

  const url = `${config.apiBaseUrl}/bursar_billing/v1/enrollment/get/${encodeURIComponent(termCode)}/${encodeURIComponent(customer)}`;

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
    return getEnrollment(config, termCode, customer, false);
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
