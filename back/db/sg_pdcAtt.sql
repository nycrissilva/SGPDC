-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: sg_pdc
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agenda`
--

DROP TABLE IF EXISTS `agenda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agenda` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `turma_id` int(11) DEFAULT NULL,
  `dia_semana` varchar(20) DEFAULT NULL,
  `horario_inicio` time DEFAULT NULL,
  `horario_fim` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `turma_id` (`turma_id`),
  CONSTRAINT `agenda_ibfk_1` FOREIGN KEY (`turma_id`) REFERENCES `turma` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agenda`
--

LOCK TABLES `agenda` WRITE;
/*!40000 ALTER TABLE `agenda` DISABLE KEYS */;
INSERT INTO `agenda` VALUES (1,1,'Segunda-feira','17:30:00','18:30:00'),(2,2,'Sexta-feira','20:30:00','21:30:00'),(3,3,'Quarta-feira','20:00:00','21:00:00');
/*!40000 ALTER TABLE `agenda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `aluno`
--

DROP TABLE IF EXISTS `aluno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aluno`
--

LOCK TABLES `aluno` WRITE;
/*!40000 ALTER TABLE `aluno` DISABLE KEYS */;
INSERT INTO `aluno` VALUES (8,4,'2005-08-14','2026-04-13'),(9,3,'2011-03-30','2026-04-13');
/*!40000 ALTER TABLE `aluno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conta_pagar`
--

DROP TABLE IF EXISTS `conta_pagar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conta_pagar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `descricao` varchar(255) DEFAULT NULL,
  `valor_total` decimal(10,2) DEFAULT NULL,
  `data_vencimento` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conta_pagar`
--

LOCK TABLES `conta_pagar` WRITE;
/*!40000 ALTER TABLE `conta_pagar` DISABLE KEYS */;
/*!40000 ALTER TABLE `conta_pagar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conta_receber`
--

DROP TABLE IF EXISTS `conta_receber`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conta_receber`
--

LOCK TABLES `conta_receber` WRITE;
/*!40000 ALTER TABLE `conta_receber` DISABLE KEYS */;
/*!40000 ALTER TABLE `conta_receber` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coreografia`
--

DROP TABLE IF EXISTS `coreografia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coreografia`
--

LOCK TABLES `coreografia` WRITE;
/*!40000 ALTER TABLE `coreografia` DISABLE KEYS */;
/*!40000 ALTER TABLE `coreografia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `despesa`
--

DROP TABLE IF EXISTS `despesa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `despesa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conta_pagar_id` int(11) DEFAULT NULL,
  `tipo_despesa_id` int(11) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `valor` decimal(10,2) DEFAULT NULL,
  `data` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `conta_pagar_id` (`conta_pagar_id`),
  KEY `tipo_despesa_id` (`tipo_despesa_id`),
  CONSTRAINT `despesa_ibfk_1` FOREIGN KEY (`conta_pagar_id`) REFERENCES `conta_pagar` (`id`),
  CONSTRAINT `despesa_ibfk_2` FOREIGN KEY (`tipo_despesa_id`) REFERENCES `tipo_despesa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `despesa`
--

LOCK TABLES `despesa` WRITE;
/*!40000 ALTER TABLE `despesa` DISABLE KEYS */;
/*!40000 ALTER TABLE `despesa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diretoria`
--

DROP TABLE IF EXISTS `diretoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diretoria` (
  `id` int(11) NOT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `diretoria_ibfk_1` FOREIGN KEY (`id`) REFERENCES `pessoa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diretoria`
--

LOCK TABLES `diretoria` WRITE;
/*!40000 ALTER TABLE `diretoria` DISABLE KEYS */;
INSERT INTO `diretoria` VALUES (1,'EstagiÃ¡ria TI/Admin'),(2,'ADMINISTRADOR'),(5,'DIRETOR');
/*!40000 ALTER TABLE `diretoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evento`
--

DROP TABLE IF EXISTS `evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `data` date DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evento`
--

LOCK TABLES `evento` WRITE;
/*!40000 ALTER TABLE `evento` DISABLE KEYS */;
/*!40000 ALTER TABLE `evento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fantasia`
--

DROP TABLE IF EXISTS `fantasia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fantasia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coreografia_id` int(11) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `valor_base` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coreografia_id` (`coreografia_id`),
  CONSTRAINT `fantasia_ibfk_1` FOREIGN KEY (`coreografia_id`) REFERENCES `coreografia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fantasia`
--

LOCK TABLES `fantasia` WRITE;
/*!40000 ALTER TABLE `fantasia` DISABLE KEYS */;
/*!40000 ALTER TABLE `fantasia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `espetaculo_coreografia`
--

DROP TABLE IF EXISTS `espetaculo_coreografia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `espetaculo_coreografia` WRITE;
/*!40000 ALTER TABLE `espetaculo_coreografia` DISABLE KEYS */;
/*!40000 ALTER TABLE `espetaculo_coreografia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coreografia_papel`
--

DROP TABLE IF EXISTS `coreografia_papel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `coreografia_papel` WRITE;
/*!40000 ALTER TABLE `coreografia_papel` DISABLE KEYS */;
/*!40000 ALTER TABLE `coreografia_papel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grupo_financeiro`
--

DROP TABLE IF EXISTS `grupo_financeiro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupo_financeiro`
--

LOCK TABLES `grupo_financeiro` WRITE;
/*!40000 ALTER TABLE `grupo_financeiro` DISABLE KEYS */;
/*!40000 ALTER TABLE `grupo_financeiro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grupo_financeiro_aluno`
--

DROP TABLE IF EXISTS `grupo_financeiro_aluno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupo_financeiro_aluno`
--

LOCK TABLES `grupo_financeiro_aluno` WRITE;
/*!40000 ALTER TABLE `grupo_financeiro_aluno` DISABLE KEYS */;
/*!40000 ALTER TABLE `grupo_financeiro_aluno` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `local_aula`
--

DROP TABLE IF EXISTS `local_aula`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `local_aula`
--

LOCK TABLES `local_aula` WRITE;
/*!40000 ALTER TABLE `local_aula` DISABLE KEYS */;
INSERT INTO `local_aula` VALUES (1,'Local nao informado','00000-000','A definir','S/N','A definir','A definir','ATIVO'),(2,'Unidade Ana jacinta - Centro Comunitáio','19064-778','av ana jacinta','12','ana jacinta','Presidente Prudente','ATIVO');
/*!40000 ALTER TABLE `local_aula` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matricula`
--

DROP TABLE IF EXISTS `matricula`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matricula` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `aluno_id` int(11) DEFAULT NULL,
  `data_matricula` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `data_cancelamento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `matricula_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matricula`
--

LOCK TABLES `matricula` WRITE;
/*!40000 ALTER TABLE `matricula` DISABLE KEYS */;
INSERT INTO `matricula` VALUES (1,9,'2026-04-13','ATIVA',NULL);
/*!40000 ALTER TABLE `matricula` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matricula_turma`
--

DROP TABLE IF EXISTS `matricula_turma`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matricula_turma` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `matricula_id` int(11) DEFAULT NULL,
  `turma_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `matricula_id` (`matricula_id`),
  KEY `turma_id` (`turma_id`),
  CONSTRAINT `matricula_turma_ibfk_1` FOREIGN KEY (`matricula_id`) REFERENCES `matricula` (`id`),
  CONSTRAINT `matricula_turma_ibfk_2` FOREIGN KEY (`turma_id`) REFERENCES `turma` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matricula_turma`
--

LOCK TABLES `matricula_turma` WRITE;
/*!40000 ALTER TABLE `matricula_turma` DISABLE KEYS */;
INSERT INTO `matricula_turma` VALUES (1,1,1);
/*!40000 ALTER TABLE `matricula_turma` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modalidade`
--

DROP TABLE IF EXISTS `modalidade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modalidade` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ATIVA',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_modalidade_nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modalidade`
--

LOCK TABLES `modalidade` WRITE;
/*!40000 ALTER TABLE `modalidade` DISABLE KEYS */;
INSERT INTO `modalidade` VALUES (1,'DANÇA_CLÁSSICA','ATIVA'),(2,'JAZZ','ATIVA'),(4,'Ballet','ATIVA'),(5,'DANÃ‡A_CLÃSSICA','ATIVA');
/*!40000 ALTER TABLE `modalidade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagamento`
--

DROP TABLE IF EXISTS `pagamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagamento`
--

LOCK TABLES `pagamento` WRITE;
/*!40000 ALTER TABLE `pagamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `participacao_coreografia`
--

DROP TABLE IF EXISTS `participacao_coreografia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `participacao_coreografia`
--

LOCK TABLES `participacao_coreografia` WRITE;
/*!40000 ALTER TABLE `participacao_coreografia` DISABLE KEYS */;
/*!40000 ALTER TABLE `participacao_coreografia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pessoa`
--

DROP TABLE IF EXISTS `pessoa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pessoa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) DEFAULT NULL,
  `cpf` varchar(20) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pessoa`
--

LOCK TABLES `pessoa` WRITE;
/*!40000 ALTER TABLE `pessoa` DISABLE KEYS */;
INSERT INTO `pessoa` VALUES (1,'Nycolle Cristina B. Da Silva','451.607.048-09','(18)988023453','nykkcristina@gmail.com','ATIVO'),(2,'Eva Cristina Silva','050.900.998-04','18988002468','nykkcrist@gmail.com','ATIVO'),(3,' Cristina dos Santos Silva','31600208709','189880023468','cris@email.com','ATIVO'),(4,'Nycolle Cristina B. Da Silva','67587654345','14322456787','nykkcristina@gmail.com','ATIVO'),(5,'Emily romano','234156774234','123433231234','emily@gmail.com','ATIVO'),(6,'Luisa GonÃ§alves','2345674321','34244532345','nykkcristina@gmail.com','ATIVO'),(7,'Ayla Cristina','32189630434','8934223453','ayala@ayla','ATIVO'),(8,'Ariella Cristina','43287490823','78984323421','crist@ari','ATIVO'),(9,'nathy silva','1231242453223','23464322214','nathy@gmail.com','ATIVO'),(10,'Teste Usuario','12345678900','999999999','teste@example.com','ATIVO'),(11,'Teste Usuario 2','12345678901','999999998','teste2@example.com','ATIVO'),(12,'ny admin','23453285783','23433543954','ny@admin','ATIVO'),(13,'ny prof','85432387543','23455339809','ny@prof','ATIVO'),(14,'ny professor','89834553498','23433543453','ny@profteste','ATIVO'),(15,'nycolle','87987856478','18988034256','ny@gmail.com','ATIVO'),(16,'teste','897294377590','12766898423','teste@prof','ATIVO'),(17,'professora teste','3867658970','12344678798','prof@testeteste','ATIVO'),(18,'Ligia','897099033485','23455678987','ligia@teste','ATIVO');
/*!40000 ALTER TABLE `pessoa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plano_mensalidade`
--

DROP TABLE IF EXISTS `plano_mensalidade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plano_mensalidade` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `tipo_plano` enum('INDIVIDUAL','COMBINADO','FAMILIAR') NOT NULL,
  `qtd_alunas` int(11) NOT NULL DEFAULT 1,
  `qtd_cursos` int(11) NOT NULL DEFAULT 1,
  `valor_cartao_pix` decimal(10,2) NOT NULL,
  `valor_dinheiro` decimal(10,2) NOT NULL,
  `status` enum('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (`id`),
  KEY `idx_plano_mensalidade_status` (`status`),
  KEY `idx_plano_mensalidade_tipo` (`tipo_plano`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plano_mensalidade`
--

LOCK TABLES `plano_mensalidade` WRITE;
/*!40000 ALTER TABLE `plano_mensalidade` DISABLE KEYS */;
/*!40000 ALTER TABLE `plano_mensalidade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plano_pagamento`
--

DROP TABLE IF EXISTS `plano_pagamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plano_pagamento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `descricao` varchar(255) DEFAULT NULL,
  `valor_base` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plano_pagamento`
--

LOCK TABLES `plano_pagamento` WRITE;
/*!40000 ALTER TABLE `plano_pagamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `plano_pagamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `presenca`
--

DROP TABLE IF EXISTS `presenca`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `presenca` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `matricula_turma_id` int(11) DEFAULT NULL,
  `data` date DEFAULT NULL,
  `presente` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `matricula_turma_id` (`matricula_turma_id`),
  CONSTRAINT `presenca_ibfk_1` FOREIGN KEY (`matricula_turma_id`) REFERENCES `matricula_turma` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `presenca`
--

LOCK TABLES `presenca` WRITE;
/*!40000 ALTER TABLE `presenca` DISABLE KEYS */;
INSERT INTO `presenca` VALUES (1,1,'2026-04-21',1);
/*!40000 ALTER TABLE `presenca` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produto`
--

DROP TABLE IF EXISTS `produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `valor_unitario` decimal(10,2) DEFAULT NULL,
  `estoque` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produto`
--

LOCK TABLES `produto` WRITE;
/*!40000 ALTER TABLE `produto` DISABLE KEYS */;
/*!40000 ALTER TABLE `produto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `professor`
--

DROP TABLE IF EXISTS `professor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professor` (
  `id` int(11) NOT NULL,
  `modalidade` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `professor_ibfk_1` FOREIGN KEY (`id`) REFERENCES `pessoa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `professor`
--

LOCK TABLES `professor` WRITE;
/*!40000 ALTER TABLE `professor` DISABLE KEYS */;
INSERT INTO `professor` VALUES (6,'DANÃ‡A_CLÃSSICA'),(7,'JAZZ'),(15,'DANÃ‡A_CLÃSSICA'),(16,'JAZZ'),(17,'JAZZ'),(18,'DANÃ‡A_CLÃSSICA');
/*!40000 ALTER TABLE `professor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `professor_turma`
--

DROP TABLE IF EXISTS `professor_turma`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `professor_turma`
--

LOCK TABLES `professor_turma` WRITE;
/*!40000 ALTER TABLE `professor_turma` DISABLE KEYS */;
INSERT INTO `professor_turma` VALUES (5,7,2,NULL,NULL),(6,6,2,NULL,NULL),(7,15,3,NULL,NULL),(8,6,3,NULL,NULL),(10,17,1,NULL,NULL);
/*!40000 ALTER TABLE `professor_turma` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `responsavel`
--

DROP TABLE IF EXISTS `responsavel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responsavel` (
  `id` int(11) NOT NULL,
  `parentesco` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `responsavel_ibfk_1` FOREIGN KEY (`id`) REFERENCES `pessoa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `responsavel`
--

LOCK TABLES `responsavel` WRITE;
/*!40000 ALTER TABLE `responsavel` DISABLE KEYS */;
INSERT INTO `responsavel` VALUES (3,'MÃƒE'),(4,'MÃƒE');
/*!40000 ALTER TABLE `responsavel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_despesa`
--

DROP TABLE IF EXISTS `tipo_despesa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_despesa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_despesa`
--

LOCK TABLES `tipo_despesa` WRITE;
/*!40000 ALTER TABLE `tipo_despesa` DISABLE KEYS */;
/*!40000 ALTER TABLE `tipo_despesa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `turma`
--

DROP TABLE IF EXISTS `turma`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `turma`
--

LOCK TABLES `turma` WRITE;
/*!40000 ALTER TABLE `turma` DISABLE KEYS */;
INSERT INTO `turma` VALUES (1,'Ballet Infantil Ana Jacinta ','DANÃ‡A_CLÃSSICA',NULL,'ATIVA','Iniciante',5,1),(2,'Jazz dos 12 aos 16','JAZZ',NULL,'ATIVA','intermediÃ¡rio',2,1),(3,'ballet teste','DANÃ‡A_CLÃSSICA',NULL,'ATIVA','Iniciante',5,1);
/*!40000 ALTER TABLE `turma` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pessoa_id` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `perfil` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pessoa_id` (`pessoa_id`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`pessoa_id`) REFERENCES `pessoa` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,11,'teste2@example.com','$2a$10$0sek1SXLye.D.plkMBk30eUgAdJuORZ3iAsbXwQpDtnYs8UU6eaSy','FUNCIONARIO'),(2,12,'ny@admin','$2a$10$IaJFrlrgOYbyhEkm4L/xg.4U.H4Mg1VgC7K7e/5p04Zfa3ALoZfYu','FUNCIONARIO'),(3,13,'ny@prof','090506','PROFESSOR'),(4,14,'ny@profteste','$2a$10$dsPJd2RPYePqsp1yjjmSb.qNzqtVf4.9m4SDpP2gjJrI1wo.VrSry','PROFESSOR'),(5,15,'ny@gmail.com','$2a$10$zSyHOvF20/COyyhGF3n9hezlhGftxBGv/z3YGcrvM.mefC8JpkjW.','PROFESSOR'),(6,16,'teste@prof','$2a$10$CKriBc0QRZNsPuqV.1cquuaruO./IO/k9x88YZEcL/.JchHk./VAq','PROFESSOR'),(7,17,'prof@testeteste','$2a$10$6UtJayruv5gju.1m0PjnhuXMUSMRLsAva.IROPpXkdI5oYvjrHD5u','PROFESSOR'),(8,18,'ligia@teste','$2a$10$ZDFNSzfOldMNlzbKI3WvzuzwkjlxUob.aKKyy5ihG5QCCS..QRh/O','PROFESSOR');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venda`
--

DROP TABLE IF EXISTS `venda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venda`
--

LOCK TABLES `venda` WRITE;
/*!40000 ALTER TABLE `venda` DISABLE KEYS */;
/*!40000 ALTER TABLE `venda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venda_produto`
--

DROP TABLE IF EXISTS `venda_produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venda_produto`
--

LOCK TABLES `venda_produto` WRITE;
/*!40000 ALTER TABLE `venda_produto` DISABLE KEYS */;
/*!40000 ALTER TABLE `venda_produto` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-27 13:48:04

CREATE TABLE IF NOT EXISTS `periodo_letivo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(120) NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `chamada` (
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

ALTER TABLE `venda`
  ADD COLUMN IF NOT EXISTS `conta_receber_id` int(11) NULL AFTER `matricula_id`,
  ADD INDEX IF NOT EXISTS `idx_venda_conta_receber` (`conta_receber_id`);

ALTER TABLE `venda`
  MODIFY COLUMN `status` varchar(50) DEFAULT 'PENDENTE';

UPDATE `venda`
SET `status` = CASE
  WHEN `status` = 'CONFIRMADA' THEN 'PENDENTE'
  WHEN `status` = 'PAGA' THEN 'PAGO'
  WHEN `status` = 'CANCELADA' THEN 'CANCELADO'
  ELSE COALESCE(`status`, 'PENDENTE')
END;

ALTER TABLE `tipo_despesa`
  ADD COLUMN IF NOT EXISTS `descricao` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `status` varchar(50) DEFAULT 'ATIVO',
  ADD UNIQUE INDEX IF NOT EXISTS `uk_tipo_despesa_nome` (`nome`);

INSERT IGNORE INTO `tipo_despesa` (`nome`, `descricao`, `status`) VALUES
  ('Aluguel', 'Despesa fixa de aluguel', 'ATIVO'),
  ('Salarios', 'Pagamentos da equipe', 'ATIVO'),
  ('Materiais', 'Materiais de aula e administrativos', 'ATIVO'),
  ('Servicos', 'Servicos recorrentes ou eventuais', 'ATIVO');

ALTER TABLE `despesa`
  ADD COLUMN IF NOT EXISTS `valor_total` decimal(10,2) DEFAULT NULL AFTER `descricao`,
  ADD COLUMN IF NOT EXISTS `data_despesa` date DEFAULT NULL AFTER `valor_total`,
  ADD COLUMN IF NOT EXISTS `forma_pagamento_prevista` varchar(50) DEFAULT NULL AFTER `data_despesa`,
  ADD COLUMN IF NOT EXISTS `quantidade_parcelas` int(11) NOT NULL DEFAULT 1 AFTER `forma_pagamento_prevista`,
  ADD COLUMN IF NOT EXISTS `data_primeiro_vencimento` date DEFAULT NULL AFTER `quantidade_parcelas`,
  ADD COLUMN IF NOT EXISTS `status` varchar(50) DEFAULT 'PENDENTE' AFTER `data_primeiro_vencimento`,
  ADD INDEX IF NOT EXISTS `idx_despesa_tipo` (`tipo_despesa_id`),
  ADD INDEX IF NOT EXISTS `idx_despesa_status` (`status`);

UPDATE `despesa`
SET `valor_total` = COALESCE(`valor_total`, `valor`),
    `data_despesa` = COALESCE(`data_despesa`, `data`),
    `data_primeiro_vencimento` = COALESCE(`data_primeiro_vencimento`, `data`),
    `status` = COALESCE(`status`, 'PENDENTE');

ALTER TABLE `conta_pagar`
  ADD COLUMN IF NOT EXISTS `despesa_id` int(11) DEFAULT NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `numero_parcela` int(11) NOT NULL DEFAULT 1 AFTER `despesa_id`,
  ADD COLUMN IF NOT EXISTS `total_parcelas` int(11) NOT NULL DEFAULT 1 AFTER `numero_parcela`,
  ADD COLUMN IF NOT EXISTS `valor` decimal(10,2) DEFAULT NULL AFTER `total_parcelas`,
  ADD COLUMN IF NOT EXISTS `data_pagamento` date DEFAULT NULL AFTER `data_vencimento`,
  ADD COLUMN IF NOT EXISTS `forma_pagamento` varchar(50) DEFAULT NULL AFTER `data_pagamento`,
  ADD INDEX IF NOT EXISTS `idx_conta_pagar_despesa` (`despesa_id`),
  ADD INDEX IF NOT EXISTS `idx_conta_pagar_status` (`status`),
  ADD INDEX IF NOT EXISTS `idx_conta_pagar_vencimento` (`data_vencimento`);

UPDATE `conta_pagar` cp
JOIN `despesa` d ON d.`conta_pagar_id` = cp.`id`
SET cp.`despesa_id` = COALESCE(cp.`despesa_id`, d.`id`),
    cp.`valor` = COALESCE(cp.`valor`, cp.`valor_total`, d.`valor_total`),
    cp.`data_vencimento` = COALESCE(cp.`data_vencimento`, d.`data_primeiro_vencimento`),
    cp.`status` = COALESCE(cp.`status`, 'PENDENTE');

CREATE TABLE IF NOT EXISTS `pagamento_despesa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conta_pagar_id` int(11) NOT NULL,
  `data_pagamento` date NOT NULL,
  `valor_pago` decimal(10,2) NOT NULL,
  `forma_pagamento` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pagamento_despesa_conta` (`conta_pagar_id`),
  CONSTRAINT `pagamento_despesa_ibfk_1` FOREIGN KEY (`conta_pagar_id`) REFERENCES `conta_pagar` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `evento`
  ADD COLUMN IF NOT EXISTS `status` varchar(50) NOT NULL DEFAULT 'ATIVO';

ALTER TABLE `coreografia`
  MODIFY COLUMN `evento_id` int(11) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `descricao` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `status` varchar(50) NOT NULL DEFAULT 'ATIVO',
  ADD COLUMN IF NOT EXISTS `valor_fantasia_geral` decimal(10,2) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `espetaculo_coreografia` (
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

INSERT IGNORE INTO `espetaculo_coreografia` (`espetaculo_id`, `coreografia_id`, `status`)
SELECT `evento_id`, `id`, 'ATIVO'
FROM `coreografia`
WHERE `evento_id` IS NOT NULL;

CREATE TABLE IF NOT EXISTS `coreografia_papel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coreografia_id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `valor_fantasia` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` varchar(50) NOT NULL DEFAULT 'ATIVO',
  PRIMARY KEY (`id`),
  KEY `idx_coreografia_papel_coreografia` (`coreografia_id`),
  CONSTRAINT `fk_coreografia_papel_coreografia` FOREIGN KEY (`coreografia_id`) REFERENCES `coreografia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `participacao_coreografia`
  ADD COLUMN IF NOT EXISTS `papel_id` int(11) DEFAULT NULL AFTER `coreografia_id`,
  ADD COLUMN IF NOT EXISTS `status` varchar(50) NOT NULL DEFAULT 'ATIVO',
  ADD INDEX IF NOT EXISTS `idx_participacao_papel` (`papel_id`),
  ADD UNIQUE INDEX IF NOT EXISTS `uk_participacao_coreografia_aluno_papel` (`coreografia_id`,`aluno_id`,`papel_id`);

ALTER TABLE `conta_receber`
  ADD COLUMN IF NOT EXISTS `coreografia_id` int(11) DEFAULT NULL AFTER `matricula_id`,
  ADD COLUMN IF NOT EXISTS `espetaculo_id` int(11) DEFAULT NULL AFTER `coreografia_id`,
  ADD COLUMN IF NOT EXISTS `espetaculo_coreografia_id` int(11) DEFAULT NULL AFTER `espetaculo_id`,
  ADD COLUMN IF NOT EXISTS `fantasia_id` int(11) DEFAULT NULL AFTER `espetaculo_coreografia_id`,
  ADD COLUMN IF NOT EXISTS `participacao_coreografia_id` int(11) DEFAULT NULL AFTER `fantasia_id`,
  ADD INDEX IF NOT EXISTS `idx_conta_receber_fantasia_origem` (`espetaculo_coreografia_id`,`coreografia_id`,`fantasia_id`,`participacao_coreografia_id`);

UPDATE `conta_receber` cr
JOIN `coreografia` c ON c.`id` = cr.`coreografia_id`
JOIN `espetaculo_coreografia` ec ON ec.`coreografia_id` = c.`id` AND ec.`espetaculo_id` = c.`evento_id`
SET cr.`espetaculo_id` = COALESCE(cr.`espetaculo_id`, ec.`espetaculo_id`),
    cr.`espetaculo_coreografia_id` = COALESCE(cr.`espetaculo_coreografia_id`, ec.`id`)
WHERE cr.`tipo_receita` = 'FANTASIA'
  AND cr.`coreografia_id` IS NOT NULL
  AND cr.`espetaculo_coreografia_id` IS NULL;

ALTER TABLE `pessoa`
  ADD COLUMN IF NOT EXISTS `data_nascimento` date DEFAULT NULL AFTER `email`;

UPDATE `pessoa` p
JOIN `aluno` a ON a.`id` = p.`id`
SET p.`data_nascimento` = COALESCE(p.`data_nascimento`, a.`data_nascimento`);

ALTER TABLE `usuario`
  ADD COLUMN IF NOT EXISTS `primeiro_acesso` tinyint(1) NOT NULL DEFAULT 1 AFTER `perfil`,
  ADD UNIQUE INDEX IF NOT EXISTS `uk_usuario_email` (`email`);

INSERT INTO `pessoa` (`nome`, `cpf`, `telefone`, `email`, `data_nascimento`, `status`)
SELECT 'Administrador do Sistema', '00000000000', NULL, 'admin@sgpdc.local', '2000-01-01', 'ATIVO'
WHERE NOT EXISTS (
  SELECT 1 FROM `pessoa` WHERE `cpf` = '00000000000' OR `email` = 'admin@sgpdc.local'
);

INSERT IGNORE INTO `diretoria` (`id`, `cargo`)
SELECT `id`, 'ADMINISTRADOR'
FROM `pessoa`
WHERE `email` = 'admin@sgpdc.local';

INSERT INTO `usuario` (`pessoa_id`, `email`, `senha`, `perfil`, `primeiro_acesso`)
SELECT p.`id`, p.`email`, '$2a$10$h7Df0S2pGzddF8LebP/UEuYNaBKS13DY.2S9sWmg4IrF7mL9xqsm.', 'ADMIN', 1
FROM `pessoa` p
WHERE p.`email` = 'admin@sgpdc.local'
  AND NOT EXISTS (
    SELECT 1 FROM `usuario` u WHERE u.`email` = 'admin@sgpdc.local' OR u.`pessoa_id` = p.`id`
  );
