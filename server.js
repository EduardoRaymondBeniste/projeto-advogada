const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();

// Configuração do Banco (WampServer MySQL)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'daniela_azevedo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

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
        const [artigos] = await pool.query(
            "SELECT *, DATE_FORMAT(criado_em, '%d/%m/%Y') as data_formatada FROM artigos WHERE status = 'publicado' ORDER BY criado_em DESC"
        );
        const [destaques] = await pool.query(
            "SELECT *, DATE_FORMAT(criado_em, '%d/%m/%Y') as data_formatada FROM artigos WHERE status = 'publicado' AND destaque = 1 ORDER BY criado_em DESC LIMIT 3"
        );
        res.render('index', { title: 'Home', artigos, destaques });
    } catch (e) {
        console.error('Erro na home:', e.message);
        res.render('index', { title: 'Home', artigos: [], destaques: [] });
    }
});

// SOBRE
app.get('/sobre', (req, res) => res.render('sobre', { title: 'Sobre' }));

// ATUAÇÃO
app.get('/atuacao', (req, res) => res.render('atuacao', { title: 'Atuação' }));

// EQUIPE
app.get('/equipe', (req, res) => res.render('equipe', { title: 'Equipe' }));

// NOTÍCIA INDIVIDUAL
app.get('/noticia/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT *, DATE_FORMAT(criado_em, '%d/%m/%Y') as data_formatada FROM artigos WHERE id = ? AND status = 'publicado'",
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).render('404', { title: 'Não encontrado' });
        // Incrementa views
        await pool.query("UPDATE artigos SET views = views + 1 WHERE id = ?", [req.params.id]);
        rows[0].views = (rows[0].views || 0) + 1;
        res.render('noticia', { title: rows[0].titulo, artigo: rows[0] });
    } catch (e) {
        console.error('Erro na notícia:', e.message);
        res.status(404).render('404', { title: 'Não encontrado' });
    }
});

// PESQUISA
app.get('/pesquisa', async (req, res) => {
    const query = req.query.q || '';
    let artigos = [];
    if (query.trim()) {
        try {
            const [rows] = await pool.query(
                "SELECT *, DATE_FORMAT(criado_em, '%d/%m/%Y') as data_formatada FROM artigos WHERE status = 'publicado' AND (titulo LIKE ? OR conteudo LIKE ? OR tags LIKE ? OR categoria LIKE ? OR subtitulo LIKE ?) ORDER BY criado_em DESC",
                [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
            );
            artigos = rows;
        } catch (e) {
            console.error('Erro na pesquisa:', e.message);
        }
    }
    res.render('pesquisa', { title: 'Pesquisa', query, artigos });
});

// FALE CONOSCO
app.get('/faleconosco', (req, res) => res.render('faleconosco', { title: 'Fale Conosco' }));

app.post('/faleconosco', async (req, res) => {
    try {
        const { nome, email, telefone, assunto, mensagem } = req.body;
        if (!nome || !email || !mensagem) {
            req.flash('error_msg', 'Preencha nome, e-mail e mensagem.');
            return res.redirect('/faleconosco');
        }
        await pool.query(
            "INSERT INTO contatos (nome, email, telefone, assunto, mensagem) VALUES (?, ?, ?, ?, ?)",
            [nome, email, telefone || null, assunto || null, mensagem]
        );
        req.flash('success_msg', 'Mensagem enviada com sucesso! Retornaremos em breve.');
        res.redirect('/faleconosco');
    } catch (e) {
        console.error('Erro faleconosco:', e.message);
        req.flash('error_msg', 'Erro ao enviar mensagem. Tente novamente.');
        res.redirect('/faleconosco');
    }
});

// CONSULTORIA
app.get('/consultoria', (req, res) => res.render('consultoria', { title: 'Consultoria' }));

app.post('/consultoria', async (req, res) => {
    try {
        const { nome, email, telefone, tipo_consulta, data_sugerida, horario_sugerido, descricao } = req.body;
        if (!nome || !email) {
            req.flash('error_msg', 'Preencha nome e e-mail.');
            return res.redirect('/consultoria');
        }
        await pool.query(
            "INSERT INTO consultorias (nome_cliente, email_cliente, telefone_cliente, tipo_consulta, data_sugerida, horario_sugerido, descricao) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [nome, email, telefone || null, tipo_consulta || 'Consultoria Jurídica', data_sugerida || null, horario_sugerido || null, descricao || null]
        );
        req.flash('success_msg', 'Solicitação de consultoria enviada com sucesso! Entraremos em contato.');
        res.redirect('/consultoria');
    } catch (e) {
        console.error('Erro consultoria:', e.message);
        req.flash('error_msg', 'Erro ao enviar solicitação. Tente novamente.');
        res.redirect('/consultoria');
    }
});

// NEWSLETTER
app.post('/newsletter', async (req, res) => {
    try {
        const email = req.body.email;
        if (!email) return res.json({ success: false, message: 'Informe seu e-mail.' });
        await pool.query("INSERT INTO newsletter (nome, email, ativo) VALUES (?, ?, 1)", [req.body.nome || 'Visitante', email]);
        res.json({ success: true, message: 'Inscrição realizada com sucesso!' });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            res.json({ success: true, message: 'E-mail já cadastrado!' });
        } else {
            console.error('Erro newsletter:', e.message);
            res.json({ success: false, message: 'Erro na inscrição. Tente novamente.' });
        }
    }
});

// ============================================================
// ROTAS ADMIN - LOGIN / LOGOUT
// ============================================================

app.get('/admin/login', (req, res) => {
    res.render('adm/login', { title: 'Login Admin' });
});

app.post('/admin/login', async (req, res) => {
    try {
        const login = req.body.login || req.body.email || '';
        const senha = req.body.senha || req.body.password || '';
        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE login = ? AND senha = ?",
            [login, senha]
        );
        if (rows.length > 0) {
            req.session.user = rows[0];
            req.flash('success_msg', 'Login realizado com sucesso!');
            return res.redirect('/admin/dashboard');
        }
        req.flash('error_msg', 'Login ou senha inválidos.');
        res.redirect('/admin/login');
    } catch (e) {
        console.error('Erro login:', e.message);
        req.flash('error_msg', 'Erro ao fazer login.');
        res.redirect('/admin/login');
    }
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Erro logout:', err);
        res.redirect('/admin/login');
    });
});

// ============================================================
// ROTAS ADMIN - DASHBOARD
// ============================================================

app.get('/admin/dashboard', authRequired, async (req, res) => {
    try {
        const [[{ total: totalArtigos }]] = await pool.query("SELECT COUNT(*) as total FROM artigos");
        const [[{ total: totalContatos }]] = await pool.query("SELECT COUNT(*) as total FROM contatos");
        const [[{ total: totalConsultorias }]] = await pool.query("SELECT COUNT(*) as total FROM consultorias");
        const [[{ total: totalNewsletter }]] = await pool.query("SELECT COUNT(*) as total FROM newsletter");
        const [ultimosContatos] = await pool.query("SELECT * FROM contatos ORDER BY criado_em DESC LIMIT 5");

        res.render('adm/dashboard', {
            title: 'Dashboard',
            stats: {
                artigos: totalArtigos,
                contatos: totalContatos,
                consultorias: totalConsultorias,
                newsletter: totalNewsletter
            },
            ultimosContatos
        });
    } catch (e) {
        console.error('Erro dashboard:', e.message);
        res.render('adm/dashboard', {
            title: 'Dashboard',
            stats: { artigos: 0, contatos: 0, consultorias: 0, newsletter: 0 },
            ultimosContatos: []
        });
    }
});

// ============================================================
// ROTAS ADMIN - ARTIGOS (CRUD)
// ============================================================

app.get('/admin/artigos', authRequired, async (req, res) => {
    try {
        const [artigos] = await pool.query("SELECT * FROM artigos ORDER BY criado_em DESC");
        res.render('adm/artigos', { title: 'Artigos', artigos });
    } catch (e) {
        console.error('Erro listar artigos:', e.message);
        res.render('adm/artigos', { title: 'Artigos', artigos: [] });
    }
});

app.get('/admin/artigos/novo', authRequired, (req, res) => {
    res.render('adm/artigo-form', { title: 'Novo Artigo', artigo: null });
});

app.post('/admin/artigos/novo', authRequired, async (req, res) => {
    try {
        const { titulo, subtitulo, conteudo, autor, categoria, tags, imagem, destaque, status } = req.body;
        
        // --- CORREÇÃO AQUI ---
        // Converte "Sim" para 1, caso contrário define como 0
        const destaqueFormatado = (destaque === 'Sim') ? 1 : 0;

        if (!titulo || !conteudo) {
            req.flash('error_msg', 'Título e conteúdo são obrigatórios.');
            return res.redirect('/admin/artigos/novo');
        }

        await pool.query(
            "INSERT INTO artigos (titulo, subtitulo, conteudo, autor, categoria, tags, imagem, destaque, status, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            // Usamos a variável 'destaqueFormatado' aqui no lugar de 'destaque || 0'
            [titulo, subtitulo || null, conteudo, autor || 'Daniela Azevedo', categoria || 'Direito Tributário', tags || null, imagem || null, destaqueFormatado, status || 'rascunho', req.session.user.id || null]
        );
        
        req.flash('success_msg', 'Artigo criado com sucesso!');
        res.redirect('/admin/artigos');
    } catch (e) {
        console.error('Erro criar artigo:', e.message);
        req.flash('error_msg', 'Erro ao criar artigo.');
        res.redirect('/admin/artigos/novo');
    }
});
app.get('/admin/artigos/editar/:id', authRequired, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM artigos WHERE id = ?", [req.params.id]);
        if (rows.length === 0) {
            req.flash('error_msg', 'Artigo não encontrado.');
            return res.redirect('/admin/artigos');
        }
        res.render('adm/artigo-form', { title: 'Editar Artigo', artigo: rows[0] });
    } catch (e) {
        console.error('Erro editar artigo:', e.message);
        res.redirect('/admin/artigos');
    }
});

app.post('/admin/artigos/editar/:id', authRequired, async (req, res) => {
    try {
        const { titulo, subtitulo, conteudo, autor, categoria, tags, imagem, destaque, status } = req.body;
        if (!titulo || !conteudo) {
            req.flash('error_msg', 'Título e conteúdo são obrigatórios.');
            return res.redirect('/admin/artigos/editar/' + req.params.id);
        }
        await pool.query(
            "UPDATE artigos SET titulo=?, subtitulo=?, conteudo=?, autor=?, categoria=?, tags=?, imagem=?, destaque=?, status=? WHERE id=?",
            [titulo, subtitulo || null, conteudo, autor || 'Daniela Azevedo', categoria || 'Direito Tributário', tags || null, imagem || null, destaque || 0, status || 'rascunho', req.params.id]
        );
        req.flash('success_msg', 'Artigo atualizado com sucesso!');
        res.redirect('/admin/artigos');
    } catch (e) {
        console.error('Erro atualizar artigo:', e.message);
        req.flash('error_msg', 'Erro ao atualizar artigo.');
        res.redirect('/admin/artigos/editar/' + req.params.id);
    }
});

app.post('/admin/artigos/excluir/:id', authRequired, async (req, res) => {
    try {
        await pool.query("DELETE FROM artigos WHERE id = ?", [req.params.id]);
        req.flash('success_msg', 'Artigo excluído.');
    } catch (e) {
        console.error('Erro excluir artigo:', e.message);
        req.flash('error_msg', 'Erro ao excluir artigo.');
    }
    res.redirect('/admin/artigos');
});

// ============================================================
// ROTAS ADMIN - CONTATOS
// ============================================================

app.get('/admin/contatos', authRequired, async (req, res) => {
    try {
        const [contatos] = await pool.query("SELECT * FROM contatos ORDER BY criado_em DESC");
        res.render('adm/contatos', { title: 'Contatos', contatos });
    } catch (e) {
        console.error('Erro listar contatos:', e.message);
        res.render('adm/contatos', { title: 'Contatos', contatos: [] });
    }
});

app.post('/admin/contatos/marcar-lido/:id', authRequired, async (req, res) => {
    try {
        await pool.query("UPDATE contatos SET lido = 1 WHERE id = ?", [req.params.id]);
    } catch (e) {
        console.error('Erro marcar lido:', e.message);
    }
    res.redirect('/admin/contatos');
});

app.post('/admin/contatos/excluir/:id', authRequired, async (req, res) => {
    try {
        await pool.query("DELETE FROM contatos WHERE id = ?", [req.params.id]);
        req.flash('success_msg', 'Contato excluído.');
    } catch (e) {
        console.error('Erro excluir contato:', e.message);
        req.flash('error_msg', 'Erro ao excluir contato.');
    }
    res.redirect('/admin/contatos');
});

// ============================================================
// ROTAS ADMIN - CONSULTORIAS
// ============================================================

app.get('/admin/consultorias', authRequired, async (req, res) => {
    try {
        const [consultorias] = await pool.query(
            "SELECT id, nome_cliente AS nome, email_cliente AS email, telefone_cliente AS telefone, tipo_consulta, descricao, data_sugerida, horario_sugerido, status, criado_em FROM consultorias ORDER BY criado_em DESC"
        );
        res.render('adm/consultorias', { title: 'Consultorias', consultorias });
    } catch (e) {
        console.error('Erro listar consultorias:', e.message);
        res.render('adm/consultorias', { title: 'Consultorias', consultorias: [] });
    }
});

app.post('/admin/consultorias/excluir/:id', authRequired, async (req, res) => {
    try {
        await pool.query("DELETE FROM consultorias WHERE id = ?", [req.params.id]);
        req.flash('success_msg', 'Consultoria excluída.');
    } catch (e) {
        console.error('Erro excluir consultoria:', e.message);
        req.flash('error_msg', 'Erro ao excluir consultoria.');
    }
    res.redirect('/admin/consultorias');
});

// ============================================================
// ROTAS ADMIN - NEWSLETTER
// ============================================================

app.get('/admin/newsletter', authRequired, async (req, res) => {
    try {
        const [inscritos] = await pool.query("SELECT * FROM newsletter ORDER BY criado_em DESC");
        res.render('adm/newsletter', { title: 'Newsletter', inscritos });
    } catch (e) {
        console.error('Erro listar newsletter:', e.message);
        res.render('adm/newsletter', { title: 'Newsletter', inscritos: [] });
    }
});

app.post('/admin/newsletter/excluir/:id', authRequired, async (req, res) => {
    try {
        await pool.query("DELETE FROM newsletter WHERE id = ?", [req.params.id]);
        req.flash('success_msg', 'Inscrito removido.');
    } catch (e) {
        console.error('Erro excluir newsletter:', e.message);
        req.flash('error_msg', 'Erro ao remover inscrito.');
    }
    res.redirect('/admin/newsletter');
});

// ============================================================
// ROTAS ADMIN - USUÁRIOS
// ============================================================

app.get('/admin/usuarios', authRequired, async (req, res) => {
    try {
        const [usuarios] = await pool.query(
            "SELECT id, nome, login, email, tipo, CASE WHEN tipo = 'admin' THEN 1 ELSE 0 END AS is_admin, criado_em FROM usuarios ORDER BY criado_em DESC"
        );
        res.render('adm/usuarios', { title: 'Usuários', usuarios });
    } catch (e) {
        console.error('Erro listar usuários:', e.message);
        res.render('adm/usuarios', { title: 'Usuários', usuarios: [] });
    }
});

// ============================================================
// 404 - Última rota
// ============================================================
app.use((req, res) => {
    res.status(404).render('404', { title: 'Página não encontrada' });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor Daniela Azevedo rodando na porta ' + PORT);
});
