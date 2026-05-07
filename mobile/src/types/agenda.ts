import { Turma } from "./turma";

export type Aula = Turma & {
  agenda_id?: number;
  local?: LocalAula;
};

export type LocalAula = {
  id: number;
  nome: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
};
