import AsyncStorage from "@react-native-async-storage/async-storage";
import { AxiosError, create, isAxiosError } from "axios";

import { API_BASE_URL } from "@/src/config";

export const TOKEN_STORAGE_KEY = "@sgpdc:token";

export const api = create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    const encoded = Array.from(value)
      .map((char) => {
        const code = char.charCodeAt(0);
        const byte = windows1252Bytes[code] ?? (code & 0xff);
        return `%${byte.toString(16).padStart(2, "0")}`;
      })
      .join("");
    return decodeURIComponent(encoded);
  } catch {
    return value;
  }
}

function normalizeText(value: string) {
  let text = value;

  for (let attempt = 0; attempt < 3 && mojibakePattern.test(text); attempt += 1) {
    const decoded = decodeMojibakeOnce(text);
    if (decoded === text) break;
    text = decoded;
  }

  return text.replace(/\uFFFD/g, "");
}

function normalizeData<T>(value: T): T {
  if (typeof value === "string") {
    return normalizeText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeData(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeData(item)])
    ) as T;
  }

  return value;
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  response.data = normalizeData(response.data);
  return response;
});

export function getApiErrorMessage(error: unknown) {
  if (!isAxiosError(error)) {
    return "Não foi possível concluir a operação.";
  }

  const axiosError = error as AxiosError<{ error?: string; message?: string }>;
  if (axiosError.response?.status === 401) {
    return "Sessão expirada ou token inválido. Entre novamente.";
  }
  if (axiosError.response?.status === 403) {
    return "Você não tem permissão para acessar este recurso.";
  }
  if (!axiosError.response) {
    return "API indisponível. Verifique a conexão e a URL configurada.";
  }
  return axiosError.response.data?.error || axiosError.response.data?.message || "Erro ao comunicar com a API.";
}
