export interface Config {
  apiBaseUrl: string;
  billingApiBaseUrl: string;
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

  // Derive billing API URL from cart API URL by replacing /cart with /bursar_billing
  const billingApiBaseUrl =
    process.env.WATCHMAN_BILLING_API_BASE_URL ||
    apiBaseUrl.replace("/cart", "/bursar_billing");

  return {
    apiBaseUrl,
    billingApiBaseUrl,
    apiKey,
    apiSecret,
  };
}
