// init.js - Sistema de inicialização unificada
console.log('🔧 [init] Inicializando sistema...');

// ==================== FUNÇÕES DE INICIALIZAÇÃO ====================
function initPage() {
    console.log('📄 Detectando página...');
    
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    console.log(`📍 Página atual: ${page}`);
    
    // Verificar sessão do usuário
    if (typeof initSessionCheck === 'function') {
        initSessionCheck();
    } else if (typeof checkUserSession === 'function') {
        checkUserSession();
    }
    
    // Atualizar interface do usuário
    if (typeof updateUserInterface === 'function') {
        setTimeout(updateUserInterface, 500);
    }
    
    // Inicializar funcionalidades específicas da página
    switch(true) {
        case page === 'index.html' || page === '':
            console.log('🏠 Inicializando página principal...');
            if (typeof initApp === 'function') {
                setTimeout(initApp, 1000);
            }
            break;
            
        case page === 'avaliacao.html':
            console.log('⭐ Inicializando página de avaliação...');
            if (typeof initEvaluationPage === 'function') {
                setTimeout(initEvaluationPage, 1000);
            }
            break;
            
        case page === 'empresas.html':
            console.log('🏢 Inicializando página de empresas...');
            if (typeof initCompaniesPage === 'function') {
                setTimeout(initCompaniesPage, 1000);
            }
            break;
    }
    
    // Configurar eventos comuns
    setupCommonEvents();
    
    // Sincronizar empresas do mapa
    if (typeof sincronizarEmpresasDoMapa === 'function') {
        setTimeout(sincronizarEmpresasDoMapa, 2000);
    }
}

function initCompaniesPage() {
    console.log('🏢 Configurando página de empresas...');
    
    // Focar no campo de busca
    setTimeout(() => {
        const filterName = document.getElementById('filter-name');
        if (filterName) {
            filterName.focus();
        }
    }, 500);
    
    // Carregar estatísticas
    if (typeof carregarEstatisticas === 'function') {
        setTimeout(carregarEstatisticas, 1000);
    }
}

function carregarEstatisticas() {
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    
    // Filtrar apenas avaliações não removidas
    const avaliacoesAtivas = evaluations.filter(e => !e.removida && !e.denunciada);
    
    const totalEmpresas = document.getElementById('total-empresas');
    const totalAvaliacoes = document.getElementById('total-avaliacoes');
    const mediaGeral = document.getElementById('media-geral');
    const setores = document.getElementById('setores');
    
    if (totalEmpresas) totalEmpresas.textContent = companies.length;
    if (totalAvaliacoes) totalAvaliacoes.textContent = avaliacoesAtivas.length;
    
    // Calcular média geral apenas das avaliações ativas
    const avg = avaliacoesAtivas.length > 0 ? 
        (avaliacoesAtivas.reduce((sum, e) => sum + e.rating, 0) / avaliacoesAtivas.length).toFixed(1) : '0.0';
    if (mediaGeral) mediaGeral.textContent = avg;
    
    // Contar setores únicos
    const setoresUnicos = [...new Set(companies.map(c => c.sector))].filter(s => s);
    if (setores) setores.textContent = setoresUnicos.length;
    
    console.log('📊 Estatísticas carregadas');
}

function setupCommonEvents() {
    console.log('⚙️ Configurando eventos comuns...');
    
    // Configurar botão de login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof showAuthModal === 'function') {
                showAuthModal(e);
            }
        });
    }
    
    // Configurar botões de fechar modal
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-close')) {
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        }
    });
    
    // Fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
            setTimeout(() => {
                e.target.style.display = 'none';
            }, 300);
        }
    });
    
    // Configurar filtros de empresas
    const filterButton = document.querySelector('button[onclick*="filtrarEmpresas"]');
    if (filterButton) {
        filterButton.onclick = function() {
            if (typeof filtrarEmpresas === 'function') {
                filtrarEmpresas();
            }
        };
    }
}

function filtrarEmpresas() {
    const nameFilter = document.getElementById('filter-name')?.value.toLowerCase().trim();
    const sectorFilter = document.getElementById('filter-sector')?.value;
    const locationFilter = document.getElementById('filter-location')?.value.toLowerCase().trim();
    const sortBy = document.getElementById('filter-sort')?.value;
    
    let companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    let filtered = companies;
    
    // Aplicar filtros
    if (nameFilter) {
        filtered = filtered.filter(c => c.name.toLowerCase().includes(nameFilter));
    }
    
    if (sectorFilter) {
        filtered = filtered.filter(c => c.sector === sectorFilter);
    }
    
    if (locationFilter) {
        filtered = filtered.filter(c => c.location.toLowerCase().includes(locationFilter));
    }
    
    // Ordenar
    switch(sortBy) {
        case 'nome':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'rating-desc':
            filtered.sort((a, b) => b.averageRating - a.averageRating);
            break;
        case 'rating-asc':
            filtered.sort((a, b) => a.averageRating - b.averageRating);
            break;
        case 'avaliacoes-desc':
            filtered.sort((a, b) => b.reviewCount - a.reviewCount);
            break;
        case 'avaliacoes-asc':
            filtered.sort((a, b) => a.reviewCount - b.reviewCount);
            break;
        case 'data-cadastro-desc':
            filtered.sort((a, b) => new Date(b.dataCadastro || 0) - new Date(a.dataCadastro || 0));
            break;
        case 'data-cadastro-asc':
            filtered.sort((a, b) => new Date(a.dataCadastro || 0) - new Date(b.dataCadastro || 0));
            break;
    }
    
    // Exibir empresas
    if (typeof displayCompanies === 'function') {
        displayCompanies(filtered);
    }
    
    const noCompanies = document.getElementById('no-companies');
    if (noCompanies) {
        noCompanies.style.display = filtered.length === 0 ? 'block' : 'none';
    }
    
    showToast(`${filtered.length} empresas encontradas`, 'info');
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM carregado, iniciando sistema...');
    
    // Esconder loading
    setTimeout(() => {
        const loading = document.getElementById('global-loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }, 1000);
    
    // Inicializar navegação mobile
    if (typeof initSmartNavigation === 'function') {
        setTimeout(initSmartNavigation, 300);
    }
    
    // Inicializar página com delay
    setTimeout(initPage, 500);
});

// ==================== EXPORTAÇÃO GLOBAL ====================
window.initPage = initPage;
window.initCompaniesPage = initCompaniesPage;
window.carregarEstatisticas = carregarEstatisticas;
window.filtrarEmpresas = filtrarEmpresas;

console.log('✅ [init] Sistema de inicialização carregado');