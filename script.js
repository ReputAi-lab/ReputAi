console.log('🚀 [script] Sistema principal carregando...');

// ==================== VARIÁVEIS GLOBAIS ====================
let userLocation = null;
let locationPermission = false;
let typingInterval = null;
let map = null;
let companies = [];
let evaluationData = null;
let selectedAmbient = null;
let selectedBenefits = [];
let customBenefits = [];
let salaryAmount = '';
let salaryPeriod = 'mensal';

// ==================== FUNÇÕES DE UTILIDADE ====================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

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
    closeModal();

    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="position: relative;">
            <button class="modal-close" onclick="closeModal()">&times;</button>
            ${content}
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    setTimeout(() => modal.classList.add('active'), 10);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function scrollToTop(e) {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== NAVEGAÇÃO MOBILE ====================
function initSmartNavigation() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop) {
            header.style.top = '-80px';
        } else {
            header.style.top = '0';
        }
        lastScrollTop = scrollTop;
    });
}

// ==================== MAPA ====================
let userMarker = null;
let companyMarkers = [];

function initMap() {
    console.log('🗺️ Inicializando mapa...');
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    try {
        map = L.map('map').setView([-14.2350, -51.9253], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        loadCompaniesOnMap();

    } catch (error) {
        console.error('❌ Erro ao inicializar mapa:', error);
        showToast('Erro ao carregar o mapa', 'error');
    }
}

function loadCompaniesOnMap() {
    if (!map) return;

    companyMarkers.forEach(marker => marker.remove());
    companyMarkers = [];

    companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');

    companies.forEach(company => {
        if (company.lat && company.lng) {
            const marker = L.marker([company.lat, company.lng]).addTo(map)
                .bindPopup(`<b>${company.name}</b><br>${company.location}<br>Nota: ${company.averageRating || 'N/A'}`);
            companyMarkers.push(marker);
        }
    });
}

function requestLocationPermission() {
    if (locationPermission) {
        locateUser();
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            () => {
                locationPermission = true;
                localStorage.setItem('reputai_location_permission', 'granted');
                locateUser();
            },
            () => {
                showToast('Permissão de localização negada', 'warning');
            }
        );
    } else {
        showToast('Geolocalização não suportada', 'error');
    }
}

function locateUser() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            userLocation = [lat, lng];

            if (userMarker) userMarker.remove();
            userMarker = L.marker(userLocation).addTo(map)
                .bindPopup('Você está aqui!').openPopup();

            map.setView(userLocation, 13);
            showToast('Localização encontrada!', 'success');
        },
        error => {
            showToast('Erro ao obter localização', 'error');
        }
    );
}

function resetMapView() {
    if (map) {
        map.setView([-14.2350, -51.9253], 4);
        if (userMarker) userMarker.remove();
        showToast('Vista resetada', 'info');
    }
}

// ==================== BUSCA E FILTROS ====================
function searchCompanies() {
    const query = document.getElementById('search-company').value.toLowerCase();
    const filtered = companies.filter(c => c.name.toLowerCase().includes(query));
    displayCompanies(filtered);
}

function filterBySector(sector) {
    const filtered = companies.filter(c => c.sector === sector);
    displayCompanies(filtered);
    scrollToElement('#empresas-proximas');
}

function displayCompanies(list) {
    const container = document.getElementById('companies-list');
    if (!container) return;

    container.innerHTML = '';

    list.forEach(company => {
        const card = document.createElement('div');
        card.className = 'company-card';
        card.innerHTML = `
            <div class="company-header">
                <h3 class="company-name">${company.name}</h3>
                <div class="company-rating">
                    <i class="fas fa-star"></i> ${company.averageRating || 'N/A'}
                </div>
            </div>
            <p class="company-location"><i class="fas fa-map-marker-alt"></i> ${company.location}</p>
            <p class="company-description">${company.description || 'Descrição não disponível'}</p>
            <div class="company-footer">
                <span>Setor: ${company.sector}</span>
                <span>Avaliações: ${company.reviewCount || 0}</span>
            </div>
            <div class="company-actions">
                <a href="avaliacao.html" class="btn-avaliar">Avaliar</a>
                <button onclick="showCompanyDetails('${company.id}')">Detalhes</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==================== AVALIAÇÃO ====================
function initEvaluationPage() {
    loadEvaluationDraft();
    // Configurar eventos para selectAmbientOption, toggleBenefit, etc.
}

function selectAmbientOption(option) {
    selectedAmbient = option;
    document.querySelectorAll('.ambient-option').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.ambient-option[onclick="selectAmbientOption('${option}')"]`).classList.add('selected');
}

function toggleBenefit(benefit) {
    const index = selectedBenefits.indexOf(benefit);
    if (index > -1) selectedBenefits.splice(index, 1);
    else selectedBenefits.push(benefit);
    // Atualizar UI
}

function addCustomBenefit() {
    const input = document.getElementById('custom-benefit');
    if (input.value) {
        customBenefits.push(input.value);
        updateCustomBenefitsList();
        input.value = '';
    }
}

function removeCustomBenefit(index) {
    customBenefits.splice(index, 1);
    updateCustomBenefitsList();
}

function updateCustomBenefitsList() {
    const list = document.getElementById('custom-benefits-list');
    list.innerHTML = '';
    customBenefits.forEach((benefit, index) => {
        const tag = document.createElement('div');
        tag.className = 'custom-benefit-tag';
        tag.innerHTML = `${benefit} <i class="fas fa-times remove-custom" onclick="removeCustomBenefit(${index})"></i>`;
        list.appendChild(tag);
    });
}

function saveEvaluationDraft() {
    const draft = {
        company: document.getElementById('company-name').value,
        rating: /* get rating */,
        ambient: selectedAmbient,
        benefits: selectedBenefits,
        customBenefits,
        salary: { amount: salaryAmount, period: salaryPeriod },
        text: document.getElementById('review-text').value,
        anonimo: document.getElementById('anonimo').checked
    };
    localStorage.setItem('reputai_evaluation_draft', JSON.stringify(draft));
    showToast('Rascunho salvo!', 'success');
}

function loadEvaluationDraft() {
    const draft = JSON.parse(localStorage.getItem('reputai_evaluation_draft'));
    if (draft) {
        document.getElementById('company-name').value = draft.company;
        // Set rating, ambient, etc.
        selectedBenefits = draft.benefits;
        customBenefits = draft.customBenefits;
        updateCustomBenefitsList();
        salaryAmount = draft.salary.amount;
        salaryPeriod = draft.salary.period;
        document.getElementById('review-text').value = draft.text;
        document.getElementById('anonimo').checked = draft.anonimo;
        showToast('Rascunho carregado!', 'info');
    }
}

// ==================== ADMIN FUNCTIONS ====================
const SUPER_ADMIN_EMAIL = "gusta2206@admin.com";

function isSuperAdmin() {
    return window.currentUser && window.currentUser.email === SUPER_ADMIN_EMAIL;
}

function promoteToAdmin(userEmail) {
    if (!isSuperAdmin()) return showToast('Acesso negado', 'error');

    // Lógica para promover
    showToast(`${userEmail} promovido a admin`, 'success');
}

function demoteFromAdmin(userEmail) {
    if (!isSuperAdmin()) return showToast('Acesso negado', 'error');

    // Lógica para demover
    showToast(`${userEmail} removido como admin`, 'success');
}

function loadStats() {
    // Carregar stats de localStorage ou Firestore
    document.getElementById('total-users').textContent = /* calc */;
    // etc.
}

function loadAuditLog() {
    // Carregar logs
}

function clearAllData() {
    if (confirm('Limpar tudo?')) {
        localStorage.clear();
        showToast('Dados limpos', 'success');
    }
}

function exportAllData() {
    const data = {
        // Coletar dados
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reputai_backup.json';
    a.click();
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    initSessionCheck();
    updateUserInterface();
    initSmartNavigation();
    initApp();
    initMap();
});

// ==================== EXPORTAÇÕES ====================
window.showToast = showToast;
window.showModal = showModal;
window.closeModal = closeModal;
window.scrollToElement = scrollToElement;
window.scrollToTop = scrollToTop;
window.searchCompanies = searchCompanies;
window.filterBySector = filterBySector;
window.requestLocationPermission = requestLocationPermission;
window.resetMapView = resetMapView;
window.selectAmbientOption = selectAmbientOption;
window.toggleBenefit = toggleBenefit;
window.addCustomBenefit = addCustomBenefit;
window.removeCustomBenefit = removeCustomBenefit;
window.updateCustomBenefitsList = updateCustomBenefitsList;
window.saveEvaluationDraft = saveEvaluationDraft;
window.loadEvaluationDraft = loadEvaluationDraft;
window.initSmartNavigation = initSmartNavigation;
window.initApp = initApp;
window.initEvaluationPage = initEvaluationPage;
window.promoteToAdmin = promoteToAdmin;
window.demoteFromAdmin = demoteFromAdmin;
window.exportAllData = exportAllData;
window.clearAllData = clearAllData;

console.log('✅ [script] Sistema principal carregado');