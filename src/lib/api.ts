import type { Config } from "../config";
import type { OptInOptOutDTO, Adoption, ApiResponse } from "../types";
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
  dept?: string;
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

  const params = new URLSearchParams();
  if (filters.dept) params.set("dept", filters.dept);
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

  // Strip termCode from the body — the cart API takes term from the URL path
  const { termCode: _, ...body } = adoption;

  logger.debug`POST ${url}`;
  logger.debug`Request body: ${JSON.stringify(body)}`;

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
    return postAdoption(config, term, adoption, false);
  }

  const responseText = await response.text();
  const responseHeaders = Object.fromEntries(response.headers.entries());

  logger.debug`Response status: ${response.status}`;
  logger.debug`Response headers: ${JSON.stringify(responseHeaders)}`;
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

export interface DeleteAdoptionFilter {
  dept: string;
  course?: string;
  section?: string;
  crn?: string;
  ISBN?: string;
}

export async function deleteAdoption(
  config: Config,
  term: string,
  filters: DeleteAdoptionFilter,
  retryOnAuth = true
): Promise<ApiResponse> {
  const logger = getAppLogger();
  const token = getCachedToken();

  if (!token) {
    throw new Error("No auth token available. Call getToken first.");
  }

  const params = new URLSearchParams();
  params.set("dept", filters.dept);
  if (filters.course) params.set("course", filters.course);
  if (filters.section) params.set("section", filters.section);
  if (filters.crn) params.set("crn", filters.crn);
  if (filters.ISBN) params.set("ISBN", filters.ISBN);

  const url = `${config.apiBaseUrl}/cart/v1/admin/adoption/${encodeURIComponent(term)}?${params}`;

  logger.debug`DELETE ${url}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      authorization: token,
      "api-key": config.apiKey,
    },
  });

  if (response.status === 401 && retryOnAuth) {
    logger.info`Token expired, refreshing...`;
    await refreshToken(config);
    return deleteAdoption(config, term, filters, false);
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
