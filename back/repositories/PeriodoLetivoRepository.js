import Repository from "./repository.js";

export default class PeriodoLetivoRepository extends Repository {
    constructor() {
        super();
        this.ready = this.ensureSchema()
            .then(() => null)
            .catch((error) => error);
    }

    async waitUntilReady() {
        const error = await this.ready;
        if (error) throw error;
    }

    async ensureSchema() {
        await this.banco.ExecutaComando(`
            create table if not exists periodo_letivo (
                id int auto_increment primary key,
                nome varchar(120) not null,
                data_inicio date not null,
                data_fim date not null,
                ativo tinyint(1) not null default 1,
                created_at timestamp default current_timestamp
            )`, []);
    }

    async listar() {
        await this.waitUntilReady();
        const rows = await this.banco.ExecutaComando(
            `select id, nome, data_inicio, data_fim, ativo
             from periodo_letivo
             order by ativo desc, data_inicio desc`,
            []
        );
        return rows.map((row) => this.toMap(row));
    }

    async obterAtual() {
        await this.waitUntilReady();
        const rows = await this.banco.ExecutaComando(
            `select id, nome, data_inicio, data_fim, ativo
             from periodo_letivo
             where ativo = 1
             order by data_inicio desc
             limit 1`,
            []
        );
        return rows.length ? this.toMap(rows[0]) : null;
    }

    async salvar({ id, nome, data_inicio, data_fim }) {
        await this.waitUntilReady();
        await this.banco.ExecutaComandoNonQuery(`update periodo_letivo set ativo = 0 where ativo = 1`, []);

        if (id) {
            await this.banco.ExecutaComandoNonQuery(
                `update periodo_letivo set nome = ?, data_inicio = ?, data_fim = ?, ativo = 1 where id = ?`,
                [nome, data_inicio, data_fim, id]
            );
            return id;
        }

        return await this.banco.ExecutaComandoLastInserted(
            `insert into periodo_letivo (nome, data_inicio, data_fim, ativo) values (?, ?, ?, 1)`,
            [nome, data_inicio, data_fim]
        );
    }

    toMap(row) {
        const formatDate = (value) => value instanceof Date
            ? value.toISOString().split("T")[0]
            : String(value).split("T")[0];

        return {
            id: row["id"],
            nome: row["nome"],
            data_inicio: formatDate(row["data_inicio"]),
            data_fim: formatDate(row["data_fim"]),
            ativo: row["ativo"] === 1 || row["ativo"] === true,
        };
    }
}
