export type Turma = {
  id: number;
  nome: string;
  modalidade?: string;
  modalidade_nome?: string;
  nivel?: string;
  descricao?: string;
  status?: string;
  dia_semana?: string;
  horario_inicio?: string;
  horario_fim?: string;
  local_id?: number;
  local_nome?: string;
  professor_ids?: number[];
  professor_names?: string[];
};

export type AlunoTurma = {
  aluno_id: number;
  aluno_nome?: string;
  nome?: string;
  matricula_turma_id: number;
  presente?: boolean | number;
  presenca_id?: number | null;
};
