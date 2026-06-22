-- ============================================================
-- RECRIAR BANCO DO ZERO - Daniela Azevedo
-- ============================================================

CREATE DATABASE IF NOT EXISTS daniela_azevedo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE daniela_azevedo;

-- Remover tabelas existentes (ordem: filhas primeiro)
DROP TABLE IF EXISTS consultorias;
DROP TABLE IF EXISTS artigos;
DROP TABLE IF EXISTS contatos;
DROP TABLE IF EXISTS newsletter;
DROP TABLE IF EXISTS usuarios;

-- ============================================================
-- TABELA: usuarios
-- ============================================================
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  login VARCHAR(50) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  tipo ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: artigos
-- ============================================================
CREATE TABLE artigos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  subtitulo VARCHAR(300) DEFAULT NULL,
  conteudo TEXT NOT NULL,
  autor VARCHAR(100) DEFAULT 'Daniela Azevedo',
  categoria VARCHAR(100) DEFAULT 'Direito Tributário',
  tags VARCHAR(255) DEFAULT NULL,
  imagem VARCHAR(255) DEFAULT NULL,
  destaque TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('rascunho', 'publicado') NOT NULL DEFAULT 'rascunho',
  views INT NOT NULL DEFAULT 0,
  usuario_id INT DEFAULT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: contatos
-- ============================================================
CREATE TABLE contatos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefone VARCHAR(20) DEFAULT NULL,
  assunto VARCHAR(200) DEFAULT NULL,
  mensagem TEXT NOT NULL,
  lido TINYINT(1) NOT NULL DEFAULT 0,
  respondido TINYINT(1) NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: newsletter
-- ============================================================
CREATE TABLE newsletter (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) DEFAULT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: consultorias
-- ============================================================
CREATE TABLE consultorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_cliente VARCHAR(100) NOT NULL,
  email_cliente VARCHAR(150) NOT NULL,
  telefone_cliente VARCHAR(20) DEFAULT NULL,
  tipo_consulta VARCHAR(100) DEFAULT 'Consultoria Jurídica',
  descricao TEXT DEFAULT NULL,
  data_sugerida DATE DEFAULT NULL,
  horario_sugerido TIME DEFAULT NULL,
  status ENUM('pendente', 'confirmado', 'concluido', 'cancelado') NOT NULL DEFAULT 'pendente',
  usuario_id INT DEFAULT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INSERTS
-- ============================================================

-- Login: daniela | Senha: admin123
INSERT INTO usuarios (nome, email, login, senha, tipo) VALUES
('Daniela Azevedo', 'daniela@danielaazevedo.adv.br', 'daniela', 'admin123', 'admin');

-- Artigos de exemplo
INSERT INTO artigos (titulo, subtitulo, conteudo, autor, categoria, tags, destaque, status) VALUES
(
  'Reforma Tributária: Impactos para Empresas em 2025',
  'Entenda as principais mudanças e como se preparar',
  '<p>A reforma tributária promovida pela Emenda Constitucional 132/2023 traz mudanças significativas no sistema tributário nacional.</p><p>Empresas de todos os portes precisam se preparar para a transição que ocorrerá nos próximos anos.</p>',
  'Daniela Azevedo', 'Direito Tributário', 'reforma tributária, IVA',
  1, 'publicado'
),
(
  'Planejamento Tributário: Estratégias Legais para Redução de Impostos',
  'Como sua empresa pode economizar dentro da lei',
  '<p>O planejamento tributário é uma ferramenta essencial para empresas que buscam reduzir legalmente sua carga tributária.</p>',
  'Daniela Azevedo', 'Direito Tributário', 'planejamento tributário',
  1, 'publicado'
),
(
  'ITCMD: Tudo sobre o Imposto de Transmissão Causa Mortis e Doação',
  'Guia completo sobre o imposto estadual',
  '<p>O ITCMD é o imposto estadual incidente sobre transmissões de bens por herança ou doação.</p>',
  'Daniela Azevedo', 'Direito Tributário', 'ITCMD, herança, doação',
  0, 'publicado'
);