export type UserProfile = "PROFESSOR" | "FUNCIONARIO" | "ADMIN" | string;

export type AuthUser = {
  id: number;
  pessoa_id?: number;
  email: string;
  perfil: UserProfile;
  nome?: string;
  name?: string;
  firstAccess?: boolean;
};

export type LoginResponse = {
  success?: boolean;
  token?: string;
  accessToken?: string;
  jwt?: string;
  user: AuthUser;
};

export type ProfessorMe = AuthUser & {
  professorId?: number;
  modalidade?: string;
};
