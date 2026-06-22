/**
 * ============================================================
 * MIGRAÇÃO DO BANCO DE DADOS - daniela_azevedo
 * DATA: 26/05/2026
 * DESCRIÇÃO: Cria o banco de dados e todas as tabelas do sistema
 * BANCO: MySQL (WampServer) - daniela_azevedo
 * EXECUÇÃO: node migrates/migrate.js
 * ============================================================
 * 
 * INSTRUÇÕES:
 * 1. Certifique-se de que o WampServer está rodando
 * 2. Execute: node migrates/migrate.js
 * 3. O script criará o banco e todas as tabelas automaticamente
 * 
 * ⚠️ Para backup manual via phpMyAdmin:
 *    - Acesse http://localhost/phpmyadmin
 *    - Selecione o banco daniela_azevedo
 *    - Exportar → Formato SQL
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
};

async function runMigration() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   MIGRAÇÃO - DANIELA AZEVEDO                ║');
    console.log('║   Criação do Banco de Dados                 ║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('');

    let connection;
    try {
        // Conectar ao MySQL
        console.log('🔌 Conectando ao MySQL (WampServer)...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Conectado ao MySQL!');
        console.log('');

        // Criar banco de dados
        console.log('📦 Criando banco daniela_azevedo...');
        await connection.query(
            "CREATE DATABASE IF NOT EXISTS daniela_azevedo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );
        console.log('✅ Banco criado!');
        console.log('');

        // Usar o banco
        await connection.query("USE daniela_azevedo");

        // Criar tabela usuarios
        console.log('📋 Criando tabela: usuarios...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                login VARCHAR(50) NOT NULL UNIQUE,
                senha VARCHAR(255) NOT NULL,
                tipo ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
                ativo TINYINT(1) NOT NULL DEFAULT 1,
                criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela usuarios criada!');

        // Criar tabela artigos
        console.log('📋 Criando tabela: artigos...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS artigos (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela artigos criada!');

        // Criar tabela contatos
        console.log('📋 Criando tabela: contatos...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS contatos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL,
                telefone VARCHAR(20) DEFAULT NULL,
                assunto VARCHAR(200) DEFAULT NULL,
                mensagem TEXT NOT NULL,
                lido TINYINT(1) NOT NULL DEFAULT 0,
                respondido TINYINT(1) NOT NULL DEFAULT 0,
                criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela contatos criada!');

        // Criar tabela newsletter
        console.log('📋 Criando tabela: newsletter...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS newsletter (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) DEFAULT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                ativo TINYINT(1) NOT NULL DEFAULT 1,
                criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela newsletter criada!');

        // Criar tabela consultorias
        console.log('📋 Criando tabela: consultorias...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS consultorias (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Tabela consultorias criada!');

        console.log('');
        console.log('📊 Verificando tabelas criadas...');
        const [tables] = await connection.query("SHOW TABLES");
        console.log(`   Total de tabelas: ${tables.length}`);
        tables.forEach(t => console.log(`   - ${t[Object.keys(t)[0]]}`));

        console.log('');
        console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('📌 Agora execute: node server.js');
        console.log('');

    } catch (err) {
        console.error('❌ ERRO NA MIGRAÇÃO:', err.message);
        console.log('');
        console.log('💡 DICAS:');
        console.log('   1. Verifique se o WampServer está rodando');
        console.log('   2. Verifique se o MySQL está na porta padrão (3306)');
        console.log('   3. Execute manualmente o arquivo banco.sql pelo phpMyAdmin');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexão encerrada.');
        }
    }
}

runMigration();
