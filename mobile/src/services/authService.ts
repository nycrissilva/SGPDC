import AsyncStorage from "@react-native-async-storage/async-storage";

import { PROFESSOR_PROFILE } from "@/src/config";
import { AuthUser, LoginResponse, ProfessorMe } from "@/src/types/auth";

import { api, TOKEN_STORAGE_KEY } from "./api";

export const USER_STORAGE_KEY = "@sgpdc:user";

function extractToken(data: LoginResponse) {
  return data.token || data.accessToken || data.jwt;
}

async function persistSession(token: string, user: AuthUser) {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export async function login(email: string, senha: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, senha });
  const token = extractToken(data);

  if (data.user?.perfil !== PROFESSOR_PROFILE) {
    throw new Error("Acesso permitido apenas para usuários com perfil PROFESSOR.");
  }

  if (!token) {
    throw new Error(
      "Login validado, mas a API não retornou o token JWT. Ajuste o backend para incluir { token } na resposta de /auth/login.",
    );
  }

  await persistSession(token, data.user);
  return { token, user: data.user };
}

export async function loadStoredSession() {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
  if (!token || !userJson) return null;

  const user = JSON.parse(userJson) as AuthUser;
  if (user.perfil !== PROFESSOR_PROFILE) {
    await clearSession();
    return null;
  }

  return { token, user };
}

export async function refreshMe() {
  const { data } = await api.get<{ user?: ProfessorMe }>("/auth/me");
  if (!data.user) return null;
  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function getProfessorMe() {
  try {
    const { data } = await api.get<ProfessorMe>("/professor/me");
    return data;
  } catch {
    return refreshMe();
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  await AsyncStorage.removeItem(USER_STORAGE_KEY);
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    await clearSession();
  }
}
