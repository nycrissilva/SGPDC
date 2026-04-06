import ResponsavelEntity from "../entities/responsavelEntity.js";
import Repository from "./repository.js";

export default class ResponsavelRepository extends Repository {
    constructor() {
        super();
    }

    async listar() {
        let sql = `
            select r.*
            from responsavel r
            join pessoa p on p.id = r.id
            where p.status = 'ATIVO'`;

        let rows = await this.banco.ExecutaComando(sql);
        let lista = [];
        for (let row of rows) {
            lista.push(ResponsavelEntity.toMap(row));
        }
        return lista;
    }

    async obter(id) {
        let sql = `
            select r.*
            from responsavel r
            join pessoa p on p.id = r.id
            where r.id = ?`;
        let valores = [id];

        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;

        return ResponsavelEntity.toMap(rows[0]);
    }

    async cadastrar(entidade) {
        let sql = `insert into responsavel (id, parentesco) values (?, ?)`;
        let valores = [entidade.id, entidade.parentesco];
        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async alterar(entidade) {
        let sql = `update responsavel set parentesco = ? where id = ?`;
        let valores = [entidade.parentesco, entidade.id];
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
