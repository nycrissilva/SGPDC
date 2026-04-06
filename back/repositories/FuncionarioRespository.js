import FuncionarioEntity from "../entities/funcionarioEntity.js";
import Repository from "./repository.js";

export default class FuncionarioRepository extends Repository {
    constructor() {
        super();
    }

    async listar() {
        let sql = `
            select d.*
            from diretoria d
            join pessoa p on p.id = d.id
            where p.status = 'ATIVO'`;

        let rows = await this.banco.ExecutaComando(sql);
        let lista = [];
        for (let row of rows) {
            lista.push(FuncionarioEntity.toMap(row));
        }
        return lista;
    }

    async obter(id) {
        let sql = `
            select d.*
            from diretoria d
            join pessoa p on p.id = d.id
            where d.id = ?`;
        let valores = [id];

        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;

        return FuncionarioEntity.toMap(rows[0]);
    }

    async cadastrar(entidade) {
        let sql = `insert into diretoria (id, cargo) values (?, ?)`;
        let valores = [entidade.id, entidade.cargo];
        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async alterar(entidade) {
        let sql = `update diretoria set cargo = ? where id = ?`;
        let valores = [entidade.cargo, entidade.id];
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
