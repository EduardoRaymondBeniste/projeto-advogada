const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const { Pool } = require('pg'); // Alterado para pg
const path = require('path');
require('dotenv').config(); // Carrega as variáveis do .env
const app = express();

// ============================================================
// Configuração do Banco (Neon / PostgreSQL)
// ============================================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Substitua a linha atual por esta:
app.set('views', path.resolve(__dirname, 'views'));
app.use(session({ secret: 'segredo', resave: false, saveUninitialized: false }));
app.use(flash());

// Middleware para variáveis globais nos templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// ===== MIDDLEWARE DE PROTEÇÃO ADMIN =====
function authRequired(req, res, next) {
    if (!req.session.user) return res.redirect('/admin/login');
    next();
}

// ============================================================
// ROTAS PÚBLICAS
// ============================================================

// HOME
app.get('/', async (req, res) => {
    try {
        // No Postgres, usamos $1, $2 para parâmetros. As consultas foram ajustadas:
        const { rows: artigos } = await pool.query(
            "SELECT *, TO_CHAR(criado_em, 'DD/MM/YYYY') as data_formatada FROM artigos WHERE status = 'publicado' ORDER BY criado_em DESC"
        );
        const { rows: destaques } = await pool.query(
            "SELECT *, TO_CHAR(criado_em, 'DD/MM/YYYY') as data_formatada FROM artigos WHERE status = 'publicado' AND destaque = true ORDER BY criado_em DESC LIMIT 3"
        );
        res.render('index', { title: 'Home', artigos, destaques });
    } catch (e) {
        console.error('Erro na home:', e.message);
        res.render('index', { title: 'Home', artigos: [], destaques: [] });
    }
});

// ... (Mantenha as outras rotas GET simples como /sobre, /atuacao, etc.)

// NOTÍCIA INDIVIDUAL
app.get('/noticia/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT *, TO_CHAR(criado_em, 'DD/MM/YYYY') as data_formatada FROM artigos WHERE id = $1 AND status = 'publicado'",
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).render('404', { title: 'Não encontrado' });
        
        await pool.query("UPDATE artigos SET views = views + 1 WHERE id = $1", [req.params.id]);
        rows[0].views = (rows[0].views || 0) + 1;
        res.render('noticia', { title: rows[0].titulo, artigo: rows[0] });
    } catch (e) {
        console.error('Erro na notícia:', e.message);
        res.status(404).render('404', { title: 'Não encontrado' });
    }
});

// ... (Continue substituindo '?' por '$1, $2' nas outras consultas SQL abaixo)

// ============================================================
// INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor Daniela Azevedo rodando na porta ' + PORT);
});