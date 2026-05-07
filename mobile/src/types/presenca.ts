import { AlunoTurma } from "./turma";

export type Chamada = {
  id?: number;
  turma_id: number;
  data: string;
  finalizada?: boolean;
  sem_aula?: boolean;
  motivo_sem_aula?: string;
};

export type PeriodoLetivo = {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
};

export type DataChamada = {
  data: string;
  chamada: Chamada;
};

export type ListaPresencaResponse = {
  alunos: AlunoTurma[];
  chamada?: Chamada | null;
};

export type DatasChamadaResponse = {
  periodo: PeriodoLetivo | null;
  datas: DataChamada[];
};

export type PresencaPayload = {
  turmaId: number;
  data: string;
  presencas: {
    matricula_turma_id: number;
    presente: boolean;
  }[];
  semAula?: boolean;
  motivoSemAula?: string;
};
