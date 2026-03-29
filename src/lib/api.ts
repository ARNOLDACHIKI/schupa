const API_BASE = import.meta.env.VITE_API_URL || "/api";

const tokenKey = "schupa_token";

export const getStoredToken = () => localStorage.getItem(tokenKey);
export const setStoredToken = (token: string) => localStorage.setItem(tokenKey, token);
export const clearStoredToken = () => localStorage.removeItem(tokenKey);

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

const getProtectedPreviewMessage = (response: Response, rawBody: string) => {
  const isVercelProtectionRedirect = response.redirected && response.url.includes("vercel.com/sso-api");
  const isVercelProtectionHtml =
    rawBody.includes("vercel.com/sso-api") ||
    rawBody.includes("Authentication Required") ||
    rawBody.includes("Vercel Authentication");

  if (isVercelProtectionRedirect || isVercelProtectionHtml) {
    return "This preview deployment is access-protected on Vercel. Sign in to Vercel or use the public production URL.";
  }

  return null;
};

const parseJsonSafely = (rawBody: string) => {
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    return null;
  }
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.token ?? getStoredToken();

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const rawBody = await response.text();
  const payload = parseJsonSafely(rawBody);
  const protectedPreviewMessage = getProtectedPreviewMessage(response, rawBody);

  if (!response.ok) {
    const message = protectedPreviewMessage || payload?.message || "Request failed.";
    throw new Error(message);
  }

  if (!payload) {
    const message = protectedPreviewMessage || "Unexpected response format from server.";
    throw new Error(message);
  }

  return payload as T;
}

export async function apiUploadRequest<T>(path: string, formData: FormData, tokenOverride?: string | null): Promise<T> {
  const token = tokenOverride ?? getStoredToken();

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const rawBody = await response.text();
  const payload = parseJsonSafely(rawBody);
  const protectedPreviewMessage = getProtectedPreviewMessage(response, rawBody);

  if (!response.ok) {
    const message = protectedPreviewMessage || payload?.message || "Upload failed.";
    throw new Error(message);
  }

  if (!payload) {
    const message = protectedPreviewMessage || "Unexpected response format from server.";
    throw new Error(message);
  }

  return payload as T;
}
