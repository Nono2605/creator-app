const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface ApiOptions {
  accessToken?: string;
  cache?: RequestCache;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: ApiOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.accessToken) headers["Authorization"] = `Bearer ${opts.accessToken}`;

  const res = await fetch(API_BASE_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: opts.cache ?? "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, opts?: ApiOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: ApiOptions) => request<T>("POST", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: ApiOptions) => request<T>("PATCH", path, body, opts),
  delete: <T>(path: string, opts?: ApiOptions) => request<T>("DELETE", path, undefined, opts),
};
