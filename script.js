// script.js - Sistema principal completo do ReputAí
console.log('🚀 [script] Sistema principal carregando...');

// ==================== VARIÁVEIS GLOBAIS ====================
let userLocation = null;
let locationPermission = false;
let typingInterval = null;
let map = null;
let companies = [];
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
    // Fecha modal existente
    closeModal();
    
    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="position: relative; background: white; border-radius: var(--radius); max-width: 90%; max-height: 90vh; overflow: hidden;">
            <button class="modal-close" onclick="closeModal()" style="position: absolute; top: 15px; right: 15px; z-index: 10;">&times;</button>
            ${content}
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Fecha ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Fecha com ESC
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

// ==================== NAVEGAÇÃO MOBILE INTELIGENTE ====================
function initSmartNavigation() {
    const header = document.querySelector('header');
    if (!header) return;
    
    let lastScrollTop = 0;
    let scrollTimeout = null;
    const mobileBreakpoint = 768;
    
    window.addEventListener('scroll', function() {
        if (window.innerWidth <= mobileBreakpoint) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDelta = 10;
            
            if (Math.abs(scrollTop - lastScrollTop) > scrollDelta) {
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    // Rolando para baixo - esconde header
                    header.classList.add('hide');
                } else {
                    // Rolando para cima - mostra header
                    header.classList.remove('hide');
                }
            }
            
            lastScrollTop = scrollTop;
            
            // Mostra header automaticamente após parar de scroll
            clearTimeout(scrollTimeout);
            if (scrollTop > 100) {
                scrollTimeout = setTimeout(function() {
                    header.classList.remove('hide');
                }, 1500);
            }
        } else {
            // Em desktop, garante que header está visível
            header.classList.remove('hide');
        }
    });
    
    // Ajusta conteúdo para header fixo
    function adjustContentForFixedHeader() {
        if (window.innerWidth <= mobileBreakpoint) {
            const headerHeight = header.offsetHeight;
            const mainSections = document.querySelectorAll('.hero, .page-header, .evaluation-section, .companies-section, .como-funciona-section');
            mainSections.forEach(section => {
                if (section) {
                    const currentPadding = parseInt(window.getComputedStyle(section).paddingTop);
                    if (currentPadding < headerHeight + 20) {
                        section.style.paddingTop = `${headerHeight + 20}px`;
                    }
                }
            });
        }
    }
    
    // Executa ajustes
    setTimeout(adjustContentForFixedHeader, 500);
    window.addEventListener('resize', adjustContentForFixedHeader);
    window.addEventListener('load', adjustContentForFixedHeader);
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

// ==================== CORREÇÃO DO MAPA PARA GITHUB PAGES ====================
function initMap() {
    console.log('🗺️ Inicializando mapa...');
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.log('⚠️ Elemento do mapa não encontrado nesta página');
        return;
    }
    
    try {
        // Verificar se Leaflet está carregado
        if (typeof L === 'undefined') {
            console.error('❌ Leaflet não carregado');
            mapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: var(--gray-light); border-radius: var(--radius);">
                    <div style="text-align: center; padding: 2rem;">
                        <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;"></i>
                        <h3>Mapa em manutenção</h3>
                        <p>Estamos trabalhando para melhorar sua experiência.</p>
                        <button onclick="loadSampleCompanies()" class="btn btn-primary" style="margin-top: 1rem;">
                            <i class="fas fa-eye"></i> Ver Empresas Simuladas
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Inicializar mapa com visualização do Brasil
        map = L.map('map').setView([-15.7801, -47.9292], 4);
        
        // Usar tile layer seguro para HTTPS
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            crossOrigin: true
        }).addTo(map);
        
        console.log('✅ Mapa inicializado com sucesso');
        
        // Adicionar controles de zoom
        L.control.zoom({
            position: 'topright'
        }).addTo(map);
        
        // Adicionar escala
        L.control.scale().addTo(map);
        
        // Adicionar empresas existentes ao mapa
        setTimeout(() => {
            const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
            if (companies.length > 0) {
                addCompaniesToMap(companies);
            } else {
                // Carregar empresas de exemplo se não houver
                loadSampleCompanies();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro ao inicializar mapa:', error);
        mapElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: var(--gray-light); border-radius: var(--radius);">
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;"></i>
                    <h3>Mapa indisponível</h3>
                    <p>O mapa não pôde ser carregado. Verifique sua conexão.</p>
                    <button onclick="loadSampleCompanies()" class="btn btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-building"></i> Ver Empresas Cadastradas
                    </button>
                </div>
            </div>
        `;
    }
}

function addCompaniesToMap(companiesArray) {
    if (!map || !companiesArray || companiesArray.length === 0) return;
    
    // Limpa marcadores anteriores
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    
    companiesArray.forEach(company => {
        if (company.lat && company.lng) {
            // Criar marcador personalizado
            const marker = L.marker([company.lat, company.lng]).addTo(map);
            
            // Criar popup personalizado
            const popupContent = `
                <div style="min-width: 250px; padding: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="width: 40px; height: 40px; background: var(--primary); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${company.name.substring(0, 2)}
                        </div>
                        <div>
                            <h4 style="margin: 0; color: var(--dark); font-size: 1.1rem;">${company.name}</h4>
                            <p style="margin: 5px 0 0 0; color: var(--gray); font-size: 0.9rem;">
                                <i class="fas fa-map-marker-alt"></i> ${company.location || 'Local não informado'}
                            </p>
                        </div>
                    </div>
                    
                    <div style="margin: 10px 0;">
                        <div style="color: #FFD700; font-size: 16px; margin-bottom: 5px;">
                            ${company.reviewCount > 0 ? 
                                '★'.repeat(Math.floor(company.averageRating || 0)) + 
                                '☆'.repeat(5 - Math.floor(company.averageRating || 0)) : 
                                'Sem avaliações'}
                        </div>
                        <p style="margin: 5px 0; color: var(--gray); font-size: 0.9rem;">
                            ${company.reviewCount > 0 ? `${(company.averageRating || 0).toFixed(1)}/5` : 'Sem avaliações'} 
                            (${company.reviewCount || 0} avaliações)
                        </p>
                    </div>
                    
                    <div style="margin: 10px 0;">
                        <span style="background: var(--gray-light); padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; color: var(--dark);">
                            <i class="fas fa-industry"></i> ${company.sector || 'Setor não informado'}
                        </span>
                    </div>
                    
                    <button onclick="showCompanyDetails(${company.id}); return false;" 
                            style="width: 100%; margin-top: 10px; padding: 10px; background: var(--primary); 
                                   color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.95rem;">
                        <i class="fas fa-info-circle"></i> Ver Detalhes
                    </button>
                </div>
            `;
            
            marker.bindPopup(popupContent);
        }
    });
    
    console.log(`📍 ${companiesArray.length} empresas adicionadas ao mapa`);
    
    // Ajustar zoom para mostrar todas as empresas
    if (companiesArray.length > 0) {
        const bounds = L.latLngBounds(companiesArray.map(c => [c.lat, c.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

function loadSampleCompanies() {
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    
    if (companies.length === 0) {
        // Adicionar empresas de exemplo
        const sampleCompanies = [
            {
                id: 1, 
                name: "Magazine Luiza", 
                sector: "Varejo", 
                location: "São Paulo, SP",
                lat: -23.5505, 
                lng: -46.6333, 
                averageRating: 4.2, 
                reviewCount: 12,
                description: "Uma das maiores redes varejistas do Brasil",
                dataCadastro: new Date().toISOString()
            },
            {
                id: 2, 
                name: "Itaú Unibanco", 
                sector: "Finanças", 
                location: "São Paulo, SP",
                lat: -23.5500, 
                lng: -46.6390, 
                averageRating: 3.8, 
                reviewCount: 8,
                description: "Maior banco privado da América Latina",
                dataCadastro: new Date().toISOString()
            },
            {
                id: 3, 
                name: "McDonald's", 
                sector: "Alimentação", 
                location: "São Paulo, SP",
                lat: -23.5631, 
                lng: -46.6560, 
                averageRating: 3.5, 
                reviewCount: 15,
                description: "Rede mundial de fast food",
                dataCadastro: new Date().toISOString()
            },
            {
                id: 4, 
                name: "Google Brasil", 
                sector: "Tecnologia", 
                location: "São Paulo, SP",
                lat: -23.5847, 
                lng: -46.6750, 
                averageRating: 4.7, 
                reviewCount: 5,
                description: "Escritório brasileiro da Google",
                dataCadastro: new Date().toISOString()
            },
            {
                id: 5, 
                name: "Hospital Albert Einstein", 
                sector: "Saúde", 
                location: "São Paulo, SP",
                lat: -23.5928, 
                lng: -46.6749, 
                averageRating: 4.5, 
                reviewCount: 7,
                description: "Hospital de referência em saúde",
                dataCadastro: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('reputai_companies', JSON.stringify(sampleCompanies));
        
        // Exibir no mapa se estiver disponível
        if (map) {
            addCompaniesToMap(sampleCompanies);
        }
        
        // Exibir na grade de empresas
        displayCompanies(sampleCompanies);
        
        showToast('Empresas de exemplo carregadas', 'info');
    } else {
        // Exibir empresas existentes
        if (map) {
            addCompaniesToMap(companies);
        }
        displayCompanies(companies);
    }
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
                
                // Adiciona marcador do usuário
                const userIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: '<div style="background: #2563eb; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);"></div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });
                
                L.marker([userLocation.lat, userLocation.lng], {
                    icon: userIcon
                }).addTo(map).bindPopup('<strong>Você está aqui!</strong>').openPopup();
                
                // Busca empresas próximas
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
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
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
    } else {
        showToast('Nenhuma empresa encontrada nas proximidades', 'info');
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
            localStorage.setItem('reputai_location_permission', 'granted');
            showToast('Permissão concedida!', 'success');
            updateLocationStatus('Localização ativa', true);
            locateUser();
        },
        (error) => {
            console.error('Permissão negada:', error);
            locationPermission = false;
            localStorage.setItem('reputai_location_permission', 'denied');
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

// ==================== SISTEMA DE EMPRESAS ====================
function loadCompanies() {
    const savedCompanies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    
    if (savedCompanies && savedCompanies.length > 0) {
        companies = savedCompanies;
        console.log(`🏢 ${companies.length} empresas carregadas do localStorage`);
    } else {
        // Empresas padrão (sem avaliações)
        companies = [
            {
                id: 1, 
                name: "Magazine Luiza", 
                sector: "Varejo", 
                location: "São Paulo, SP",
                lat: -23.5505, 
                lng: -46.6333, 
                averageRating: 0, 
                reviewCount: 0,
                description: "Uma das maiores redes varejistas do Brasil",
                dataCadastro: new Date().toISOString()
            },
            {
                id: 2, 
                name: "Itaú Unibanco", 
                sector: "Finanças", 
                location: "São Paulo, SP",
                lat: -23.5500, 
                lng: -46.6390, 
                averageRating: 0, 
                reviewCount: 0,
                description: "Maior banco privado da América Latina",
                dataCadastro: new Date().toISOString()
            },
            {
                id: 3, 
                name: "McDonald's", 
                sector: "Alimentação", 
                location: "São Paulo, SP",
                lat: -23.5631, 
                lng: -46.6560, 
                averageRating: 0, 
                reviewCount: 0,
                description: "Rede mundial de fast food",
                dataCadastro: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('reputai_companies', JSON.stringify(companies));
        console.log(`🏢 ${companies.length} empresas padrão criadas`);
    }
    
    // Atualiza avaliações existentes
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    companies.forEach(company => {
        const companyEvaluations = evaluations.filter(e => 
            (e.companyId === company.id || e.companyName === company.name) && 
            !e.removida && !e.denunciada
        );
        
        if (companyEvaluations.length > 0) {
            company.averageRating = companyEvaluations.reduce((sum, e) => sum + e.rating, 0) / companyEvaluations.length;
            company.reviewCount = companyEvaluations.length;
        }
    });
    
    // Atualizar localStorage
    localStorage.setItem('reputai_companies', JSON.stringify(companies));
    
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
    
    return homeCompanies;
}

// ==================== FUNÇÃO SHOWCOMPANYDETAILS ====================
function showCompanyDetails(companyId) {
    console.log('🏢 Buscando detalhes da empresa ID:', companyId);
    
    // 1. Busca a empresa no banco de dados
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    let company = companies.find(c => c.id === companyId);
    
    if (!company) {
        showToast('❌ Empresa não encontrada', 'error');
        console.error('Empresa não encontrada. IDs disponíveis:', companies.map(c => c.id));
        return;
    }
    
    // 2. Busca avaliações da empresa
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const companyEvaluations = evaluations.filter(e => 
        e.companyId === companyId || e.companyName === company.name
    ).filter(e => !e.removida && !e.denunciada);
    
    // 3. Calcula média atualizada
    const avgRating = companyEvaluations.length > 0 ? 
        (companyEvaluations.reduce((sum, e) => sum + e.rating, 0) / companyEvaluations.length).toFixed(1) : 0;
    
    // 4. Atualiza empresa no array se necessário
    const companyIndex = companies.findIndex(c => c.id === companyId);
    if (companyIndex !== -1) {
        companies[companyIndex].averageRating = parseFloat(avgRating);
        companies[companyIndex].reviewCount = companyEvaluations.length;
        localStorage.setItem('reputai_companies', JSON.stringify(companies));
        company = companies[companyIndex]; // Atualiza objeto company
    }
    
    // 5. Prepara conteúdo do modal
    const modalContent = `
        <div style="max-width: 600px; max-height: 80vh; overflow-y: auto; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--gray-light);">
                <div style="width: 60px; height: 60px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px;">
                    ${company.name.substring(0, 2)}
                </div>
                <div>
                    <h3 style="margin: 0; color: var(--dark);">${company.name}</h3>
                    <p style="margin: 5px 0; color: var(--gray);">
                        <i class="fas fa-map-marker-alt"></i> ${company.location || 'Localização não informada'}
                    </p>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="color: #FFD700; font-size: 20px;">
                            ${avgRating > 0 ? '★'.repeat(Math.floor(avgRating)) + '☆'.repeat(5 - Math.floor(avgRating)) : 'Sem avaliações'}
                        </div>
                        <span style="font-weight: bold; color: var(--dark);">${avgRating}/5</span>
                        <span style="color: var(--gray);">(${companyEvaluations.length} avaliações)</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--dark); margin-bottom: 10px;">Descrição</h4>
                <p style="color: var(--text);">${company.description || 'Empresa cadastrada na plataforma ReputAí.'}</p>
                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    <span style="background: var(--gray-light); padding: 5px 10px; border-radius: 20px; font-size: 0.85rem;">
                        ${company.sector || 'Setor não informado'}
                    </span>
                    <span style="background: var(--gray-light); padding: 5px 10px; border-radius: 20px; font-size: 0.85rem;">
                        ${companyEvaluations.length} avaliações
                    </span>
                    ${company.dataCadastro ? `
                        <span style="background: var(--gray-light); padding: 5px 10px; border-radius: 20px; font-size: 0.85rem;">
                            <i class="fas fa-calendar"></i> ${new Date(company.dataCadastro).toLocaleDateString('pt-BR')}
                        </span>
                    ` : ''}
                </div>
            </div>
            
            <div>
                <h4 style="color: var(--dark); margin-bottom: 15px;">
                    Avaliações (${companyEvaluations.length})
                    <small style="color: var(--gray); font-weight: normal;">
                        - Baseadas exclusivamente em avaliações do ReputAí
                    </small>
                </h4>
                ${companyEvaluations.length > 0 ? 
                    `<div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">
                        ${companyEvaluations.map(eval => `
                            <div style="background: var(--light); padding: 15px; border-radius: var(--radius); margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <strong style="color: var(--dark);">
                                        ${eval.anonima ? 'Usuário Anônimo' : eval.userName}
                                        ${eval.userId === window.currentUser?.id ? '<span style="color: #3b82f6; font-size: 0.8rem;"> (Você)</span>' : ''}
                                    </strong>
                                    <div style="color: #FFD700;">
                                        ${'★'.repeat(eval.rating)}${'☆'.repeat(5 - eval.rating)}
                                    </div>
                                </div>
                                <p style="color: var(--text); margin-bottom: 8px; font-size: 0.95rem;">
                                    ${eval.text}
                                </p>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <small style="color: var(--gray);">
                                        ${new Date(eval.date).toLocaleDateString('pt-BR')}
                                        ${eval.avisoAceito ? '<i class="fas fa-check-circle" style="color: #10b981; margin-left: 5px;"></i>' : ''}
                                        ${eval.anonima ? '<i class="fas fa-user-secret" style="color: #64748b; margin-left: 5px;"></i>' : ''}
                                    </small>
                                    ${window.currentUser?.id !== eval.userId && !window.currentUser?.isAdmin ? `
                                        <button onclick="denunciarAvaliacao(${eval.id})" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 0.8rem;">
                                            <i class="fas fa-flag"></i> Denunciar
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>` :
                    `<p style="text-align: center; color: var(--gray); padding: 20px;">
                        <i class="fas fa-star" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        Nenhuma avaliação disponível. Seja o primeiro a avaliar!
                        <br><small>Apenas avaliações feitas no ReputAí são exibidas.</small>
                    </p>`
                }
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="closeModal()" style="background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                    Fechar
                </button>
                ${window.currentUser ? `
                    <button onclick="window.location.href='avaliacao.html'; closeModal();" style="background: var(--success); color: white; border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer; font-weight: 500; margin-left: 10px;">
                        <i class="fas fa-star"></i> Avaliar esta Empresa
                    </button>
                ` : `
                    <button onclick="showAuthModal(); closeModal();" style="background: var(--warning); color: white; border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer; font-weight: 500; margin-left: 10px;">
                        <i class="fas fa-sign-in-alt"></i> Entrar para Avaliar
                    </button>
                `}
            </div>
        </div>
    `;
    
    showModal(modalContent);
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
                        ${company.reviewCount > 0 ? 
                            '★'.repeat(Math.floor(company.averageRating)) + 
                            '☆'.repeat(5 - Math.floor(company.averageRating)) : 
                            'Sem avaliações'}
                    </div>
                    <span>${company.reviewCount > 0 ? company.averageRating.toFixed(1) + '/5' : 'Avaliar'} (${company.reviewCount})</span>
                </div>
                
                <p>${company.description || 'Empresa cadastrada na plataforma ReputAí'}</p>
                
                <div class="company-tags">
                    <span class="tag">${company.sector}</span>
                    <span class="tag">${company.reviewCount} avaliações</span>
                    ${company.dataCadastro ? `<span class="tag">${new Date(company.dataCadastro).toLocaleDateString('pt-BR')}</span>` : ''}
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
    
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm) ||
        (company.sector && company.sector.toLowerCase().includes(searchTerm)) ||
        (company.location && company.location.toLowerCase().includes(searchTerm)) ||
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
    
    if (filtered.length === 0) {
        showToast('Nenhuma empresa encontrada', 'info');
    }
}

function filterBySector(sector) {
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
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

// ==================== SISTEMA DE ESTATÍSTICAS ====================
function carregarEstatisticas() {
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    
    const totalEmpresas = document.getElementById('total-empresas');
    const totalAvaliacoes = document.getElementById('total-avaliacoes');
    const mediaGeral = document.getElementById('media-geral');
    const setores = document.getElementById('setores');
    
    if (totalEmpresas) totalEmpresas.textContent = companies.length;
    if (totalAvaliacoes) totalAvaliacoes.textContent = evaluations.length;
    
    // Calcular média geral
    const avg = evaluations.length > 0 ? 
        (evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length).toFixed(1) : '0.0';
    if (mediaGeral) mediaGeral.textContent = avg;
    
    // Contar setores únicos
    const setoresUnicos = [...new Set(companies.map(c => c.sector).filter(s => s && s.trim() !== ''))];
    if (setores) setores.textContent = setoresUnicos.length;
    
    console.log('📊 Estatísticas carregadas');
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
        filtered = filtered.filter(c => c.location && c.location.toLowerCase().includes(locationFilter));
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
    displayCompanies(filtered);
    
    const noCompanies = document.getElementById('no-companies');
    if (noCompanies) {
        noCompanies.style.display = filtered.length === 0 ? 'block' : 'none';
    }
    
    showToast(`${filtered.length} empresas encontradas`, 'info');
}

// ==================== AUTOCOMPLETE PARA BUSCA DE EMPRESAS ====================
function setupCompanyAutocomplete() {
    const input = document.getElementById('evaluate-company');
    if (!input) return;
    
    // Cria container para sugestões
    const suggestions = document.createElement('div');
    suggestions.id = 'company-suggestions';
    suggestions.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid var(--gray-light);
        border-radius: var(--radius);
        max-height: 200px;
        overflow-y: auto;
        display: none;
        z-index: 1000;
        width: ${input.offsetWidth}px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    input.parentNode.appendChild(suggestions);
    
    // Evento de digitação
    input.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
        
        if (searchTerm.length < 2) return;
        
        const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
        const filtered = companies.filter(company =>
            company.name.toLowerCase().includes(searchTerm)
        ).slice(0, 5);
        
        if (filtered.length > 0) {
            suggestions.innerHTML = filtered.map(company => `
                <div style="padding: 10px; cursor: pointer; border-bottom: 1px solid var(--gray-light); transition: background 0.2s;" 
                     onmouseover="this.style.background='var(--gray-light)';" 
                     onmouseout="this.style.background='white';"
                     onclick="selectCompanySuggestion('${company.name.replace(/'/g, "\\'")}')">
                    <div style="font-weight: 500;">${company.name}</div>
                    <small style="color: var(--gray);">
                        ${company.sector || 'Setor não informado'} • ${company.location || 'Localização não informada'}
                    </small>
                    <div style="font-size: 0.8rem; color: #FFD700; margin-top: 3px;">
                        ${company.reviewCount > 0 ? 
                            '★'.repeat(Math.floor(company.averageRating || 0)) + 
                            '☆'.repeat(5 - Math.floor(company.averageRating || 0)) + 
                            ` (${company.reviewCount} avaliações)` : 
                            'Sem avaliações'}
                    </div>
                </div>
            `).join('');
            
            suggestions.style.display = 'block';
            suggestions.style.top = `${input.offsetTop + input.offsetHeight + 5}px`;
            suggestions.style.left = `${input.offsetLeft}px`;
        }
    });
    
    // Fecha sugestões ao clicar fora
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.style.display = 'none';
        }
    });
}

function selectCompanySuggestion(companyName) {
    const input = document.getElementById('evaluate-company');
    const suggestions = document.getElementById('company-suggestions');
    
    if (input) input.value = companyName;
    if (suggestions) suggestions.style.display = 'none';
    
    // Preenche automaticamente setor se conhecido
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const company = companies.find(c => c.name === companyName);
    if (company && company.sector) {
        const sectorSelect = document.getElementById('evaluate-sector');
        if (sectorSelect) sectorSelect.value = company.sector;
    }
}

// ==================== SISTEMA DE AVALIAÇÃO ====================
function initEvaluationPage() {
    console.log('⭐ Inicializando página de avaliação...');
    
    // 1. Configura autocomplete
    setupCompanyAutocomplete();
    
    // 2. Carrega setores únicos das empresas
    const sectorSelect = document.getElementById('evaluate-sector');
    if (sectorSelect) {
        const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
        const setoresUnicos = [...new Set(companies.map(c => c.sector).filter(Boolean))];
        
        // Remove opções duplicadas e adiciona novas
        setoresUnicos.forEach(setor => {
            if (!Array.from(sectorSelect.options).some(opt => opt.value === setor)) {
                const option = document.createElement('option');
                option.value = setor;
                option.textContent = setor;
                sectorSelect.appendChild(option);
            }
        });
    }
    
    // 3. Adiciona mensagem de cadastro automático (se não existir)
    const evaluateCompanyInput = document.getElementById('evaluate-company');
    if (evaluateCompanyInput && !evaluateCompanyInput.nextElementSibling?.classList?.contains('auto-register-notice')) {
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
    
    // 4. Configura campos opcionais
    setTimeout(() => {
        initOptionalFields();
    }, 500);
}

function verificarAvaliacao() {
    // Verifica login
    if (!window.currentUser) {
        showToast('Faça login para avaliar uma empresa', 'info');
        if (typeof showAuthModal === 'function') {
            showAuthModal();
        }
        return;
    }
    
    // Verifica termos de uso
    if (!window.termosAceitos) {
        showToast('Você precisa aceitar os termos de uso primeiro', 'warning');
        if (typeof showTermosModal === 'function') {
            showTermosModal();
        }
        return;
    }
    
    const companyName = document.getElementById('evaluate-company')?.value.trim();
    const rating = document.querySelector('input[name="rating"]:checked');
    const text = document.getElementById('evaluation-text')?.value.trim();
    const isAnonima = document.getElementById('avaliacao-anonima')?.checked || false;
    
    if (!companyName || !rating || !text) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    if (text.length < 50) {
        showToast('A avaliação deve ter pelo menos 50 caracteres', 'error');
        return;
    }
    
    // Mostra modal de confirmação
    showAvisoModal(companyName, rating.value, text, isAnonima);
}

function showAvisoModal(companyName, rating, text, isAnonima) {
    const modalContent = `
        <div style="max-width: 500px; padding: 20px;">
            <h3 style="color: var(--dark); margin-bottom: 1rem; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>
                Confirmação de Avaliação
            </h3>
            
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
                <p style="color: #92400e; margin-bottom: 10px;">
                    <strong>Atenção:</strong> Sua avaliação será pública e deve seguir nossas políticas.
                </p>
                <ul style="color: #92400e; padding-left: 20px; font-size: 0.9rem;">
                    <li>Baseada em experiência real</li>
                    <li>Não copiada de outros sites</li>
                    <li>Respeitando leis brasileiras</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p><strong>Empresa:</strong> ${companyName}</p>
                <p><strong>Avaliação:</strong> ${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</p>
                <p><strong>Anônima:</strong> ${isAnonima ? 'Sim' : 'Não'}</p>
                <p><strong>Prévia:</strong> ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}</p>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 1.5rem;">
                <button onclick="closeModal()" style="flex: 1; background: var(--gray-light); color: var(--dark); border: none; padding: 12px; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                    Cancelar
                </button>
                <button onclick="prosseguirAvaliacao('${companyName.replace(/'/g, "\\'")}', ${rating}, ${isAnonima})" style="flex: 1; background: var(--success); color: white; border: none; padding: 12px; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                    <i class="fas fa-check"></i> Confirmar e Enviar
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

function prosseguirAvaliacao(companyName, rating, isAnonima) {
    const text = document.getElementById('evaluation-text')?.value.trim();
    const sector = document.getElementById('evaluate-sector')?.value || "Outros";
    const location = document.getElementById('evaluate-location')?.value.trim() || "Brasil";
    
    if (!text || text.length < 50) {
        showToast('A avaliação deve ter pelo menos 50 caracteres', 'error');
        return;
    }
    
    // Cria objeto de avaliação
    const evaluation = {
        id: Date.now(),
        companyName: companyName,
        rating: parseInt(rating),
        text: text,
        sector: sector,
        location: location,
        userId: window.currentUser.id,
        userName: isAnonima ? 'Usuário Anônimo' : window.currentUser.name,
        userEmail: window.currentUser.email,
        date: new Date().toISOString(),
        anonima: isAnonima,
        denunciada: false,
        removida: false,
        avisoAceito: true,
        // Campos opcionais
        ambient: selectedAmbient,
        benefits: [...selectedBenefits, ...customBenefits],
        salaryAmount: salaryAmount,
        salaryPeriod: salaryPeriod
    };
    
    // Salva avaliação
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    evaluations.push(evaluation);
    localStorage.setItem('reputai_evaluations', JSON.stringify(evaluations));
    
    // Atualiza ou cria empresa
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    let company = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
    
    if (!company) {
        // Cria nova empresa com coordenadas aleatórias no Brasil
        const lat = -15 + (Math.random() - 0.5) * 10;
        const lng = -50 + (Math.random() - 0.5) * 10;
        
        company = {
            id: companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1,
            name: companyName,
            sector: sector,
            location: location,
            lat: lat,
            lng: lng,
            averageRating: parseInt(rating),
            reviewCount: 1,
            description: `Empresa cadastrada através de avaliação - Setor: ${sector}`,
            dataCadastro: new Date().toISOString()
        };
        companies.push(company);
    } else {
        // Atualiza empresa existente
        const companyEvaluations = evaluations.filter(e => 
            e.companyName.toLowerCase() === companyName.toLowerCase() &&
            !e.removida && !e.denunciada
        );
        
        if (companyEvaluations.length > 0) {
            const totalRating = companyEvaluations.reduce((sum, e) => sum + e.rating, 0);
            company.averageRating = totalRating / companyEvaluations.length;
            company.reviewCount = companyEvaluations.length;
        }
    }
    
    localStorage.setItem('reputai_companies', JSON.stringify(companies));
    
    // Limpa rascunho
    localStorage.removeItem('reputai_evaluation_draft');
    
    // Fecha modal e mostra sucesso
    closeModal();
    showToast('✅ Avaliação enviada com sucesso!', 'success');
    
    // Limpa formulário
    document.getElementById('evaluate-company').value = '';
    document.getElementById('evaluate-sector').value = '';
    document.getElementById('evaluate-location').value = '';
    document.getElementById('evaluation-text').value = '';
    if (document.getElementById('avaliacao-anonima')) {
        document.getElementById('avaliacao-anonima').checked = false;
    }
    document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);
    
    // Limpa campos opcionais
    selectedAmbient = null;
    selectedBenefits = [];
    customBenefits = [];
    salaryAmount = '';
    salaryPeriod = 'mensal';
    
    // Atualiza visual dos campos opcionais
    updateCustomBenefitsList();
    document.querySelectorAll('.ambient-option').forEach(o => o.classList.remove('selected'));
    document.querySelectorAll('.benefit-checkbox').forEach(b => b.classList.remove('selected'));
    const salaryInput = document.getElementById('salary-amount');
    const salarySelect = document.getElementById('salary-period');
    if (salaryInput) salaryInput.value = '';
    if (salarySelect) salarySelect.value = 'mensal';
    
    // Redireciona para home após 2 segundos
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// ==================== CAMPOS OPCIONAIS DA AVALIAÇÃO ====================
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
    
    // Anônimo
    const anonimoCheckbox = document.getElementById('avaliacao-anonima');
    if (anonimoCheckbox) {
        anonimoCheckbox.addEventListener('change', function() {
            saveEvaluationDraft();
        });
    }
    
    // Benefício customizado (Enter para adicionar)
    const customBenefitInput = document.getElementById('custom-benefit');
    if (customBenefitInput) {
        customBenefitInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addCustomBenefit();
                e.preventDefault();
            }
        });
    }
    
    // Carrega rascunho salvo
    loadEvaluationDraft();
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
        if (!selectedBenefits.includes(benefit)) {
            selectedBenefits.push(benefit);
        }
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
                <button onclick="removeCustomBenefit('${benefit.replace(/'/g, "\\'")}')">&times;</button>
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
        anonima: document.getElementById('avaliacao-anonima')?.checked || false,
        salaryAmount: salaryAmount,
        salaryPeriod: salaryPeriod,
        selectedAmbient: selectedAmbient,
        selectedBenefits: selectedBenefits,
        customBenefits: customBenefits,
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('reputai_evaluation_draft', JSON.stringify(draft));
}

function loadEvaluationDraft() {
    const draft = JSON.parse(localStorage.getItem('reputai_evaluation_draft') || 'null');
    
    if (draft) {
        if (draft.companyName) {
            const input = document.getElementById('evaluate-company');
            if (input) input.value = draft.companyName;
        }
        if (draft.sector) {
            const select = document.getElementById('evaluate-sector');
            if (select) select.value = draft.sector;
        }
        if (draft.location) {
            const input = document.getElementById('evaluate-location');
            if (input) input.value = draft.location;
        }
        if (draft.text) {
            const textarea = document.getElementById('evaluation-text');
            if (textarea) textarea.value = draft.text;
        }
        
        if (draft.anonima) {
            const checkbox = document.getElementById('avaliacao-anonima');
            if (checkbox) checkbox.checked = draft.anonima;
        }
        
        if (draft.selectedAmbient) {
            const element = document.querySelector(`.ambient-option[data-value="${draft.selectedAmbient}"]`);
            if (element) selectAmbientOption(element);
        }
        
        if (draft.selectedBenefits) {
            selectedBenefits = draft.selectedBenefits;
            draft.selectedBenefits.forEach(benefit => {
                const element = document.querySelector(`.benefit-checkbox[data-value="${benefit}"]`);
                if (element) element.classList.add('selected');
            });
        }
        
        if (draft.customBenefits) {
            customBenefits = draft.customBenefits;
            updateCustomBenefitsList();
        }
        
        if (draft.salaryAmount) {
            const input = document.getElementById('salary-amount');
            if (input) input.value = draft.salaryAmount;
            salaryAmount = draft.salaryAmount;
        }
        if (draft.salaryPeriod) {
            const select = document.getElementById('salary-period');
            if (select) select.value = draft.salaryPeriod;
            salaryPeriod = draft.salaryPeriod;
        }
        
        showToast('Rascunho da avaliação carregado', 'info');
    }
}

// ==================== SISTEMA DE DENÚNCIAS ====================
function denunciarAvaliacao(avaliacaoId) {
    if (!window.currentUser) {
        showToast('Faça login para denunciar uma avaliação', 'info');
        if (typeof showAuthModal === 'function') {
            showAuthModal();
        }
        return;
    }
    
    const avaliacoes = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const avaliacao = avaliacoes.find(a => a.id === avaliacaoId);
    
    if (!avaliacao) {
        showToast('Avaliação não encontrada', 'error');
        return;
    }
    
    // Verifica se já denunciou
    const denuncias = JSON.parse(localStorage.getItem('reputai_denuncias') || '[]');
    const jaDenunciou = denuncias.some(d => 
        d.avaliacaoId === avaliacaoId && d.usuarioDenunciante === window.currentUser.id
    );
    
    if (jaDenunciou) {
        showToast('Você já denunciou esta avaliação', 'info');
        return;
    }
    
    // Modal para selecionar motivo
    const modalContent = `
        <div style="max-width: 500px; padding: 20px;">
            <h3 style="color: var(--dark); margin-bottom: 1rem;">
                <i class="fas fa-flag"></i> Denunciar Avaliação
            </h3>
            
            <p style="color: var(--gray); margin-bottom: 1.5rem;">
                Selecione o motivo da denúncia para a avaliação de <strong>${avaliacao.userName}</strong> na empresa <strong>${avaliacao.companyName}</strong>:
            </p>
            
            <div style="margin-bottom: 1.5rem;">
                <div style="margin-bottom: 10px;">
                    <input type="radio" id="motivo-ofensivo" name="motivo" value="conteudo_ofensivo" checked>
                    <label for="motivo-ofensivo" style="margin-left: 8px; cursor: pointer;">
                        Conteúdo ofensivo ou difamatório
                    </label>
                </div>
                <div style="margin-bottom: 10px;">
                    <input type="radio" id="motivo-falso" name="motivo" value="informacao_falsa">
                    <label for="motivo-falso" style="margin-left: 8px; cursor: pointer;">
                        Informação falsa ou enganosa
                    </label>
                </div>
                <div style="margin-bottom: 10px;">
                    <input type="radio" id="motivo-conflito" name="motivo" value="conflito_interesse">
                    <label for="motivo-conflito" style="margin-left: 8px; cursor: pointer;">
                        Conflito de interesse ou spam
                    </label>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 1.5rem;">
                <button onclick="closeModal()" style="flex: 1; background: var(--gray-light); color: var(--dark); border: none; padding: 10px; border-radius: var(--radius); cursor: pointer;">
                    Cancelar
                </button>
                <button onclick="enviarDenuncia(${avaliacaoId})" style="flex: 1; background: var(--danger); color: white; border: none; padding: 10px; border-radius: var(--radius); cursor: pointer;">
                    <i class="fas fa-paper-plane"></i> Enviar Denúncia
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

function enviarDenuncia(avaliacaoId) {
    const motivoSelecionado = document.querySelector('input[name="motivo"]:checked');
    if (!motivoSelecionado) {
        showToast('Selecione um motivo para a denúncia', 'error');
        return;
    }
    
    const motivo = motivoSelecionado.value;
    
    // Adiciona denúncia
    const denuncias = JSON.parse(localStorage.getItem('reputai_denuncias') || '[]');
    const avaliacoes = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const avaliacao = avaliacoes.find(a => a.id === avaliacaoId);
    
    if (avaliacao) {
        denuncias.push({
            id: Date.now(),
            avaliacaoId: avaliacaoId,
            empresa: avaliacao.companyName,
            usuario: avaliacao.userName,
            usuarioId: avaliacao.userId,
            usuarioDenunciante: window.currentUser.id,
            motivo: motivo,
            data: new Date().toISOString(),
            status: 'pendente'
        });
        
        localStorage.setItem('reputai_denuncias', JSON.stringify(denuncias));
        
        // Marca avaliação como denunciada
        marcarAvaliacaoComoDenunciada(avaliacaoId);
        
        closeModal();
        showToast('✅ Denúncia enviada com sucesso! A avaliação será analisada.', 'success');
    }
}

function marcarAvaliacaoComoDenunciada(avaliacaoId) {
    const avaliacoes = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const index = avaliacoes.findIndex(a => a.id === avaliacaoId);
    
    if (index !== -1) {
        avaliacoes[index].denunciada = true;
        localStorage.setItem('reputai_evaluations', JSON.stringify(avaliacoes));
    }
}

// ==================== SISTEMA DE SESSÃO PERSISTENTE ENTRE PÁGINAS ====================
function initSessionManager() {
    console.log('🔐 Inicializando gerenciador de sessão...');
    
    // Verificar permissão de localização salva
    const savedPermission = localStorage.getItem('reputai_location_permission');
    if (savedPermission === 'granted') {
        locationPermission = true;
        if (typeof updateLocationStatus === 'function') {
            updateLocationStatus('Localização ativa', true);
        }
    }
}

// ==================== INICIALIZAÇÃO DA APLICAÇÃO ====================
function initApp() {
    console.log('🚀 Inicializando aplicação...');
    
    // Inicializa animação de digitação
    initTypingEffect();
    
    // Inicializa mapa (se existir na página)
    if (document.getElementById('map')) {
        // Delay para garantir que Leaflet carregue
        setTimeout(() => {
            if (typeof initMap === 'function') {
                initMap();
            }
        }, 500);
    }
    
    // Carrega empresas
    if (document.getElementById('companies-container')) {
        setTimeout(() => {
            if (typeof loadHomeCompanies === 'function') {
                loadHomeCompanies();
            }
        }, 1000);
    }
    
    // Inicializa gerenciador de sessão
    initSessionManager();
    
    console.log('✅ Aplicação inicializada com sucesso');
}

// ==================== CONFIGURAÇÃO INICIAL ====================
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
    setTimeout(() => {
        if (typeof initSmartNavigation === 'function') {
            initSmartNavigation();
        }
    }, 300);
    
    // Inicializar sistema
    setTimeout(() => {
        if (typeof initApp === 'function') {
            initApp();
        }
        
        // Inicializar página de avaliação se estiver nela
        if (window.location.pathname.includes('avaliacao.html') && typeof initEvaluationPage === 'function') {
            initEvaluationPage();
        }
        
        // Carregar estatísticas se estiver na página de empresas
        if (window.location.pathname.includes('empresas.html') && typeof carregarEstatisticas === 'function') {
            setTimeout(() => carregarEstatisticas(), 500);
        }
    }, 500);
});

// ==================== EXPORTAÇÕES GLOBAIS ====================
window.scrollToElement = scrollToElement;
window.scrollToTop = scrollToTop;
window.showToast = showToast;
window.showModal = showModal;
window.closeModal = closeModal;
window.searchCompanies = searchCompanies;
window.filterBySector = filterBySector;
window.verificarAvaliacao = verificarAvaliacao;
window.locateUser = locateUser;
window.resetMapView = resetMapView;
window.requestLocationPermission = requestLocationPermission;
window.showCompanyDetails = showCompanyDetails;
window.initApp = initApp;
window.initEvaluationPage = initEvaluationPage;
window.selectAmbientOption = selectAmbientOption;
window.toggleBenefit = toggleBenefit;
window.addCustomBenefit = addCustomBenefit;
window.removeCustomBenefit = removeCustomBenefit;
window.updateCustomBenefitsList = updateCustomBenefitsList;
window.saveEvaluationDraft = saveEvaluationDraft;
window.loadEvaluationDraft = loadEvaluationDraft;
window.denunciarAvaliacao = denunciarAvaliacao;
window.enviarDenuncia = enviarDenuncia;
window.initSmartNavigation = initSmartNavigation;
window.setupCompanyAutocomplete = setupCompanyAutocomplete;
window.selectCompanySuggestion = selectCompanySuggestion;
window.carregarEstatisticas = carregarEstatisticas;
window.filtrarEmpresas = filtrarEmpresas;
window.initMap = initMap;
window.loadSampleCompanies = loadSampleCompanies;
window.addCompaniesToMap = addCompaniesToMap;
window.initSessionManager = initSessionManager;

console.log('✅ [script] Sistema principal carregado');