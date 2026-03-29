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

  let payload: any = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "Request failed.";
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

  let payload: any = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || "Upload failed.";
    throw new Error(message);
  }

  return payload as T;
}
