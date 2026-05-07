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

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
