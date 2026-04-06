import AlunoEntity from "../entities/alunoEntity.js";
import Repository from "./repository.js";

export default class AlunoRepository extends Repository {
    constructor() {
        super();
    }

    async listar() {
        let sql = `
            select a.*
            from aluno a
            join pessoa p on p.id = a.id
            where p.status = 'ATIVO'`;

        let rows = await this.banco.ExecutaComando(sql);
        let lista = [];
        for (let row of rows) {
            lista.push(AlunoEntity.toMap(row));
        }
        return lista;
    }

    async obter(id) {
        let sql = `
            select a.*
            from aluno a
            join pessoa p on p.id = a.id
            where a.id = ?`;
        let valores = [id];

        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;

        return AlunoEntity.toMap(rows[0]);
    }

    async cadastrar(entidade) {
        let sql = `insert into aluno (id, responsavel_id, data_nascimento, data_matricula)
                   values (?, ?, ?, ?)`;
        let valores = [
            entidade.id,
            entidade.responsavel_id,
            entidade.data_nascimento,
            entidade.data_matricula
        ];

        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async alterar(entidade) {
        let sql = `update aluno set responsavel_id = ?, data_nascimento = ?, data_matricula = ? where id = ?`;
        let valores = [
            entidade.responsavel_id,
            entidade.data_nascimento,
            entidade.data_matricula,
            entidade.id
        ];

        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async inativar(id) {
        let sql = "update pessoa set status = 'INATIVO' where id = ?";
        let valores = [id];
        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async deletar(id) {
        return await this.inativar(id);
    }

    async verificarMensalidadesPendentes(alunoId) {
        let sql = `
            select count(*) as pendencias
            from conta_receber cr
            join matricula m on m.id = cr.matricula_id
            where m.aluno_id = ?
            and cr.status = 'PENDENTE'`;
        let valores = [alunoId];

        let rows = await this.banco.ExecutaComando(sql, valores);
        return rows.length > 0 && rows[0].pendencias > 0;
    }
}
