CREATE DATABASE SG_PDC;
USE SG_PDC;
-- =========================
-- PESSOAS
-- =========================
CREATE TABLE pessoa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255),
    cpf VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50)
);

CREATE TABLE responsavel (
    id INT PRIMARY KEY,
    parentesco VARCHAR(50),
    FOREIGN KEY (id) REFERENCES pessoa(id)
);

CREATE TABLE aluno (
    id INT PRIMARY KEY,
    responsavel_id INT NOT NULL,
    data_nascimento DATE,
    data_matricula DATE,
    FOREIGN KEY (id) REFERENCES pessoa(id),
    FOREIGN KEY (responsavel_id) REFERENCES responsavel(id)
);

CREATE TABLE professor (
    id INT PRIMARY KEY,
    modalidade VARCHAR(100),
    FOREIGN KEY (id) REFERENCES pessoa(id)
);

CREATE TABLE diretoria (
    id INT PRIMARY KEY,
    cargo VARCHAR(100),
    FOREIGN KEY (id) REFERENCES pessoa(id)
);

CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pessoa_id INT UNIQUE,
    email VARCHAR(255),
    senha VARCHAR(255),
    perfil VARCHAR(50),
    FOREIGN KEY (pessoa_id) REFERENCES pessoa(id)
);

-- =========================
-- TURMAS
-- =========================
CREATE TABLE turma (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100),
    modalidade VARCHAR(100),
    descricao VARCHAR(255),
    status VARCHAR(50)
);

CREATE TABLE agenda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_id INT,
    dia_semana VARCHAR(20),
    horario_inicio TIME,
    horario_fim TIME,
    FOREIGN KEY (turma_id) REFERENCES turma(id)
);

-- =========================
-- PROFESSOR_TURMA (N:N)
-- =========================
CREATE TABLE professor_turma (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professor_id INT,
    turma_id INT,
    funcao_prof VARCHAR(100),
    data_inicio DATE,
    FOREIGN KEY (professor_id) REFERENCES professor(id),
    FOREIGN KEY (turma_id) REFERENCES turma(id)
);

-- =========================
-- FINANCEIRO (PLANO)
-- =========================
CREATE TABLE plano_pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255),
    valor_base DECIMAL(10,2)
);

-- =========================
-- MATRÍCULA
-- =========================
CREATE TABLE matricula (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT,
    data_matricula DATE,
    status VARCHAR(50),
    data_cancelamento DATE,
    plano_pagamento_id INT,
    FOREIGN KEY (aluno_id) REFERENCES aluno(id),
    FOREIGN KEY (plano_pagamento_id) REFERENCES plano_pagamento(id)
);

CREATE TABLE matricula_turma (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula_id INT,
    turma_id INT,
    FOREIGN KEY (matricula_id) REFERENCES matricula(id),
    FOREIGN KEY (turma_id) REFERENCES turma(id)
);

-- =========================
-- FINANCEIRO (RECEBIMENTO)
-- =========================
CREATE TABLE conta_receber (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula_id INT,
    mes_referencia VARCHAR(20),
    valor DECIMAL(10,2),
    status VARCHAR(50),
    data_vencimento DATE,
    FOREIGN KEY (matricula_id) REFERENCES matricula(id)
);

CREATE TABLE pagamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conta_receber_id INT,
    data_pagamento DATE,
    valor_pago DECIMAL(10,2),
    forma_pagamento VARCHAR(50),
    FOREIGN KEY (conta_receber_id) REFERENCES conta_receber(id)
);

-- =========================
-- DESPESAS
-- =========================
CREATE TABLE conta_pagar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255),
    valor_total DECIMAL(10,2),
    data_vencimento DATE,
    status VARCHAR(50)
);

CREATE TABLE tipo_despesa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100)
);

CREATE TABLE despesa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conta_pagar_id INT,
    tipo_despesa_id INT,
    descricao VARCHAR(255),
    valor DECIMAL(10,2),
    data DATE,
    FOREIGN KEY (conta_pagar_id) REFERENCES conta_pagar(id),
    FOREIGN KEY (tipo_despesa_id) REFERENCES tipo_despesa(id)
);

-- =========================
-- PRESENÇA
-- =========================
CREATE TABLE presenca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula_turma_id INT,
    data DATE,
    presente BOOLEAN,
    FOREIGN KEY (matricula_turma_id) REFERENCES matricula_turma(id)
);

-- =========================
-- PRODUTOS / VENDAS
-- =========================
CREATE TABLE produto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150),
    descricao VARCHAR(255),
    valor_unitario DECIMAL(10,2),
    estoque INT,
    status VARCHAR(50)
);

CREATE TABLE venda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula_id INT NOT NULL,
    data DATE,
    valor_total DECIMAL(10,2),
    status VARCHAR(50),
    FOREIGN KEY (matricula_id) REFERENCES matricula(id)
);

CREATE TABLE venda_produto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT,
    produto_id INT,
    quantidade INT,
    valor_unitario DECIMAL(10,2),
    FOREIGN KEY (venda_id) REFERENCES venda(id),
    FOREIGN KEY (produto_id) REFERENCES produto(id)
);

-- =========================
-- EVENTOS / COREOGRAFIA
-- =========================
CREATE TABLE evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150),
    data DATE,
    descricao VARCHAR(255)
);

CREATE TABLE coreografia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT,
    nome VARCHAR(100),
    tipo VARCHAR(50),
    FOREIGN KEY (evento_id) REFERENCES evento(id)
);

CREATE TABLE fantasia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coreografia_id INT,
    descricao VARCHAR(255),
    valor_base DECIMAL(10,2),
    FOREIGN KEY (coreografia_id) REFERENCES coreografia(id)
);

CREATE TABLE participacao_coreografia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT,
    coreografia_id INT,
    papel VARCHAR(50),
    valor_fantasia DECIMAL(10,2),
    FOREIGN KEY (aluno_id) REFERENCES aluno(id),
    FOREIGN KEY (coreografia_id) REFERENCES coreografia(id)
);