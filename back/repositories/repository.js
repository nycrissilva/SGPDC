import Database from "../db/database.js";

export default class Repository {
    constructor() {
        this.banco = new Database();
    }

    async garantirColuna(tabela, coluna, definicao) {
        const existente = await this.banco.ExecutaComando(`
            select 1
            from information_schema.columns
            where table_schema = database()
              and table_name = ?
              and column_name = ?
            limit 1
        `, [tabela, coluna]);

        if (existente.length > 0) return;

        try {
            await this.banco.ExecutaComando(
                `alter table ?? add column ?? ${definicao}`,
                [tabela, coluna]
            );
        } catch (error) {
            if (error?.code !== "ER_DUP_FIELDNAME") throw error;
        }
    }

    async garantirIndice(tabela, indice, colunas, { unico = false } = {}) {
        const existente = await this.banco.ExecutaComando(`
            select 1
            from information_schema.statistics
            where table_schema = database()
              and table_name = ?
              and index_name = ?
            limit 1
        `, [tabela, indice]);

        if (existente.length > 0) return;

        const placeholders = colunas.map(() => "??").join(", ");
        try {
            await this.banco.ExecutaComando(
                `alter table ?? add ${unico ? "unique " : ""}index ?? (${placeholders})`,
                [tabela, indice, ...colunas]
            );
        } catch (error) {
            if (error?.code !== "ER_DUP_KEYNAME") throw error;
        }
    }
}
