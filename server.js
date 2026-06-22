const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();

// ============================================================
// Configuração do Banco (Neon PostgreSQL)
// ============================================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ============================================================
// Middlewares
// ============================================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({ 
    secret: 'segredo_super_seguro', 
    resave: false, 
    saveUninitialized: false 
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// ============================================================
// ROTAS PÚBLICAS
// ============================================================
app.get('/', async (req, res) => {
    try {
        const { rows: artigos } = await pool.query("SELECT * FROM artigos WHERE status = 'publicado' ORDER BY criado_em DESC");
        res.render('index', { title: 'Home', artigos });
    } catch (e) {
        res.status(500).send("Erro ao carregar o banco de dados: " + e.message);
    }
});

app.get('/sobre', (req, res) => res.render('sobre', { title: 'Sobre' }));
app.get('/atuacao', (req, res) => res.render('atuacao', { title: 'Atuação' }));
app.get('/contatos', (req, res) => res.render('contatos', { title: 'Contatos' }));

app.get('/noticia/:id', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM artigos WHERE id = $1", [req.params.id]);
        if (rows.length === 0) return res.status(404).send("Artigo não encontrado");
        res.render('noticia', { title: rows[0].titulo, artigo: rows[0] });
    } catch (e) {
        res.status(500).send("Erro ao buscar notícia");
    }
});

// ============================================================
// ROTAS DE ADMINISTRAÇÃO
// ============================================================
app.get('/admin/login', (req, res) => res.render('admin/login', { title: 'Login Admin' }));

app.post('/admin/login', async (req, res) => {
    const { login, senha } = req.body;
    try {
        const { rows } = await pool.query("SELECT * FROM usuarios WHERE login = $1 AND senha = $2", [login, senha]);
        if (rows.length > 0) {
            req.session.user = rows[0];
            res.redirect('/admin/painel');
        } else {
            req.flash('error_msg', 'Credenciais inválidas');
            res.redirect('/admin/login');
        }
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/admin/painel', (req, res) => {
    if (!req.session.user) return res.redirect('/admin/login');
    res.render('admin/painel', { title: 'Painel Admin' });
});

app.post('/admin/novo-artigo', async (req, res) => {
    if (!req.session.user) return res.status(401).send("Não autorizado");
    const { titulo, conteudo, status } = req.body;
    try {
        await pool.query(
            "INSERT INTO artigos (titulo, conteudo, status, criado_em) VALUES ($1, $2, $3, NOW())",
            [titulo, conteudo, status]
        );
        req.flash('success_msg', 'Artigo criado com sucesso!');
        res.redirect('/admin/painel');
    } catch (e) { res.status(500).send("Erro ao salvar: " + e.message); }
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));