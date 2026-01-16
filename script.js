// script.js - Sistema principal do ReputAí
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
    console.log(`📢 Toast [${type}]: ${message}`);
    
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('⚠️ Elemento toast não encontrado');
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
        setTimeout(() => {
            modal.remove();
        }, 300);
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

// ==================== ANIMAÇÃO DE DIGITAÇÃO ====================
function initTypingEffect() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;
    
    const phrases = [
        "o melhor lugar",
        "a equipe ideal", 
        "a melhor empresa",
        "a cultura ideal",
        "o ambiente perfeito"
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
    
    if (typingInterval) clearTimeout(typingInterval);
    typingInterval = setTimeout(type, 1000);
}

// ==================== MAPA ====================
function initMap() {
    if (!document.getElementById('map')) return;
    
    try {
        map = L.map('map').setView([-15.7801, -47.9292], 4);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        console.log('🗺️ Mapa inicializado com sucesso');
        
        // Adicionar empresas se existirem
        if (companies.length > 0) {
            addCompaniesToMap(companies);
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar mapa:', error);
        document.getElementById('map').innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: var(--gray-light); border-radius: var(--radius);">
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;"></i>
                    <h3>Mapa indisponível</h3>
                    <p>O mapa não pôde ser carregado. Verifique sua conexão.</p>
                </div>
            </div>
        `;
    }
}

function addCompaniesToMap(companiesArray) {
    if (!map || !companiesArray || companiesArray.length === 0) return;
    
    // Limpar marcadores anteriores
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    
    companiesArray.forEach(company => {
        if (company.lat && company.lng) {
            const marker = L.marker([company.lat, company.lng])
                .addTo(map)
                .bindPopup(`
                    <div style="min-width: 250px;" class="company-marker-popup">
                        <h4 style="margin: 0 0 10px 0; color: var(--dark);">${company.name}</h4>
                        <p style="margin: 5px 0; color: var(--gray);">
                            <i class="fas fa-map-marker-alt"></i> ${company.location}
                        </p>
                        <div style="color: #FFD700; margin: 10px 0; font-size: 16px;">
                            ${'★'.repeat(Math.floor(company.averageRating))}
                            ${'☆'.repeat(5 - Math.floor(company.averageRating))}
                        </div>
                        <p style="margin: 5px 0; color: var(--gray);">
                            ${company.averageRating.toFixed(1)}/5 (${company.reviewCount} avaliações)
                        </p>
                        <p style="margin: 5px 0; color: var(--gray);">
                            <i class="fas fa-industry"></i> ${company.sector}
                        </p>
                        <button onclick="showCompanyDetails(${company.id}); return false;" 
                                style="width: 100%; margin-top: 10px; padding: 8px; background: var(--primary); 
                                       color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-info-circle"></i> Ver Detalhes
                        </button>
                    </div>
                `);
        }
    });
    
    console.log(`📍 ${companiesArray.length} empresas adicionadas ao mapa`);
}

function locateUser() {
    if (!navigator.geolocation) {
        showToast('Geolocalização não suportada neste navegador', 'error');
        return;
    }
    
    if (!locationPermission) {
        requestLocationPermission();
        return;
    }
    
    showToast('Obtendo sua localização...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            if (map) {
                map.setView([userLocation.lat, userLocation.lng], 14);
                
                // Adicionar marcador do usuário
                L.marker([userLocation.lat, userLocation.lng], {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: '<div style="background: #2563eb; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>'
                    })
                }).addTo(map).bindPopup('Você está aqui!').openPopup();
                
                // Buscar empresas próximas
                findNearbyCompanies(userLocation.lat, userLocation.lng);
            }
            
            updateLocationStatus('Localização ativa', true);
            showToast('Localização encontrada!', 'success');
        },
        (error) => {
            console.error('Erro na geolocalização:', error);
            showToast('Não foi possível obter sua localização', 'error');
            updateLocationStatus('Clique para ativar', false);
        },
        { 
            enableHighAccuracy: true, 
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function findNearbyCompanies(lat, lng, radiusKm = 50) {
    if (!companies || companies.length === 0) return [];
    
    const nearbyCompanies = companies.filter(company => {
        if (!company.lat || !company.lng) return false;
        
        const R = 6371; // Raio da Terra em km
        const dLat = (company.lat - lat) * Math.PI / 180;
        const dLon = (company.lng - lng) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(company.lat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance <= radiusKm;
    });
    
    if (nearbyCompanies.length > 0) {
        showToast(`Encontradas ${nearbyCompanies.length} empresas próximas`, 'success');
        displayCompanies(nearbyCompanies.slice(0, 8));
    }
    
    return nearbyCompanies;
}

function resetMapView() {
    if (map) {
        map.setView([-15.7801, -47.9292], 4);
        showToast('Mapa redefinido', 'info');
    }
}

function requestLocationPermission() {
    if (!navigator.geolocation) {
        showToast('Seu navegador não suporta geolocalização', 'error');
        return;
    }
    
    showToast('Solicitando permissão de localização...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        () => {
            locationPermission = true;
            setStorageItem('reputai_location_permission', 'granted');
            showToast('Permissão concedida!', 'success');
            updateLocationStatus('Localização ativa', true);
            locateUser();
        },
        (error) => {
            console.error('Permissão negada:', error);
            locationPermission = false;
            setStorageItem('reputai_location_permission', 'denied');
            showToast('Permissão de localização negada', 'error');
            updateLocationStatus('Permissão negada', false);
        },
        { enableHighAccuracy: false }
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
            btn.innerHTML = isActive ? 
                '<i class="fas fa-sync-alt"></i> Atualizar' : 
                '<i class="fas fa-crosshairs"></i> Ativar';
            btn.onclick = isActive ? locateUser : requestLocationPermission;
        }
    }
}

// ==================== EMPRESAS ====================
function loadCompanies() {
    const savedCompanies = getStorageItem('reputai_companies');
    
    if (savedCompanies && savedCompanies.length > 0) {
        companies = savedCompanies;
        console.log(`🏢 ${companies.length} empresas carregadas do storage`);
    } else {
        // Empresas padrão
        companies = [
            {
                id: 1, name: "Magazine Luiza", sector: "Varejo", location: "São Paulo, SP",
                lat: -23.5505, lng: -46.6333, averageRating: 4.2, reviewCount: 1245,
                description: "Uma das maiores redes varejistas do Brasil"
            },
            {
                id: 2, name: "Itaú Unibanco", sector: "Finanças", location: "São Paulo, SP",
                lat: -23.5500, lng: -46.6390, averageRating: 3.9, reviewCount: 2341,
                description: "Maior banco privado da América Latina"
            },
            {
                id: 3, name: "McDonald's", sector: "Alimentação", location: "São Paulo, SP",
                lat: -23.5631, lng: -46.6560, averageRating: 3.5, reviewCount: 1890,
                description: "Rede mundial de fast food"
            }
        ];
        
        setStorageItem('reputai_companies', companies);
        console.log(`🏢 ${companies.length} empresas padrão criadas`);
    }
    
    window.companies = companies;
    return companies;
}

function loadHomeCompanies() {
    const allCompanies = loadCompanies();
    const homeCompanies = allCompanies.slice(0, 6);
    displayCompanies(homeCompanies);
    
    if (map) {
        addCompaniesToMap(homeCompanies);
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
                
                <p>${company.description || 'Empresa cadastrada na plataforma ReputAí'}</p>
                
                <div class="company-tags">
                    <span class="tag">${company.sector}</span>
                    <span class="tag">${company.reviewCount} avaliações</span>
                </div>
            </div>
        </div>
    `).join('');
}

function searchCompanies() {
    const searchTerm = document.getElementById('search-company')?.value.toLowerCase().trim();
    
    if (!searchTerm) {
        loadHomeCompanies();
        return;
    }
    
    const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm) ||
        company.sector.toLowerCase().includes(searchTerm) ||
        company.location.toLowerCase().includes(searchTerm) ||
        (company.description && company.description.toLowerCase().includes(searchTerm))
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

function showCompanyDetails(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) {
        showToast('Empresa não encontrada', 'error');
        return;
    }
    
    const evaluations = getStorageItem('reputai_evaluations') || [];
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
                <p style="color: var(--text);">${company.description || 'Empresa cadastrada na plataforma ReputAí'}</p>
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
                ${window.currentUser ? `
                    <button onclick="window.location.href='avaliacao.html'; closeModal();" style="background: var(--success); color: white; border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer; font-weight: 500; margin-left: 10px;">
                        <i class="fas fa-star"></i> Avaliar esta empresa
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

// ==================== AVALIAÇÃO ====================
function initEvaluationPage() {
    console.log('⭐ Inicializando página de avaliação...');
    
    // Inicializar campos opcionais
    if (typeof initOptionalFields === 'function') {
        setTimeout(initOptionalFields, 500);
    }
    
    // Adicionar mensagem de cadastro automático
    const evaluateCompanyInput = document.getElementById('evaluate-company');
    if (evaluateCompanyInput && !document.querySelector('.auto-register-notice')) {
        const notice = document.createElement('div');
        notice.className = 'auto-register-notice';
        notice.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>Empresa não encontrada?</strong> 
                <p style="margin: 5px 0 0 0; font-size: 0.9rem;">
                    Digite o nome completo e ela será cadastrada automaticamente para todos os usuários!
                    <br><small>Ex: "Nome da Empresa Ltda", "Restaurante Tal", "Loja X"</small>
                </p>
            </div>
        `;
        evaluateCompanyInput.parentNode.insertBefore(notice, evaluateCompanyInput.nextSibling);
    }
}

function verificarAvaliacao() {
    if (!window.currentUser) {
        showToast('Faça login para avaliar uma empresa', 'info');
        showAuthModal();
        return;
    }
    
    const companyName = document.getElementById('evaluate-company').value.trim();
    const rating = document.querySelector('input[name="rating"]:checked');
    const text = document.getElementById('evaluation-text').value.trim();
    
    if (!companyName || !rating || !text) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    if (text.length < 50) {
        showToast('A avaliação deve ter pelo menos 50 caracteres', 'error');
        return;
    }
    
    showAvisoModal();
}

function showAvisoModal() {
    const modal = document.getElementById('aviso-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        
        const checkbox = document.getElementById('concordar-avisos');
        const button = document.getElementById('prosseguir-avaliacao');
        
        if (checkbox && button) {
            checkbox.checked = false;
            button.disabled = true;
            
            checkbox.onchange = function() {
                button.disabled = !this.checked;
            };
        }
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
    const companyName = document.getElementById('evaluate-company').value.trim();
    const rating = parseInt(document.querySelector('input[name="rating"]:checked').value);
    const text = document.getElementById('evaluation-text').value.trim();
    const sector = document.getElementById('evaluate-sector')?.value || "Outros";
    const location = document.getElementById('evaluate-location')?.value.trim() || "Brasil";
    
    // Criar avaliação
    const evaluation = {
        id: Date.now(),
        companyName: companyName,
        rating: rating,
        text: text,
        sector: sector,
        location: location,
        userId: window.currentUser.id,
        userName: window.currentUser.name,
        date: new Date().toISOString(),
        avisoAceito: true
    };
    
    // Salvar avaliação
    const evaluations = getStorageItem('reputai_evaluations') || [];
    evaluations.push(evaluation);
    setStorageItem('reputai_evaluations', evaluations);
    
    // Atualizar empresa ou criar nova
    const companies = getStorageItem('reputai_companies') || [];
    let company = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
    
    if (!company) {
        // Criar nova empresa
        company = {
            id: companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1,
            name: companyName,
            sector: sector,
            location: location,
            lat: -15 + (Math.random() - 0.5) * 20,
            lng: -50 + (Math.random() - 0.5) * 20,
            averageRating: rating,
            reviewCount: 1,
            description: `Empresa cadastrada através de avaliação - Setor: ${sector}`
        };
        companies.push(company);
    } else {
        // Atualizar empresa existente
        const companyEvaluations = evaluations.filter(e => 
            e.companyName.toLowerCase() === companyName.toLowerCase()
        );
        const totalRating = companyEvaluations.reduce((sum, e) => sum + e.rating, 0);
        company.averageRating = totalRating / companyEvaluations.length;
        company.reviewCount = companyEvaluations.length;
    }
    
    setStorageItem('reputai_companies', companies);
    
    // Fechar modal e mostrar sucesso
    hideAvisoModal();
    showToast('✅ Avaliação enviada com sucesso!', 'success');
    
    // Limpar formulário
    document.getElementById('evaluate-company').value = '';
    document.getElementById('evaluate-sector').value = '';
    document.getElementById('evaluate-location').value = '';
    document.getElementById('evaluation-text').value = '';
    document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);
    
    // Redirecionar para home após 2 segundos
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// ==================== FUNÇÕES PARA CAMPOS OPCIONAIS ====================
function initOptionalFields() {
    console.log('⚙️ Inicializando campos opcionais...');
    
    // Ambiente
    document.querySelectorAll('.ambient-option').forEach(option => {
        option.addEventListener('click', function() {
            selectAmbientOption(this);
        });
    });
    
    // Benefícios
    document.querySelectorAll('.benefit-checkbox').forEach(benefit => {
        benefit.addEventListener('click', function() {
            toggleBenefit(this);
        });
    });
    
    // Salário
    const salaryInput = document.getElementById('salary-amount');
    const salarySelect = document.getElementById('salary-period');
    
    if (salaryInput) {
        salaryInput.addEventListener('input', function(e) {
            salaryAmount = e.target.value;
            saveEvaluationDraft();
        });
    }
    
    if (salarySelect) {
        salarySelect.addEventListener('change', function(e) {
            salaryPeriod = e.target.value;
            saveEvaluationDraft();
        });
    }
    
    // Carregar rascunho
    loadEvaluationDraft();
    
    // Benefício customizado
    const customBenefitInput = document.getElementById('custom-benefit');
    if (customBenefitInput) {
        customBenefitInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addCustomBenefit();
                e.preventDefault();
            }
        });
    }
}

function selectAmbientOption(element) {
    document.querySelectorAll('.ambient-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedAmbient = element.getAttribute('data-value');
    saveEvaluationDraft();
}

function toggleBenefit(element) {
    const benefit = element.getAttribute('data-value');
    if (element.classList.contains('selected')) {
        element.classList.remove('selected');
        selectedBenefits = selectedBenefits.filter(b => b !== benefit);
    } else {
        element.classList.add('selected');
        selectedBenefits.push(benefit);
    }
    saveEvaluationDraft();
}

function addCustomBenefit() {
    const input = document.getElementById('custom-benefit');
    const benefit = input.value.trim();
    
    if (benefit && !customBenefits.includes(benefit) && !selectedBenefits.includes(benefit)) {
        customBenefits.push(benefit);
        updateCustomBenefitsList();
        input.value = '';
        saveEvaluationDraft();
        showToast('Benefício adicionado!', 'success');
    } else if (!benefit) {
        showToast('Digite um benefício', 'error');
    } else {
        showToast('Este benefício já foi adicionado', 'info');
    }
}

function removeCustomBenefit(benefit) {
    const index = customBenefits.indexOf(benefit);
    if (index !== -1) {
        customBenefits.splice(index, 1);
        updateCustomBenefitsList();
        saveEvaluationDraft();
        showToast('Benefício removido', 'info');
    }
}

function updateCustomBenefitsList() {
    const list = document.getElementById('custom-benefits-list');
    if (list) {
        list.innerHTML = customBenefits.map(benefit => `
            <div class="custom-benefit-tag">
                ${benefit}
                <button onclick="removeCustomBenefit('${benefit}')">&times;</button>
            </div>
        `).join('');
    }
}

function saveEvaluationDraft() {
    const draft = {
        companyName: document.getElementById('evaluate-company')?.value || '',
        sector: document.getElementById('evaluate-sector')?.value || '',
        location: document.getElementById('evaluate-location')?.value || '',
        text: document.getElementById('evaluation-text')?.value || '',
        salaryAmount,
        salaryPeriod,
        selectedAmbient,
        selectedBenefits,
        customBenefits,
        savedAt: new Date().toISOString()
    };
    
    setStorageItem('reputai_evaluation_draft', draft);
}

function loadEvaluationDraft() {
    const draft = getStorageItem('reputai_evaluation_draft');
    
    if (draft) {
        if (draft.companyName) document.getElementById('evaluate-company').value = draft.companyName;
        if (draft.sector) document.getElementById('evaluate-sector').value = draft.sector;
        if (draft.location) document.getElementById('evaluate-location').value = draft.location;
        if (draft.text) document.getElementById('evaluation-text').value = draft.text;
        
        if (draft.selectedAmbient) {
            const element = document.querySelector(`.ambient-option[data-value="${draft.selectedAmbient}"]`);
            if (element) selectAmbientOption(element);
        }
        
        if (draft.selectedBenefits) {
            draft.selectedBenefits.forEach(benefit => {
                const element = document.querySelector(`.benefit-checkbox[data-value="${benefit}"]`);
                if (element) toggleBenefit(element);
            });
        }
        
        if (draft.customBenefits) {
            customBenefits = draft.customBenefits;
            updateCustomBenefitsList();
        }
        
        if (draft.salaryAmount) {
            document.getElementById('salary-amount').value = draft.salaryAmount;
            salaryAmount = draft.salaryAmount;
        }
        if (draft.salaryPeriod) {
            document.getElementById('salary-period').value = draft.salaryPeriod;
            salaryPeriod = draft.salaryPeriod;
        }
        
        showToast('Rascunho da avaliação carregado', 'info');
    }
}

// ==================== EMPRESAS DO MAPA ====================
function buscarEmpresasDoMapa() {
    return [
        {
            id: 16, name: "Mercado Municipal de São Paulo", sector: "Alimentação",
            location: "São Paulo, SP", lat: -23.5414, lng: -46.6340,
            averageRating: 4.5, reviewCount: 890
        },
        {
            id: 17, name: "Shopping Iguatemi São Paulo", sector: "Varejo",
            location: "São Paulo, SP", lat: -23.5779, lng: -46.6888,
            averageRating: 4.3, reviewCount: 670
        }
    ];
}

function sincronizarEmpresasDoMapa() {
    const empresasExistentes = getStorageItem('reputai_companies') || [];
    const empresasMapa = buscarEmpresasDoMapa();
    
    let novasEmpresas = 0;
    
    empresasMapa.forEach(empresaMapa => {
        const existe = empresasExistentes.some(e => 
            e.name.toLowerCase() === empresaMapa.name.toLowerCase()
        );
        
        if (!existe) {
            empresaMapa.id = empresasExistentes.length > 0 ? 
                Math.max(...empresasExistentes.map(e => e.id)) + 1 : 1;
            empresasExistentes.push(empresaMapa);
            novasEmpresas++;
        }
    });
    
    if (novasEmpresas > 0) {
        setStorageItem('reputai_companies', empresasExistentes);
        showToast(`${novasEmpresas} novas empresas sincronizadas do mapa!`, 'success');
        console.log(`✅ ${novasEmpresas} empresas sincronizadas`);
    }
    
    return empresasExistentes;
}

// ==================== INICIALIZAÇÃO DA APLICAÇÃO ====================
function initApp() {
    console.log('🚀 Inicializando aplicação...');
    
    // Inicializar animação de digitação
    initTypingEffect();
    
    // Inicializar mapa
    initMap();
    
    // Carregar empresas
    loadHomeCompanies();
    
    // Verificar permissão de localização
    const savedPermission = getStorageItem('reputai_location_permission');
    if (savedPermission === 'granted') {
        locationPermission = true;
        updateLocationStatus('Localização ativa', true);
    }
    
    // Configurar eventos de busca
    const searchInput = document.getElementById('search-company');
    const searchButton = document.querySelector('.btn-search');
    
    if (searchInput && searchButton) {
        searchButton.onclick = searchCompanies;
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchCompanies();
        });
    }
    
    console.log('✅ Aplicação inicializada com sucesso');
}

// ==================== EXPORTAÇÃO GLOBAL ====================
window.scrollToElement = scrollToElement;
window.scrollToTop = scrollToTop;
window.searchCompanies = searchCompanies;
window.filterBySector = filterBySector;
window.verificarAvaliacao = verificarAvaliacao;
window.locateUser = locateUser;
window.resetMapView = resetMapView;
window.requestLocationPermission = requestLocationPermission;
window.showCompanyDetails = showCompanyDetails;
window.closeModal = closeModal;
window.hideAvisoModal = hideAvisoModal;
window.prosseguirAvaliacao = prosseguirAvaliacao;
window.initApp = initApp;
window.showToast = showToast;
window.showModal = showModal;
window.initEvaluationPage = initEvaluationPage;
window.selectAmbientOption = selectAmbientOption;
window.toggleBenefit = toggleBenefit;
window.addCustomBenefit = addCustomBenefit;
window.removeCustomBenefit = removeCustomBenefit;
window.updateCustomBenefitsList = updateCustomBenefitsList;
window.saveEvaluationDraft = saveEvaluationDraft;
window.loadEvaluationDraft = loadEvaluationDraft;
window.sincronizarEmpresasDoMapa = sincronizarEmpresasDoMapa;
window.buscarEmpresasDoMapa = buscarEmpresasDoMapa;

// Verificar se as funções de storage estão disponíveis
if (!window.getStorageItem) {
    window.getStorageItem = function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            return null;
        }
    };
}

if (!window.setStorageItem) {
    window.setStorageItem = function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    };
}

console.log('✅ [script] Sistema principal carregado');