import Database from './db/database.js';

const db = new Database();
const query = async (sql, vals = []) => new Promise((resolve, reject) => {
  db.conexao.query(sql, vals, (err, results) => err ? reject(err) : resolve(results));
});

const tests = [
  ['func', "select d.* from diretoria d join pessoa p on p.id=d.id where p.status = 'ATIVO'"],
  ['func_buscar', "select p.* from pessoa p left join aluno a on a.id = p.id left join responsavel r on r.id = p.id left join professor pr on pr.id = p.id left join diretoria d on d.id = p.id where d.id is not null order by p.nome asc limit 20 offset 0"],
  ['alunos', "select p.* from pessoa p left join aluno a on a.id = p.id left join responsavel r on r.id = p.id left join professor pr on pr.id = p.id left join diretoria d on d.id = p.id where a.id is not null order by p.nome asc limit 20 offset 0"],
];

(async () => {
  for (const [name, sql] of tests) {
    const rows = await query(sql);
    console.log(name, rows.length);
    console.log(rows.map(r => ({ keys: Object.keys(r), row: r })));
  }
})();
