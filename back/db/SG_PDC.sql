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
  `matricula_id` int(11) DEFAULT NULL,
  `mes_referencia` varchar(20) DEFAULT NULL,
  `valor` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `data_vencimento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `matricula_id` (`matricula_id`),
  CONSTRAINT `conta_receber_ibfk_1` FOREIGN KEY (`matricula_id`) REFERENCES `matricula` (`id`)
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
  `nome` varchar(150) DEFAULT NULL,
  `data` date DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
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
  `plano_pagamento_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  KEY `plano_pagamento_id` (`plano_pagamento_id`),
  CONSTRAINT `matricula_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`),
  CONSTRAINT `matricula_ibfk_2` FOREIGN KEY (`plano_pagamento_id`) REFERENCES `plano_pagamento` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matricula`
--

LOCK TABLES `matricula` WRITE;
/*!40000 ALTER TABLE `matricula` DISABLE KEYS */;
INSERT INTO `matricula` VALUES (1,9,'2026-04-13','ATIVA',NULL,NULL);
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
  `papel` varchar(50) DEFAULT NULL,
  `valor_fantasia` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  KEY `coreografia_id` (`coreografia_id`),
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `turma`
--

LOCK TABLES `turma` WRITE;
/*!40000 ALTER TABLE `turma` DISABLE KEYS */;
INSERT INTO `turma` VALUES (1,'Ballet Infantil Ana Jacinta ','DANÃ‡A_CLÃSSICA',NULL,'ATIVA','Iniciante'),(2,'Jazz dos 12 aos 16','JAZZ',NULL,'ATIVA','intermediÃ¡rio'),(3,'ballet teste','DANÃ‡A_CLÃSSICA',NULL,'ATIVA','Iniciante');
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
  `data` date DEFAULT NULL,
  `valor_total` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `matricula_id` (`matricula_id`),
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

-- Dump completed on 2026-04-21 20:41:51

-- ------------------------------------------------------
-- Migration support - stories 7 and 8
-- ------------------------------------------------------

CREATE TABLE IF NOT EXISTS `modalidade` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ATIVA',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_modalidade_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `local_aula` (
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

INSERT INTO `modalidade` (`nome`, `status`)
SELECT DISTINCT TRIM(`modalidade`), 'ATIVA'
FROM `turma`
WHERE `modalidade` IS NOT NULL
  AND TRIM(`modalidade`) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM `modalidade` m
    WHERE UPPER(m.`nome`) = UPPER(TRIM(`turma`.`modalidade`))
  );

INSERT INTO `local_aula` (`nome`, `cep`, `rua`, `numero`, `bairro`, `cidade`, `status`)
SELECT 'Local nao informado', '00000-000', 'A definir', 'S/N', 'A definir', 'A definir', 'ATIVO'
WHERE NOT EXISTS (
  SELECT 1
  FROM `local_aula`
  WHERE `nome` = 'Local nao informado'
);

ALTER TABLE `turma`
  ADD COLUMN IF NOT EXISTS `modalidade_id` int(11) NULL,
  ADD COLUMN IF NOT EXISTS `local_id` int(11) NULL;

UPDATE `turma` t
JOIN `modalidade` m ON UPPER(m.`nome`) = UPPER(TRIM(t.`modalidade`))
SET t.`modalidade_id` = m.`id`
WHERE t.`modalidade_id` IS NULL;

UPDATE `turma`
SET `local_id` = (
  SELECT `id`
  FROM `local_aula`
  WHERE `nome` = 'Local nao informado'
  LIMIT 1
)
WHERE `local_id` IS NULL;

ALTER TABLE `turma`
  ADD INDEX IF NOT EXISTS `idx_turma_modalidade_id` (`modalidade_id`),
  ADD INDEX IF NOT EXISTS `idx_turma_local_id` (`local_id`);

ALTER TABLE `turma`
  ADD CONSTRAINT `fk_turma_modalidade`
    FOREIGN KEY (`modalidade_id`) REFERENCES `modalidade` (`id`);

ALTER TABLE `turma`
  ADD CONSTRAINT `fk_turma_local`
    FOREIGN KEY (`local_id`) REFERENCES `local_aula` (`id`);

-- ------------------------------------------------------
