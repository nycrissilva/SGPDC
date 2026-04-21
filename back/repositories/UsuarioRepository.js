import UsuarioEntity from "../entities/usuarioEntity.js";
import Repository from "./repository.js";
import { comparePassword, hashPassword } from '../utils/passwordUtils.js';

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
        let sql;
        let valores;

        if (entidade.primeiro_acesso != null) {
            sql = `insert into usuario (pessoa_id, email, senha, perfil, primeiro_acesso)
                   values (?, ?, ?, ?, ?)`;
            valores = [
                entidade.pessoa_id,
                entidade.email,
                entidade.senha,
                entidade.perfil,
                entidade.primeiro_acesso ? 1 : 0
            ];
            try {
                let id = await this.banco.ExecutaComandoLastInserted(sql, valores);
                if (id > 0) {
                    entidade.id = id;
                    return true;
                }
                return false;
            } catch (error) {
                if (error && error.code === 'ER_BAD_FIELD_ERROR') {
                    sql = `insert into usuario (pessoa_id, email, senha, perfil)
                           values (?, ?, ?, ?)`;
                    valores = [
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
                throw error;
            }
        } else {
            sql = `insert into usuario (pessoa_id, email, senha, perfil)
                   values (?, ?, ?, ?)`;
            valores = [
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
    }

    async alterar(entidade) {
        let sql;
        let valores;

        if (entidade.primeiro_acesso != null) {
            sql = `update usuario set pessoa_id = ?, email = ?, senha = ?, perfil = ?, primeiro_acesso = ? where id = ?`;
            valores = [
                entidade.pessoa_id,
                entidade.email,
                entidade.senha,
                entidade.perfil,
                entidade.primeiro_acesso ? 1 : 0,
                entidade.id
            ];
            try {
                return await this.banco.ExecutaComandoNonQuery(sql, valores);
            } catch (error) {
                if (error && error.code === 'ER_BAD_FIELD_ERROR') {
                    sql = `update usuario set pessoa_id = ?, email = ?, senha = ?, perfil = ? where id = ?`;
                    valores = [
                        entidade.pessoa_id,
                        entidade.email,
                        entidade.senha,
                        entidade.perfil,
                        entidade.id
                    ];
                    return await this.banco.ExecutaComandoNonQuery(sql, valores);
                }
                throw error;
            }
        } else {
            sql = `update usuario set pessoa_id = ?, email = ?, senha = ?, perfil = ? where id = ?`;
            valores = [
                entidade.pessoa_id,
                entidade.email,
                entidade.senha,
                entidade.perfil,
                entidade.id
            ];
            return await this.banco.ExecutaComandoNonQuery(sql, valores);
        }
    }

    async deletar(id) {
        let sql = "delete from usuario where id = ?";
        let valores = [id];
        return await this.banco.ExecutaComandoNonQuery(sql, valores);
    }

    async autenticar(email, senha) {
        const usuario = await this.obterPorEmail(email);
        if (!usuario) {
            return null;
        }

        const senhaArmazenada = usuario.senha || '';
        let senhaValida = false;

        if (/^\$2[aby]\$/.test(senhaArmazenada)) {
            senhaValida = await comparePassword(senha, senhaArmazenada);
        } else {
            senhaValida = senha === senhaArmazenada;
            if (senhaValida) {
                usuario.senha = await hashPassword(senha);
                await this.alterar(usuario);
            }
        }

        if (!senhaValida) {
            return null;
        }

        return usuario;
    }
}
