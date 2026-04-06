import ProfessorEntity from "../entities/professorEntity.js";
import Repository from "./repository.js";

export default class ProfessorRepository extends Repository {
    constructor() {
        super();
    }

    async listar() {
        let sql = `
            select pr.*
            from professor pr
            join pessoa p on p.id = pr.id
            where p.status = 'ATIVO'`;

        let rows = await this.banco.ExecutaComando(sql);
        let lista = [];
        for (let row of rows) {
            lista.push(ProfessorEntity.toMap(row));
        }
        return lista;
    }

    async obter(id) {
        let sql = `
            select pr.*
            from professor pr
            join pessoa p on p.id = pr.id
            where pr.id = ?`;
        let valores = [id];

        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;

        return ProfessorEntity.toMap(rows[0]);
    }

    async cadastrar(entidade) {
        let sql = `insert into professor (id, modalidade) values (?, ?)`;
        let valores = [entidade.id, entidade.modalidade];
        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async alterar(entidade) {
        let sql = `update professor set modalidade = ? where id = ?`;
        let valores = [entidade.modalidade, entidade.id];
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
}
