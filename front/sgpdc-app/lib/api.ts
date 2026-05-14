// Use the public API URL when set, otherwise default to the local backend in development.
// This ensures the browser sends the backend auth cookie, since the frontend proxy path would be a different origin.
export const apiBase =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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
  const response = await fetch(`${apiBase}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const parseJson = response.json.bind(response);
  response.json = async () => normalizeJson(await parseJson());

  return response;
}
