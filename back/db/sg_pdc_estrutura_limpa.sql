-- Estrutura limpa do banco sg_pdc
-- Gerado a partir de sg_pdcAtt.sql + pasta fisica sg_pdc em 2026-05-21.
-- Sem dados de negocio: contem apenas o usuario inicial de administracao.

CREATE DATABASE IF NOT EXISTS `sg_pdc` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `sg_pdc`;

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS=0;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS;
SET UNIQUE_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE;
SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

DROP TABLE IF EXISTS `agenda`;
CREATE TABLE `agenda` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `turma_id` int(11) DEFAULT NULL,
  `dia_semana` varchar(20) DEFAULT NULL,
  `horario_inicio` time DEFAULT NULL,
  `horario_fim` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `turma_id` (`turma_id`),
  CONSTRAINT `agenda_ibfk_1` FOREIGN KEY (`turma_id`) REFERENCES `turma` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `aluno`;
CREATE TABLE `aluno` (

  `id` int(11) NOT NULL,
  `responsavel_id` int(11) NOT NULL,
  `data_nascimento` date DEFAULT NULL,
  `data_matricula` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `responsavel_id` (`responsavel_id`),
  CONSTRAINT `aluno_ibfk_1` FOREIGN KEY (`id`) REFERENCES `pessoa` (`id`),
  CONSTRAINT `aluno_ibfk_2` FOREIGN KEY (`responsavel_id`) REFERENCES `responsavel` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `configuracao_financeira`;
CREATE TABLE `configuracao_financeira` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `valor_multa_mensalidade` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  `data_atualizacao` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_configuracao_financeira_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `conta_pagar`;
CREATE TABLE `conta_pagar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `despesa_id` int(11) DEFAULT NULL,
  `numero_parcela` int(11) NOT NULL DEFAULT 1,
  `total_parcelas` int(11) NOT NULL DEFAULT 1,
  `valor` decimal(10,2) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `valor_total` decimal(10,2) DEFAULT NULL,
  `data_vencimento` date DEFAULT NULL,
  `data_pagamento` date DEFAULT NULL,
  `forma_pagamento` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_conta_pagar_despesa` (`despesa_id`),
  KEY `idx_conta_pagar_status` (`status`),
  KEY `idx_conta_pagar_vencimento` (`data_vencimento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `conta_receber`;
CREATE TABLE `conta_receber` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grupo_financeiro_id` int(11) DEFAULT NULL,
  `matricula_id` int(11) DEFAULT NULL,
  `coreografia_id` int(11) DEFAULT NULL,
  `espetaculo_id` int(11) DEFAULT NULL,
  `espetaculo_coreografia_id` int(11) DEFAULT NULL,
  `fantasia_id` int(11) DEFAULT NULL,
  `participacao_coreografia_id` int(11) DEFAULT NULL,
  `tipo_receita` enum('MENSALIDADE','FANTASIA','VENDA') NOT NULL DEFAULT 'MENSALIDADE',
  `mes_referencia` tinyint(2) DEFAULT NULL,
  `ano_referencia` smallint(4) DEFAULT NULL,
  `valor_base` decimal(10,2) DEFAULT NULL,
  `valor_final` decimal(10,2) DEFAULT NULL,
  `multa` decimal(10,2) NOT NULL DEFAULT 0.00,
  `valor` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDENTE',
  `data_vencimento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_conta_receber_grupo_financeiro` (`grupo_financeiro_id`),
  KEY `matricula_id` (`matricula_id`),
  KEY `idx_conta_receber_fantasia_origem` (`espetaculo_coreografia_id`,`coreografia_id`,`fantasia_id`,`participacao_coreografia_id`),
  CONSTRAINT `conta_receber_ibfk_1` FOREIGN KEY (`matricula_id`) REFERENCES `matricula` (`id`),
  CONSTRAINT `fk_conta_receber_grupo_financeiro` FOREIGN KEY (`grupo_financeiro_id`) REFERENCES `grupo_financeiro` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `coreografia`;
CREATE TABLE `coreografia` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evento_id` int(11) DEFAULT NULL,
  `nome` varchar(100) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'ATIVO',
  `valor_fantasia_geral` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `evento_id` (`evento_id`),
  CONSTRAINT `coreografia_ibfk_1` FOREIGN KEY (`evento_id`) REFERENCES `evento` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `despesa`;
CREATE TABLE `despesa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conta_pagar_id` int(11) DEFAULT NULL,
  `tipo_despesa_id` int(11) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `valor_total` decimal(10,2) DEFAULT NULL,
  `data_despesa` date DEFAULT NULL,
  `forma_pagamento_prevista` varchar(50) DEFAULT NULL,
  `quantidade_parcelas` int(11) NOT NULL DEFAULT 1,
  `data_primeiro_vencimento` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'PENDENTE',
  `valor` decimal(10,2) DEFAULT NULL,
  `data` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `conta_pagar_id` (`conta_pagar_id`),
  KEY `tipo_despesa_id` (`tipo_despesa_id`),
  KEY `idx_despesa_tipo` (`tipo_despesa_id`),
  KEY `idx_despesa_status` (`status`),
  CONSTRAINT `despesa_ibfk_1` FOREIGN KEY (`conta_pagar_id`) REFERENCES `conta_pagar` (`id`),
  CONSTRAINT `despesa_ibfk_2` FOREIGN KEY (`tipo_despesa_id`) REFERENCES `tipo_despesa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `diretoria`;
CREATE TABLE `diretoria` (

  `id` int(11) NOT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `diretoria_ibfk_1` FOREIGN KEY (`id`) REFERENCES `pessoa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `evento`;
CREATE TABLE `evento` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `data` date DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `espetaculo_coreografia`;
CREATE TABLE `espetaculo_coreografia` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `espetaculo_id` int(11) NOT NULL,
  `coreografia_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_espetaculo_coreografia` (`espetaculo_id`,`coreografia_id`),
  KEY `idx_espetaculo_coreografia_espetaculo` (`espetaculo_id`),
  KEY `idx_espetaculo_coreografia_coreografia` (`coreografia_id`),
  CONSTRAINT `fk_espetaculo_coreografia_espetaculo` FOREIGN KEY (`espetaculo_id`) REFERENCES `evento` (`id`),
  CONSTRAINT `fk_espetaculo_coreografia_coreografia` FOREIGN KEY (`coreografia_id`) REFERENCES `coreografia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `coreografia_papel`;
CREATE TABLE `coreografia_papel` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coreografia_id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `valor_fantasia` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` varchar(50) NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (`id`),
  KEY `idx_coreografia_papel_coreografia` (`coreografia_id`),
  CONSTRAINT `fk_coreografia_papel_coreografia` FOREIGN KEY (`coreografia_id`) REFERENCES `coreografia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `grupo_financeiro`;
CREATE TABLE `grupo_financeiro` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `responsavel_id` int(11) NOT NULL,
  `plano_mensalidade_id` int(11) NOT NULL,
  `tipo_grupo` enum('INDIVIDUAL','FAMILIAR') NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date DEFAULT NULL,
  `status` enum('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (`id`),
  KEY `idx_grupo_financeiro_responsavel` (`responsavel_id`),
  KEY `idx_grupo_financeiro_plano` (`plano_mensalidade_id`),
  KEY `idx_grupo_financeiro_status` (`status`),
  CONSTRAINT `grupo_financeiro_ibfk_1` FOREIGN KEY (`responsavel_id`) REFERENCES `pessoa` (`id`),
  CONSTRAINT `grupo_financeiro_ibfk_2` FOREIGN KEY (`plano_mensalidade_id`) REFERENCES `plano_mensalidade` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `grupo_financeiro_aluno`;
CREATE TABLE `grupo_financeiro_aluno` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grupo_financeiro_id` int(11) NOT NULL,
  `aluno_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_grupo_financeiro_aluno` (`grupo_financeiro_id`,`aluno_id`),
  KEY `idx_grupo_financeiro_aluno_aluno` (`aluno_id`),
  CONSTRAINT `grupo_financeiro_aluno_ibfk_1` FOREIGN KEY (`grupo_financeiro_id`) REFERENCES `grupo_financeiro` (`id`),
  CONSTRAINT `grupo_financeiro_aluno_ibfk_2` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `local_aula`;
CREATE TABLE `local_aula` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `cep` varchar(20) NOT NULL,
  `rua` varchar(150) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `bairro` varchar(100) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `matricula`;
CREATE TABLE `matricula` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `aluno_id` int(11) DEFAULT NULL,
  `data_matricula` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `data_cancelamento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `matricula_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `matricula_turma`;
CREATE TABLE `matricula_turma` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `matricula_id` int(11) DEFAULT NULL,
  `turma_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `matricula_id` (`matricula_id`),
  KEY `turma_id` (`turma_id`),
  CONSTRAINT `matricula_turma_ibfk_1` FOREIGN KEY (`matricula_id`) REFERENCES `matricula` (`id`),
  CONSTRAINT `matricula_turma_ibfk_2` FOREIGN KEY (`turma_id`) REFERENCES `turma` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `modalidade`;
CREATE TABLE `modalidade` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ATIVA',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_modalidade_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `pagamento`;
CREATE TABLE `pagamento` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conta_receber_id` int(11) DEFAULT NULL,
  `data_pagamento` date DEFAULT NULL,
  `valor_pago` decimal(10,2) DEFAULT NULL,
  `forma_pagamento` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `conta_receber_id` (`conta_receber_id`),
  CONSTRAINT `pagamento_ibfk_1` FOREIGN KEY (`conta_receber_id`) REFERENCES `conta_receber` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `participacao_coreografia`;
CREATE TABLE `participacao_coreografia` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `aluno_id` int(11) DEFAULT NULL,
  `coreografia_id` int(11) DEFAULT NULL,
  `papel_id` int(11) DEFAULT NULL,
  `papel` varchar(50) DEFAULT NULL,
  `valor_fantasia` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  KEY `coreografia_id` (`coreografia_id`),
  KEY `idx_participacao_papel` (`papel_id`),
  UNIQUE KEY `uk_participacao_coreografia_aluno_papel` (`coreografia_id`,`aluno_id`,`papel_id`),
  CONSTRAINT `participacao_coreografia_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`),
  CONSTRAINT `participacao_coreografia_ibfk_2` FOREIGN KEY (`coreografia_id`) REFERENCES `coreografia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `pessoa`;
CREATE TABLE `pessoa` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) DEFAULT NULL,
  `cpf` varchar(20) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `plano_mensalidade`;
CREATE TABLE `plano_mensalidade` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `tipo_plano` enum('INDIVIDUAL','FAMILIAR') NOT NULL,
  `qtd_alunas` int(11) NOT NULL DEFAULT 1,
  `qtd_cursos` int(11) NOT NULL DEFAULT 1,
  `valor_cartao_pix` decimal(10,2) NOT NULL,
  `valor_dinheiro` decimal(10,2) NOT NULL,
  `status` enum('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (`id`),
  KEY `idx_plano_mensalidade_status` (`status`),
  KEY `idx_plano_mensalidade_tipo` (`tipo_plano`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `plano_pagamento`;
CREATE TABLE `plano_pagamento` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `descricao` varchar(255) DEFAULT NULL,
  `valor_base` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `presenca`;
CREATE TABLE `presenca` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `matricula_turma_id` int(11) DEFAULT NULL,
  `data` date DEFAULT NULL,
  `presente` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `matricula_turma_id` (`matricula_turma_id`),
  CONSTRAINT `presenca_ibfk_1` FOREIGN KEY (`matricula_turma_id`) REFERENCES `matricula_turma` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `produto`;
CREATE TABLE `produto` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `valor_unitario` decimal(10,2) DEFAULT NULL,
  `estoque` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `professor`;
CREATE TABLE `professor` (

  `id` int(11) NOT NULL,
  `modalidade` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `professor_ibfk_1` FOREIGN KEY (`id`) REFERENCES `pessoa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `professor_turma`;
CREATE TABLE `professor_turma` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `professor_id` int(11) DEFAULT NULL,
  `turma_id` int(11) DEFAULT NULL,
  `funcao_prof` varchar(100) DEFAULT NULL,
  `data_inicio` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `professor_id` (`professor_id`),
  KEY `turma_id` (`turma_id`),
  CONSTRAINT `professor_turma_ibfk_1` FOREIGN KEY (`professor_id`) REFERENCES `professor` (`id`),
  CONSTRAINT `professor_turma_ibfk_2` FOREIGN KEY (`turma_id`) REFERENCES `turma` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `responsavel`;
CREATE TABLE `responsavel` (

  `id` int(11) NOT NULL,
  `parentesco` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `responsavel_ibfk_1` FOREIGN KEY (`id`) REFERENCES `pessoa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `tipo_despesa`;
CREATE TABLE `tipo_despesa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'ATIVO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tipo_despesa_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `turma`;
CREATE TABLE `turma` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) DEFAULT NULL,
  `modalidade` varchar(100) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `nivel` varchar(50) DEFAULT NULL,
  `modalidade_id` int(11) DEFAULT NULL,
  `local_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_turma_modalidade_id` (`modalidade_id`),
  KEY `idx_turma_local_id` (`local_id`),
  CONSTRAINT `fk_turma_local` FOREIGN KEY (`local_id`) REFERENCES `local_aula` (`id`),
  CONSTRAINT `fk_turma_modalidade` FOREIGN KEY (`modalidade_id`) REFERENCES `modalidade` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pessoa_id` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `perfil` varchar(50) DEFAULT NULL,
  `primeiro_acesso` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pessoa_id` (`pessoa_id`),
  UNIQUE KEY `uk_usuario_email` (`email`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`pessoa_id`) REFERENCES `pessoa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `venda`;
CREATE TABLE `venda` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `matricula_id` int(11) NOT NULL,
  `conta_receber_id` int(11) DEFAULT NULL,
  `data` date DEFAULT NULL,
  `valor_total` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'PENDENTE',
  PRIMARY KEY (`id`),
  KEY `matricula_id` (`matricula_id`),
  KEY `idx_venda_conta_receber` (`conta_receber_id`),
  CONSTRAINT `venda_ibfk_1` FOREIGN KEY (`matricula_id`) REFERENCES `matricula` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `venda_produto`;
CREATE TABLE `venda_produto` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `venda_id` int(11) DEFAULT NULL,
  `produto_id` int(11) DEFAULT NULL,
  `quantidade` int(11) DEFAULT NULL,
  `valor_unitario` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `venda_id` (`venda_id`),
  KEY `produto_id` (`produto_id`),
  CONSTRAINT `venda_produto_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `venda` (`id`),
  CONSTRAINT `venda_produto_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produto` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `periodo_letivo`;
CREATE TABLE `periodo_letivo` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(120) NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `chamada`;
CREATE TABLE `chamada` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `turma_id` int(11) NOT NULL,
  `data` date NOT NULL,
  `finalizada` tinyint(1) NOT NULL DEFAULT 0,
  `sem_aula` tinyint(1) NOT NULL DEFAULT 0,
  `motivo_sem_aula` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_chamada_turma_data` (`turma_id`,`data`),
  CONSTRAINT `fk_chamada_turma` FOREIGN KEY (`turma_id`) REFERENCES `turma` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `pagamento_despesa`;
CREATE TABLE `pagamento_despesa` (

  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conta_pagar_id` int(11) NOT NULL,
  `data_pagamento` date NOT NULL,
  `valor_pago` decimal(10,2) NOT NULL,
  `forma_pagamento` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pagamento_despesa_conta` (`conta_pagar_id`),
  CONSTRAINT `pagamento_despesa_ibfk_1` FOREIGN KEY (`conta_pagar_id`) REFERENCES `conta_pagar` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DELIMITER //
DROP TRIGGER IF EXISTS `trg_grupo_financeiro_bu`//
CREATE TRIGGER `trg_grupo_financeiro_bu`
BEFORE UPDATE ON `grupo_financeiro`
FOR EACH ROW
BEGIN
  IF NEW.`status` = 'ATIVO' AND OLD.`status` <> 'ATIVO' AND EXISTS (
    SELECT 1
    FROM `grupo_financeiro_aluno` alvo
    JOIN `grupo_financeiro_aluno` outro_aluno ON outro_aluno.`aluno_id` = alvo.`aluno_id`
    JOIN `grupo_financeiro` outro_grupo ON outro_grupo.`id` = outro_aluno.`grupo_financeiro_id`
    WHERE alvo.`grupo_financeiro_id` = NEW.`id`
      AND outro_grupo.`id` <> NEW.`id`
      AND outro_grupo.`status` = 'ATIVO'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Aluno ja possui grupo financeiro ativo';
  END IF;
END//

DROP TRIGGER IF EXISTS `trg_grupo_financeiro_aluno_bi`//
CREATE TRIGGER `trg_grupo_financeiro_aluno_bi`
BEFORE INSERT ON `grupo_financeiro_aluno`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `grupo_financeiro_aluno` gfa
    JOIN `grupo_financeiro` gf ON gf.`id` = gfa.`grupo_financeiro_id`
    JOIN `grupo_financeiro` novo_gf ON novo_gf.`id` = NEW.`grupo_financeiro_id`
    WHERE gfa.`aluno_id` = NEW.`aluno_id`
      AND gf.`status` = 'ATIVO'
      AND novo_gf.`status` = 'ATIVO'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Aluno ja possui grupo financeiro ativo';
  END IF;
END//

DROP TRIGGER IF EXISTS `trg_grupo_financeiro_aluno_bu`//
CREATE TRIGGER `trg_grupo_financeiro_aluno_bu`
BEFORE UPDATE ON `grupo_financeiro_aluno`
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1
    FROM `grupo_financeiro_aluno` gfa
    JOIN `grupo_financeiro` gf ON gf.`id` = gfa.`grupo_financeiro_id`
    JOIN `grupo_financeiro` novo_gf ON novo_gf.`id` = NEW.`grupo_financeiro_id`
    WHERE gfa.`aluno_id` = NEW.`aluno_id`
      AND gfa.`id` <> OLD.`id`
      AND gf.`status` = 'ATIVO'
      AND novo_gf.`status` = 'ATIVO'
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Aluno ja possui grupo financeiro ativo';
  END IF;
END//

DELIMITER ;

INSERT INTO `pessoa` (`id`, `nome`, `cpf`, `telefone`, `email`, `data_nascimento`, `status`) VALUES
  (1, 'Administrador do Sistema', '00000000000', '18988023453', 'admin@ny', '2006-05-09', 'ATIVO');

INSERT INTO `diretoria` (`id`, `cargo`) VALUES
  (1, 'ADMINISTRADOR');

INSERT INTO `usuario` (`id`, `pessoa_id`, `email`, `senha`, `perfil`, `primeiro_acesso`) VALUES
  (1, 1, 'admin@ny', '$2a$10$h7Df0S2pGzddF8LebP/UEuYNaBKS13DY.2S9sWmg4IrF7mL9xqsm.', 'ADMIN', 1);

SET SQL_MODE=@OLD_SQL_MODE;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
