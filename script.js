console.log('🚀 [script] Sistema principal inicializando...');

// ==================== VARIÁVEIS GLOBAIS ====================
let userLocation = null;
let map = null;
let companies = [];
let currentRating = 0;
let selectedAmbient = null;
let selectedBenefits = [];
let customBenefits = [];
let typingInterval = null;
let lastScrollTop = 0;
let csrfToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2); // CSRF token

// Função para escape HTML (XSS)
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Filtro de conteúdo ofensivo
const badWords = ['badword1', 'badword2', 'ofensivo', 'difamatorio']; // Expanda lista
function filterOffensiveContent(text) {
    const regex = new RegExp(badWords.join('|'), 'gi');
    if (regex.test(text)) return true; // Ofensivo
    // AI moderation (opcional)
    toxicity.load(0.9).then(model => {
        model.classify(text).then(predictions => {
            if (predictions.some(p => p.results[0].match)) return true;
        });
    });
    return false;
}

// ==================== SISTEMA DE LOADING ====================
function hideLoading() {
    console.log('🎯 Removendo tela de loading...');
    
    const loading = document.getElementById('global-loading');
    if (loading) {
        loading.style.opacity = '0';
        loading.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            loading.style.display = 'none';
            console.log('✅ Loading removido com sucesso');
        }, 500);
    }
}

// Timeout de segurança
setTimeout(hideLoading, 3000);

// ==================== FUNÇÕES DE UTILIDADE ====================
function showToast(message, type = 'info') {
    console.log(`📢 Toast [${type}]: ${message}`);
    
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('❌ Elemento toast não encontrado');
        return;
    }

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };

    const colors = {
        success: '#10b981',
        error: '#dc2626',
        info: '#3b82f6',
        warning: '#f59e0b'
    };

    toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
    toast.style.background = colors[type] || colors.info;
    toast.className = 'toast show';

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function showModal(content) {
    console.log('🪟 Mostrando modal personalizado');
    
    const existingModal = document.getElementById('custom-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">&times;</button>
            <div>${content}</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.remove();
    }
}

// Denunciar review
function denunciarReview(reviewId) {
    const motivo = prompt('Motivo da denúncia:');
    if (motivo) {
        const denuncias = JSON.parse(localStorage.getItem('denuncias') || '[]');
        denuncias.push({reviewId, motivo, user: currentUser.id, status: 'pendente'});
        localStorage.setItem('denuncias', JSON.stringify(denuncias));
        showToast('Denúncia enviada para análise', 'info');
    }
}

// ==================== INICIALIZAÇÃO GERAL ====================
function initApp() {
    // Carregar usuário
    const savedUser = localStorage.getItem('reputai_user');
    if (savedUser) window.currentUser = JSON.parse(savedUser);
    updateUI();
    
    // Gerar CSRF tokens para forms
    document.getElementById('csrf-token-login').value = csrfToken;
    document.getElementById('csrf-token-register').value = csrfToken;
    
    // Inicializar páginas específicas
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/') {
        initTypingAnimation();
        setTimeout(initMap, 1000);
        loadAndDisplayCompanies();
    } else if (path.includes('empresas.html')) {
        initEmpresasPage();
    } else if (path.includes('avaliacao.html')) {
        initEvaluationPage();
    } else if (path.includes('admin.html')) {
        if (!currentUser || !currentUser.isAdmin) {
            window.location.href = 'index.html';
        } else {
            loadAdminPanel();
        }
    } // Adicione outras

    setTimeout(hideLoading, 1000);
}

// Função admin panel (exemplo completo)
function loadAdminPanel() {
    const denuncias = JSON.parse(localStorage.getItem('denuncias') || '[]');
    // Render lista
    const list = document.getElementById('admin-denuncias'); // Assuma elemento em admin.html
    list.innerHTML = denuncias.map(d => `
        <div>
            Review ID: ${d.reviewId} - Motivo: ${escapeHtml(d.motivo)}
            <button onclick="aprovarDenuncia('${d.reviewId}')">Aprovar</button>
            <button onclick="rejeitarDenuncia('${d.reviewId}')">Rejeitar</button>
        </div>
    `).join('');
}

function aprovarDenuncia(reviewId) {
    // Update status to active
    showToast('Denúncia aprovada');
}

function rejeitarDenuncia(reviewId) {
    // Update status to indevida
    showToast('Review marcada como indevida');
}

// Init quando DOM ready
document.addEventListener('DOMContentLoaded', initApp);

// Export globals
window.showToast = showToast;
window.showModal = showModal;
// ... outras como no original
console.log('✅ [script] Sistema principal carregado e pronto');