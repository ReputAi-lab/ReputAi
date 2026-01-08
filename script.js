// script.js - Configuração principal ATUALIZADA COM SEÇÃO "COMO FUNCIONA"
let currentUser = null;
let userLocation = null;
let locationPermission = false;
let typingInterval = null;
let map = null;
let companies = [];
let evaluationData = null;

// ==================== ANIMAÇÃO DE DIGITAÇÃO ====================
function initTypingEffect() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;
    
    const phrases = [
        "o melhor lugar",
        "a empresa ideal", 
        "seu próximo emprego",
        "sua nova jornada"
    ];
    
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let speed = 100;
    
    function type() {
        const currentPhrase = phrases[phraseIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            speed = 50;
            
            if (charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                setTimeout(type, 500);
                return;
            }
        } else {
            typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            speed = 100;
            
            if (charIndex === currentPhrase.length) {
                isDeleting = true;
                setTimeout(type, 2000);
                return;
            }
        }
        
        typingInterval = setTimeout(type, speed);
    }
    
    if (typingInterval) {
        clearTimeout(typingInterval);
    }
    
    typingInterval = setTimeout(type, 1000);
}

// ==================== MAPA ====================
function initMap() {
    if (document.getElementById('map')) {
        map = L.map('map').setView([-15.7801, -47.9292], 4);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
        
        if (companies.length > 0) {
            addCompaniesToMap(companies);
        }
    }
}

function addCompaniesToMap(companiesArray) {
    if (!map) return;
    
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    
    companiesArray.forEach(company => {
        if (company.lat && company.lng) {
            L.marker([company.lat, company.lng])
                .addTo(map)
                .bindPopup(`
                    <div style="min-width: 200px;">
                        <b>${company.name}</b><br>
                        <small>${company.location}</small><br>
                        <div style="color: #FFD700; margin: 5px 0;">
                            ${'★'.repeat(Math.floor(company.averageRating))}
                            ${'☆'.repeat(5 - Math.floor(company.averageRating))}
                        </div>
                        <small>${company.averageRating.toFixed(1)}/5 (${company.reviewCount} avaliações)</small>
                        <br>
                        <button onclick="showCompanyDetailsFromMap(${company.id})" style="margin-top: 10px; background: #2563eb; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                            Ver Detalhes
                        </button>
                    </div>
                `);
        }
    });
}

function showCompanyDetailsFromMap(companyId) {
    showCompanyDetails(companyId);
}

function locateUser() {
    if (!navigator.geolocation) {
        showToast('Geolocalização não suportada', 'error');
        return;
    }
    
    if (!locationPermission) {
        requestLocationPermission();
        return;
    }
    
    showToast('Obtendo localização...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            if (map) {
                map.setView([userLocation.lat, userLocation.lng], 14);
                
                L.marker([userLocation.lat, userLocation.lng], {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: '<div style="background: #2563eb; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>'
                    })
                }).addTo(map).bindPopup('Você está aqui!');
            }
            
            updateLocationStatus('Localização ativa', true);
            showToast('Localização encontrada!', 'success');
            
            if (typeof getUserLocationName === 'function') {
                getUserLocationName(userLocation.lat, userLocation.lng);
            }
        },
        (error) => {
            console.error('Erro na geolocalização:', error);
            showToast('Erro ao obter localização', 'error');
            updateLocationStatus('Clique para ativar', false);
        }
    );
}

function resetMapView() {
    if (map) {
        map.setView([-15.7801, -47.9292], 4);
        showToast('Mapa redefinido', 'info');
    }
}

// ==================== EMPRESAS ====================
function loadCompanies() {
    const savedCompanies = localStorage.getItem('reputai_companies');
    
    if (savedCompanies) {
        companies = JSON.parse(savedCompanies);
    } else {
        companies = [
            {
                id: 1,
                name: "Magazine Luiza",
                sector: "Varejo",
                location: "São Paulo, SP",
                lat: -23.5505,
                lng: -46.6333,
                description: "Rede varejista brasileira",
                averageRating: 4.2,
                reviewCount: 1245
            },
            {
                id: 2,
                name: "Itaú Unibanco",
                sector: "Finanças",
                location: "São Paulo, SP",
                lat: -23.5500,
                lng: -46.6390,
                description: "Maior banco privado do Brasil",
                averageRating: 3.9,
                reviewCount: 2341
            },
            {
                id: 3,
                name: "Nubank",
                sector: "Finanças",
                location: "São Paulo, SP",
                lat: -23.5489,
                lng: -46.6388,
                description: "Fintech brasileira",
                averageRating: 4.5,
                reviewCount: 1890
            },
            {
                id: 4,
                name: "Petrobras",
                sector: "Energia",
                location: "Rio de Janeiro, RJ",
                lat: -22.9068,
                lng: -43.1729,
                description: "Empresa estatal de petróleo",
                averageRating: 3.2,
                reviewCount: 3120
            }
        ];
        
        localStorage.setItem('reputai_companies', JSON.stringify(companies));
    }
    
    window.companies = companies;
    displayCompanies(companies);
    
    if (map) {
        addCompaniesToMap(companies);
    }
}

function displayCompanies(companiesToShow) {
    const container = document.getElementById('companies-container');
    const noCompanies = document.getElementById('no-companies');
    
    if (!container) return;
    
    if (!companiesToShow || companiesToShow.length === 0) {
        container.innerHTML = '';
        if (noCompanies) noCompanies.style.display = 'block';
        return;
    }
    
    if (noCompanies) noCompanies.style.display = 'none';
    
    container.innerHTML = companiesToShow.map(company => `
        <div class="company-card" onclick="showCompanyDetails(${company.id})">
            <div class="company-header">
                <div class="company-logo">${company.name.substring(0, 2)}</div>
                <div class="company-info">
                    <h4>${company.name}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${company.location}</p>
                </div>
            </div>
            
            <div class="company-body">
                <div class="company-rating">
                    <div class="stars">
                        ${'★'.repeat(Math.floor(company.averageRating))}
                        ${'☆'.repeat(5 - Math.floor(company.averageRating))}
                    </div>
                    <span>${company.averageRating.toFixed(1)}/5 (${company.reviewCount})</span>
                </div>
                
                <p>${company.description}</p>
                
                <div class="company-tags">
                    <span class="tag">${company.sector}</span>
                    <span class="tag">${company.reviewCount} avaliações</span>
                </div>
            </div>
        </div>
    `).join('');
}

function searchCompanies() {
    const searchTerm = document.getElementById('search-company').value.toLowerCase().trim();
    
    if (!searchTerm) {
        displayCompanies(companies);
        if (map) addCompaniesToMap(companies);
        return;
    }
    
    const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm) ||
        company.sector.toLowerCase().includes(searchTerm) ||
        company.location.toLowerCase().includes(searchTerm) ||
        company.description.toLowerCase().includes(searchTerm)
    );
    
    displayCompanies(filtered);
    
    if (map) {
        addCompaniesToMap(filtered);
        if (filtered.length > 0) {
            const bounds = L.latLngBounds(filtered.map(c => [c.lat, c.lng]));
            map.fitBounds(bounds);
        }
    }
}

function filterBySector(sector) {
    const filtered = companies.filter(company => company.sector === sector);
    displayCompanies(filtered);
    
    if (map) {
        addCompaniesToMap(filtered);
        if (filtered.length > 0) {
            const bounds = L.latLngBounds(filtered.map(c => [c.lat, c.lng]));
            map.fitBounds(bounds);
        }
    }
    
    showToast(`Filtrado por: ${sector}`, 'info');
}

// ==================== SISTEMA DE AVALIAÇÃO COM AVISO ====================
function verificarAvaliacao() {
    const companyName = document.getElementById('evaluate-company').value.trim();
    const rating = document.querySelector('input[name="rating"]:checked');
    const text = document.getElementById('evaluation-text').value.trim();
    const sector = document.getElementById('evaluate-sector').value;
    const location = document.getElementById('evaluate-location').value.trim();
    
    if (!currentUser) {
        showToast('Faça login para avaliar', 'info');
        if (typeof showAuthModal === 'function') showAuthModal();
        return;
    }
    
    if (!companyName || !rating || !text) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    if (text.length < 50) {
        showToast('A avaliação deve ter pelo menos 50 caracteres', 'error');
        return;
    }
    
    evaluationData = {
        companyName,
        rating: parseInt(rating.value),
        text,
        sector: sector || "Outros",
        location: location || "Brasil"
    };
    
    showAvisoModal();
}

function showAvisoModal() {
    const modal = document.getElementById('aviso-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        
        document.getElementById('concordar-avisos').checked = false;
        document.getElementById('prosseguir-avaliacao').disabled = true;
        
        modal.addEventListener('click', function(e) {
            if (e.target === this) hideAvisoModal();
        });
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                hideAvisoModal();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }
}

function hideAvisoModal() {
    const modal = document.getElementById('aviso-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function prosseguirAvaliacao() {
    if (!evaluationData) {
        showToast('Erro: Dados da avaliação não encontrados', 'error');
        return;
    }
    
    hideAvisoModal();
    submitEvaluation(evaluationData);
}

function submitEvaluation(evalData) {
    const existingCompany = companies.find(c => 
        c.name.toLowerCase() === evalData.companyName.toLowerCase()
    );
    
    let companyId;
    if (existingCompany) {
        companyId = existingCompany.id;
    } else {
        companyId = companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1;
        const newCompany = {
            id: companyId,
            name: evalData.companyName,
            sector: evalData.sector,
            location: evalData.location,
            lat: -15 + (Math.random() - 0.5) * 20,
            lng: -50 + (Math.random() - 0.5) * 20,
            description: `Empresa cadastrada através de avaliação - Setor: ${evalData.sector}`,
            averageRating: evalData.rating,
            reviewCount: 1,
            cadastradaPor: currentUser.id,
            dataCadastro: new Date().toISOString()
        };
        companies.push(newCompany);
        localStorage.setItem('reputai_companies', JSON.stringify(companies));
        
        showToast(`Empresa "${evalData.companyName}" cadastrada automaticamente!`, 'success');
    }
    
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const newEvaluation = {
        id: evaluations.length > 0 ? Math.max(...evaluations.map(e => e.id)) + 1 : 1,
        companyId: companyId,
        userId: currentUser.id,
        userName: currentUser.name,
        rating: evalData.rating,
        text: evalData.text,
        date: new Date().toISOString(),
        avisoAceito: true,
        termosAceitosEm: new Date().toISOString()
    };
    
    evaluations.push(newEvaluation);
    localStorage.setItem('reputai_evaluations', JSON.stringify(evaluations));
    
    const companyIndex = companies.findIndex(c => c.id === companyId);
    if (companyIndex !== -1) {
        const companyEvals = evaluations.filter(e => e.companyId === companyId);
        const totalRating = companyEvals.reduce((sum, eval) => sum + eval.rating, 0);
        companies[companyIndex].averageRating = totalRating / companyEvals.length;
        companies[companyIndex].reviewCount = companyEvals.length;
        
        localStorage.setItem('reputai_companies', JSON.stringify(companies));
    }
    
    showToast('Avaliação enviada com sucesso!', 'success');
    
    document.getElementById('evaluate-company').value = '';
    document.getElementById('evaluation-text').value = '';
    document.getElementById('evaluate-sector').value = '';
    document.getElementById('evaluate-location').value = '';
    document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);
    
    evaluationData = null;
    
    displayCompanies(companies);
    if (map) {
        addCompaniesToMap(companies);
        
        const newCompany = companies.find(c => c.id === companyId);
        if (newCompany && newCompany.lat && newCompany.lng) {
            map.setView([newCompany.lat, newCompany.lng], 12);
        }
    }
}

function showCompanyDetails(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const companyEvaluations = evaluations.filter(e => e.companyId === companyId);
    
    const modalContent = `
        <div style="max-width: 600px; max-height: 80vh; overflow-y: auto; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--gray-light);">
                <div style="width: 60px; height: 60px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px;">
                    ${company.name.substring(0, 2)}
                </div>
                <div>
                    <h3 style="margin: 0; color: var(--dark);">${company.name}</h3>
                    <p style="margin: 5px 0; color: var(--gray);">
                        <i class="fas fa-map-marker-alt"></i> ${company.location}
                    </p>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="color: #FFD700; font-size: 20px;">
                            ${'★'.repeat(Math.floor(company.averageRating))}
                            ${'☆'.repeat(5 - Math.floor(company.averageRating))}
                        </div>
                        <span style="font-weight: bold; color: var(--dark);">${company.averageRating.toFixed(1)}/5</span>
                        <span style="color: var(--gray);">(${company.reviewCount} avaliações)</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--dark); margin-bottom: 10px;">Descrição</h4>
                <p style="color: var(--text);">${company.description}</p>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <span style="background: var(--gray-light); padding: 5px 10px; border-radius: 20px; font-size: 0.85rem;">
                        ${company.sector}
                    </span>
                    <span style="background: var(--gray-light); padding: 5px 10px; border-radius: 20px; font-size: 0.85rem;">
                        ${company.reviewCount} avaliações
                    </span>
                </div>
            </div>
            
            <div>
                <h4 style="color: var(--dark); margin-bottom: 15px;">
                    Avaliações (${companyEvaluations.length})
                </h4>
                ${companyEvaluations.length > 0 ? 
                    `<div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">
                        ${companyEvaluations.map(eval => `
                            <div style="background: var(--light); padding: 15px; border-radius: var(--radius); margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <strong style="color: var(--dark);">${eval.userName}</strong>
                                    <div style="color: #FFD700;">
                                        ${'★'.repeat(eval.rating)}${'☆'.repeat(5 - eval.rating)}
                                    </div>
                                </div>
                                <p style="color: var(--text); margin-bottom: 8px; font-size: 0.95rem;">${eval.text}</p>
                                <small style="color: var(--gray);">
                                    ${new Date(eval.date).toLocaleDateString('pt-BR')}
                                    ${eval.avisoAceito ? '<i class="fas fa-check-circle" style="color: #10b981; margin-left: 5px;"></i>' : ''}
                                </small>
                            </div>
                        `).join('')}
                    </div>` :
                    `<p style="text-align: center; color: var(--gray); padding: 20px;">
                        Nenhuma avaliação disponível. Seja o primeiro a avaliar!
                    </p>`
                }
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="closeModal()" style="background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

// ==================== COMO FUNCIONA SECTION ====================
function initComoFuncionaSection() {
    const passos = document.querySelectorAll('.passo-card');
    const detalhes = document.querySelectorAll('.detalhe-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    passos.forEach((passo, index) => {
        passo.style.opacity = '0';
        passo.style.transform = 'translateY(20px)';
        passo.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        passo.style.transitionDelay = `${index * 0.2}s`;
        observer.observe(passo);
    });
    
    detalhes.forEach((detalhe, index) => {
        detalhe.style.opacity = '0';
        detalhe.style.transform = 'translateY(20px)';
        detalhe.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        detalhe.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(detalhe);
    });
}

function scrollToComoFunciona() {
    const section = document.getElementById('como-funciona');
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        section.style.animation = 'highlight 2s ease';
        
        setTimeout(() => {
            section.style.animation = '';
        }, 2000);
    }
}

// Adicionar estilo CSS para highlight
const highlightStyle = document.createElement('style');
highlightStyle.textContent = `
    @keyframes highlight {
        0% { background-color: transparent; }
        50% { background-color: rgba(37, 99, 235, 0.1); }
        100% { background-color: transparent; }
    }
    
    #como-funciona {
        scroll-margin-top: 80px;
    }
`;
document.head.appendChild(highlightStyle);

// ==================== MODAL GENERICO ====================
function showModal(content) {
    closeModal();
    
    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            ${content}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => modal.classList.add('active'), 10);
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// ==================== UTILITÁRIOS ====================
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

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    const colors = {
        success: '#10b981',
        error: '#dc2626',
        info: '#3b82f6'
    };
    
    toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
    toast.style.background = colors[type] || colors.info;
    toast.className = 'toast show';
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function requestLocationPermission() {
    if (!navigator.geolocation) {
        showToast('Geolocalização não suportada', 'error');
        return;
    }
    
    showToast('Solicitando permissão...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            locationPermission = true;
            localStorage.setItem('reputai_location_permission', 'granted');
            showToast('Localização ativada!', 'success');
            updateLocationStatus('Localização ativa', true);
            locateUser();
        },
        (error) => {
            console.error('Erro na permissão:', error);
            locationPermission = false;
            localStorage.setItem('reputai_location_permission', 'denied');
            showToast('Permissão negada', 'error');
            updateLocationStatus('Clique para ativar', false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function updateLocationStatus(message, isActive) {
    const statusElement = document.getElementById('location-text');
    if (statusElement) {
        statusElement.innerHTML = `
            <i class="fas fa-${isActive ? 'check-circle' : 'map-marker-alt'}" 
               style="color: ${isActive ? 'var(--success)' : 'var(--gray)'}"></i>
            ${message}
        `;
        
        const btn = document.querySelector('.btn-location');
        if (btn) {
            if (isActive) {
                btn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar';
                btn.onclick = locateUser;
            } else {
                btn.innerHTML = '<i class="fas fa-crosshairs"></i> Ativar';
                btn.onclick = requestLocationPermission;
            }
        }
    }
}

function checkLocationPermission() {
    const permission = localStorage.getItem('reputai_location_permission');
    if (permission === 'granted') {
        locationPermission = true;
        updateLocationStatus('Localização ativa', true);
    }
}

// ==================== INICIALIZAÇÃO ====================
function initApp() {
    initTypingEffect();
    initMap();
    loadCompanies();
    initComoFuncionaSection();
    checkLocationPermission();
    
    const savedLocation = localStorage.getItem('user_location');
    if (savedLocation) {
        try {
            userLocation = JSON.parse(savedLocation);
            updateLocationStatus('Localização salva', true);
        } catch (e) {
            console.error('Erro ao carregar localização:', e);
        }
    }
}

// ==================== FUNÇÕES AUXILIARES PARA MAPA ====================
function getUserLocationName(lat, lng) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`)
        .then(response => response.json())
        .then(data => {
            if (data.address) {
                let locationName = '';
                if (data.address.city || data.address.town) {
                    locationName = data.address.city || data.address.town;
                } else if (data.address.state) {
                    locationName = data.address.state;
                } else if (data.address.country) {
                    locationName = data.address.country;
                }
                
                if (locationName) {
                    document.getElementById('current-location').textContent = locationName;
                    document.getElementById('location-info').style.display = 'block';
                    
                    localStorage.setItem('user_location', JSON.stringify({
                        lat: lat,
                        lng: lng,
                        name: locationName
                    }));
                }
            }
        })
        .catch(error => {
            console.error('Erro ao obter nome da localização:', error);
            document.getElementById('current-location').textContent = 
                `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
            document.getElementById('location-info').style.display = 'block';
        });
}

// ==================== EXPORTAR FUNÇÕES GLOBAIS ====================
window.scrollToElement = scrollToElement;
window.scrollToTop = scrollToTop;
window.searchCompanies = searchCompanies;
window.filterBySector = filterBySector;
window.verificarAvaliacao = verificarAvaliacao;
window.locateUser = locateUser;
window.resetMapView = resetMapView;
window.requestLocationPermission = requestLocationPermission;
window.showCompanyDetails = showCompanyDetails;
window.showAdminPanel = showAdminPanel;
window.closeModal = closeModal;
window.hideAvisoModal = hideAvisoModal;
window.prosseguirAvaliacao = prosseguirAvaliacao;
window.showCompanyDetailsFromMap = showCompanyDetailsFromMap;
window.scrollToComoFunciona = scrollToComoFunciona;