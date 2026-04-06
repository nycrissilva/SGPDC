import UsuarioEntity from "../entities/usuarioEntity.js";
import Repository from "./repository.js";

export default class UsuarioRepository extends Repository {
    constructor() {
        super();
    }

    async listar() {
        let sql = "select * from usuario";
        let rows = await this.banco.ExecutaComando(sql);
        let lista = [];
        for (let row of rows) {
            lista.push(UsuarioEntity.toMap(row));
        }
        return lista;
    }

    async obter(id) {
        let sql = "select * from usuario where id = ?";
        let valores = [id];
        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;
        return UsuarioEntity.toMap(rows[0]);
    }

    async obterPorPessoaId(pessoaId) {
        let sql = "select * from usuario where pessoa_id = ?";
        let valores = [pessoaId];
        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;
        return UsuarioEntity.toMap(rows[0]);
    }

    async obterPorEmail(email) {
        let sql = "select * from usuario where email = ?";
        let valores = [email];
        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;
        return UsuarioEntity.toMap(rows[0]);
    }

    async cadastrar(entidade) {
        let sql = `insert into usuario (pessoa_id, email, senha, perfil)
                   values (?, ?, ?, ?)`;
        let valores = [
            entidade.pessoa_id,
            entidade.email,
            entidade.senha,
            entidade.perfil
        ];

        let id = await this.banco.ExecutaComandoLastInserted(sql, valores);
        if (id > 0) {
            entidade.id = id;
            return true;
        }
        return false;
    }

    async alterar(entidade) {
        let sql = `update usuario set pessoa_id = ?, email = ?, senha = ?, perfil = ? where id = ?`;
        let valores = [
            entidade.pessoa_id,
            entidade.email,
            entidade.senha,
            entidade.perfil,
            entidade.id
        ];
        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async deletar(id) {
        let sql = "delete from usuario where id = ?";
        let valores = [id];
        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async autenticar(email, senha) {
        let sql = "select * from usuario where email = ? and senha = ?";
        let valores = [email, senha];
        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;
        return UsuarioEntity.toMap(rows[0]);
    }
}
