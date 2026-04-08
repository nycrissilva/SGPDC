import PessoaEntity from "../entities/pessoaEntity.js";
import Repository from "./repository.js";

export default class PessoaRepository extends Repository {
    constructor() {
        super();
    }

    async listar(ativo = true) {
        let sql = "select * from pessoa";
        if (ativo)
            sql += " where status = 'ATIVO'";

        let rows = await this.banco.ExecutaComando(sql);
        let lista = [];
        for (let row of rows) {
            lista.push(PessoaEntity.toMap(row));
        }
        return lista;
    }

    async buscar(filtro = "", tipo = null, pagina = 1, limite = 20) {
        let sql = `
            select p.*, a.responsavel_id, a.data_nascimento, a.data_matricula,
                   r.parentesco, pr.modalidade, d.cargo
            from pessoa p
            left join aluno a on a.id = p.id
            left join responsavel r on r.id = p.id
            left join professor pr on pr.id = p.id
            left join diretoria d on d.id = p.id
            where 1 = 1`;

        let valores = [];
        if (filtro) {
            sql += " and (p.nome like ? or p.cpf = ? or p.email like ?)";
            valores.push(`%${filtro}%`, filtro, `%${filtro}%`);
        }

        if (tipo) {
            tipo = tipo.toString().toUpperCase();
            if (tipo === "ALUNO")
                sql += " and a.id is not null";
            else if (tipo === "RESPONSAVEL")
                sql += " and r.id is not null";
            else if (tipo === "PROFESSOR")
                sql += " and pr.id is not null";
            else if (tipo === "DIRETORIA" || tipo === "FUNCIONARIO")
                sql += " and d.id is not null";
        }

        sql += " order by p.nome asc limit ? offset ?";
        valores.push(limite, (pagina - 1) * limite);

        let rows = await this.banco.ExecutaComando(sql, valores);
        let lista = [];
        for (let row of rows) {
            lista.push(PessoaEntity.toMap(row));
        }
        return lista;
    }

    async obter(id) {
        let sql = "select * from pessoa where id = ?";
        let valores = [id];

        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;

        return PessoaEntity.toMap(rows[0]);
    }

    async obterPorCpf(cpf) {
        let sql = "select * from pessoa where cpf = ?";
        let valores = [cpf];

        let rows = await this.banco.ExecutaComando(sql, valores);
        if (rows.length === 0)
            return null;

        return PessoaEntity.toMap(rows[0]);
    }

    async cadastrar(entidade) {
        let sql = `insert into pessoa (nome, cpf, telefone, email, status)
                   values (?, ?, ?, ?, ?)`;
        let valores = [
            entidade.nome,
            entidade.cpf,
            entidade.telefone,
            entidade.email,
            entidade.status || "ATIVO"
        ];

        let id = await this.banco.ExecutaComandoLastInserted(sql, valores);
        if (id > 0) {
            entidade.id = id;
            return true;
        }
        return false;
    }

    async alterar(entidade) {
        let sql = `update pessoa set nome = ?, cpf = ?, telefone = ?, email = ?, status = ? where id = ?`;
        let valores = [
            entidade.nome,
            entidade.cpf,
            entidade.telefone,
            entidade.email,
            entidade.status,
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
}
