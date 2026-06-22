// ============================================================
// MAIN.JS - Daniela Azevedo Direito Tributário
// Portal de Notícias - JavaScript Principal
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ===== INICIALIZAR AOS ANIMATIONS =====
    AOS.init({
        duration: 800,
        once: true,
        offset: 100,
        easing: 'ease-in-out'
    });

    // ===== NAVBAR SCROLL EFFECT =====
    const navbar = document.getElementById('mainNav');
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 80) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // ===== BACK TO TOP BUTTON =====
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== NEWSLETTER FORM (Footer) =====
    const newsletterFooter = document.getElementById('newsletterFooter');
    if (newsletterFooter) {
        newsletterFooter.addEventListener('submit', async function (e) {
            e.preventDefault();
            const input = this.querySelector('input[type="email"]');
            const feedback = this.querySelector('.newsletter-feedback');
            const email = input.value.trim();

            if (!email) {
                feedback.innerHTML = '<span class="text-danger">Informe seu e-mail.</span>';
                return;
            }

            const nomeInput = this.querySelector('input[name="nome"]');
            const nome = nomeInput ? nomeInput.value.trim() : '';

            try {
                const res = await fetch('/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email })
                });
                const data = await res.json();

                if (data.success) {
                    feedback.innerHTML = '<span class="text-success"><i class="bi bi-check-circle"></i> Inscrição realizada com sucesso!</span>';
                    input.value = '';
                    if (nomeInput) nomeInput.value = '';
                } else {
                    feedback.innerHTML = '<span class="text-danger">' + data.message + '</span>';
                }
            } catch (err) {
                feedback.innerHTML = '<span class="text-danger">Erro ao processar. Tente novamente.</span>';
            }
        });
    }

    // ===== NEWSLETTER SECTION (Home) =====
    const newsletterSection = document.getElementById('newsletterForm');
    if (newsletterSection) {
        newsletterSection.addEventListener('submit', async function (e) {
            e.preventDefault();
            const input = this.querySelector('input[type="email"]');
            const feedback = this.querySelector('.newsletter-feedback');
            const email = input.value.trim();

            if (!email) {
                feedback.innerHTML = '<span class="text-danger">Informe seu e-mail.</span>';
                return;
            }

            try {
                const res = await fetch('/newsletter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();

                if (data.success) {
                    feedback.innerHTML = '<span class="text-success"><i class="bi bi-check-circle"></i> Inscrição realizada!</span>';
                    input.value = '';
                } else {
                    feedback.innerHTML = '<span class="text-danger">' + data.message + '</span>';
                }
            } catch (err) {
                feedback.innerHTML = '<span class="text-danger">Erro ao processar.</span>';
            }
        });
    }

    // ===== AUTO-CLOSE FLASH MESSAGES =====
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(function (msg) {
        setTimeout(function () {
            const bsAlert = new bootstrap.Alert(msg);
            bsAlert.close();
        }, 5000);
    });

    // ===== CONFIRMAÇÃO DE EXCLUSÃO =====
    const deleteForms = document.querySelectorAll('form[data-confirm]');
    deleteForms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
            if (!confirm(this.dataset.confirm || 'Tem certeza que deseja excluir?')) {
                e.preventDefault();
            }
        });
    });

    // ===== MARCAR CONTATO COMO LIDO (Admin) =====
    const markReadBtns = document.querySelectorAll('.mark-read-btn');
    markReadBtns.forEach(function (btn) {
        btn.addEventListener('click', async function () {
            const id = this.dataset.id;
            const row = this.closest('tr');
            try {
                const res = await fetch('/admin/contatos/marcar-lido/' + id, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                if (data.success) {
                    if (row) {
                        row.classList.add('table-secondary');
                        row.style.opacity = '0.6';
                    }
                    this.disabled = true;
                    this.innerHTML = '<i class="bi bi-check-lg"></i> Lido';
                }
            } catch (err) {
                console.error('Erro ao marcar como lido:', err);
            }
        });
    });

    // ===== ALTERAR STATUS DA CONSULTORIA (Admin) =====
    const statusSelects = document.querySelectorAll('.consultoria-status');
    statusSelects.forEach(function (select) {
        select.addEventListener('change', async function () {
            const id = this.dataset.id;
            const status = this.value;
            try {
                const res = await fetch('/admin/consultorias/status/' + id, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Status atualizado para: ' + status, 'success');
                }
            } catch (err) {
                console.error('Erro ao atualizar status:', err);
                showToast('Erro ao atualizar status', 'danger');
            }
        });
    });

    // ===== TOAST NOTIFICATION =====
    function showToast(message, type) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.cssText = 'position:fixed;top:100px;right:20px;z-index:9999;';
            document.body.appendChild(container);
        }

        const toastEl = document.createElement('div');
        toastEl.className = 'toast align-items-center text-bg-' + type + ' border-0 show';
        toastEl.role = 'alert';
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        document.getElementById('toastContainer').appendChild(toastEl);

        setTimeout(function () {
            toastEl.remove();
        }, 4000);
    }

    // ===== TOGGLE SIDEBAR NO DASHBOARD =====
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            document.querySelector('.dashboard-sidebar').classList.toggle('show');
        });
    }

    // ===== EFEITO DE DIGITAÇÃO NO HERO =====
    const heroTitle = document.querySelector('.hero-title .highlight');
    if (heroTitle) {
        // Já está animado via CSS, apenas garantir visibilidade
    }
    const formNovoArtigo = document.getElementById('formNovoArtigo'); // Certifique-se que seu form no HTML tem este ID

    if (formNovoArtigo) {
    formNovoArtigo.addEventListener('submit', async function (e) {
        e.preventDefault(); // Impede o reload da página

        // 1. Captura os valores dos campos
        const titulo = document.getElementById('titulo').value;
        const subtitulo = document.getElementById('subtitulo').value;
        const categoria = document.getElementById('categoria').value;
        const status = document.getElementById('status').value;
        
        // 2. CORREÇÃO DO ERRO: Converter "Sim"/"Não" para 1 ou 0
        // O banco de dados espera um INT (inteiro), não uma string.
        const destaqueInput = document.getElementById('destaque').value;
        const destaqueConvertido = (destaqueInput === 'Sim' || destaqueInput === '1') ? 1 : 0;
        
        const conteudo = document.getElementById('conteudo').value;

        // 3. Monta o objeto para envio
        const dadosDoArtigo = {
            titulo,
            subtitulo,
            categoria,
            status,
            destaque: destaqueConvertido, // Enviando o valor numérico correto
            conteudo
        };

        try {
            // 4. Envia os dados para o servidor
            const res = await fetch('/admin/artigos/novo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosDoArtigo)
            });

            const data = await res.json();

            if (data.success) {
                alert('Artigo criado com sucesso!');
                window.location.href = '/admin/artigos'; // Redireciona após sucesso
            } else {
                // Exibe erro vindo do servidor, se houver
                alert('Erro ao criar artigo: ' + (data.message || 'Erro desconhecido'));
            }
        } catch (err) {
            console.error('Erro na requisição:', err);
            alert('Erro de conexão com o servidor.');
        }
    });
}

    console.log('🚀 Daniela Azevedo - Portal de Notícias carregado!');
    console.log('📌 Desenvolvido por DevWebAI - CTO Eduardo Raymond Beniste');
});
