const BASE = process.env.API_BASE_URL ?? "http://localhost:8080/api";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  ok: boolean;
}

export async function request<T = unknown>(
  method: Method,
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const url = `${BASE}${path}`;
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, init);
  let body: T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    body = await res.json();
  } else {
    body = (await res.text()) as unknown as T;
  }

  return { status: res.status, body, ok: res.ok };
}

export const api = {
  get: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, opts),
  post: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, { ...opts, body }),
  put: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, { ...opts, body }),
  delete: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, opts),
  withKey: (key: string) => ({
    get: <T = unknown>(path: string) =>
      request<T>("GET", path, { headers: { "X-API-Key": key } }),
    post: <T = unknown>(path: string, body?: unknown) =>
      request<T>("POST", path, { body, headers: { "X-API-Key": key } }),
    delete: <T = unknown>(path: string) =>
      request<T>("DELETE", path, { headers: { "X-API-Key": key } }),
  }),
};

export async function createTestKey(name = "test-key"): Promise<{ id: number; key: string }> {
  const res = await api.post<{ id: number; key: string }>("/keys", { name });
  if (res.status !== 201) throw new Error(`Failed to create test key: ${JSON.stringify(res.body)}`);
  return { id: res.body.id, key: res.body.key };
}
