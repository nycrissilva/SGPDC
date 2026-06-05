// In production behind Nginx, keep this empty so calls go to the same public origin.
// For local/direct API access, set NEXT_PUBLIC_API_URL to the backend origin.
export const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

function buildApiUrl(path: string) {
  if (!apiBase) return path;
  if (apiBase.endsWith("/api") && path.startsWith("/api/")) {
    return `${apiBase}${path.slice(4)}`;
  }
  return `${apiBase}${path}`;
}

const AUTH_TOKEN_KEY = "sgpdc_token";

function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

const mojibakePattern = /[ÃÂ�]/;
const windows1252Bytes: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function decodeMojibakeOnce(value: string) {
  try {
    const bytes = Uint8Array.from(value, (char) => {
      const code = char.charCodeAt(0);
      return windows1252Bytes[code] ?? (code & 0xff);
    });
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
}

export function normalizeText(value: string) {
  let text = value;

  for (let attempt = 0; attempt < 3 && mojibakePattern.test(text); attempt += 1) {
    const decoded = decodeMojibakeOnce(text);
    if (decoded === text) break;
    text = decoded;
  }

  return text.replace(/\uFFFD/g, "");
}

function normalizeJson<T>(value: T): T {
  if (typeof value === "string") {
    return normalizeText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeJson(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeJson(item)])
    ) as T;
  }

  return value;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    ...options,
    headers,
  });

  const parseJson = response.json.bind(response);
  response.json = async () => {
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return {
        error: text || `Resposta invalida da API (${response.status})`,
      };
    }

    return normalizeJson(await parseJson());
  };

  return response;
}
