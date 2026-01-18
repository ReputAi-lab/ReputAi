// sistema-avaliacoes.js - Sistema principal do ReputAí
console.log('🚀 [sistema] Sistema principal carregado...');

// ==================== VARIÁVEIS GLOBAIS ====================
let map = null;
let companies = [];
let selectedBenefits = [];
let customBenefits = [];

// ==================== INICIALIZAÇÃO GERAL ====================
function initApp() {
    console.log('🌐 Inicializando aplicação...');
    
    // Inicializa componentes baseados na página
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    // Esconde loading
    setTimeout(() => {
        const loading = document.getElementById('global-loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.style.display = 'none', 500);
        }
    }, 1000);
    
    // Configurações específicas por página
    switch(page) {
        case 'index.html':
        case '':
            initHomePage();
            break;
        case 'avaliacao.html':
            initEvaluationPage();
            break;
        case 'empresas.html':
            initCompaniesPage();
            break;
    }
    
    // Configura eventos comuns
    setupCommonEvents();
    loadCompaniesData();
}

// ==================== PÁGINA INICIAL ====================
function initHomePage() {
    initTypingEffect();
    initMap();
    loadHomeCompanies();
    setupSearch();
}

function initTypingEffect() {
    const typingElement = document.querySelector('.typing-text');
    if (!typingElement) return;
    
    const phrases = ["o melhor lugar", "a equipe ideal", "a melhor empresa"];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const currentPhrase = phrases[phraseIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            if (charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                setTimeout(type, 500);
                return;
            }
        } else {
            typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            if (charIndex === currentPhrase.length) {
                isDeleting = true;
                setTimeout(type, 2000);
                return;
            }
        }
        
        setTimeout(type, isDeleting ? 50 : 100);
    }
    
    setTimeout(type, 1000);
}

// ==================== MAPA ====================
function initMap() {
    if (!document.getElementById('map')) return;
    
    try {
        map = L.map('map').setView([-15.7801, -47.9292], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);
        
        // Adiciona empresas ao mapa
        const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
        addCompaniesToMap(companies);
        
    } catch (error) {
        document.getElementById('map').innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;background:var(--gray-light);">
                <div style="text-align:center;padding:2rem;">
                    <i class="fas fa-map-marked-alt" style="font-size:3rem;color:var(--gray);"></i>
                    <h3>Mapa indisponível</h3>
                </div>
            </div>
        `;
    }
}

function addCompaniesToMap(companiesArray) {
    if (!map || !companiesArray) return;
    
    companiesArray.forEach(company => {
        if (company.lat && company.lng) {
            L.marker([company.lat, company.lng])
                .addTo(map)
                .bindPopup(`
                    <div style="min-width:250px;">
                        <h4 style="margin:0 0 10px 0;">${company.name}</h4>
                        <p style="margin:5px 0;color:var(--gray);">
                            <i class="fas fa-map-marker-alt"></i> ${company.location}
                        </p>
                        <div style="color:#FFD700;margin:10px 0;">
                            ${'★'.repeat(Math.floor(company.averageRating || 0))}
                            ${'☆'.repeat(5 - Math.floor(company.averageRating || 0))}
                        </div>
                        <button onclick="showCompanyDetails(${company.id})" 
                                style="width:100%;margin-top:10px;padding:8px;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;">
                            <i class="fas fa-info-circle"></i> Ver Detalhes
                        </button>
                    </div>
                `);
        }
    });
}

// ==================== SISTEMA DE EMPRESAS ====================
function loadCompaniesData() {
    let savedCompanies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    
    if (savedCompanies.length === 0) {
        savedCompanies = [
            {
                id: 1, 
                name: "Magazine Luiza", 
                sector: "Varejo", 
                location: "São Paulo, SP",
                lat: -23.5505, lng: -46.6333, 
                averageRating: 0, 
                reviewCount: 0,
                description: "Uma das maiores redes varejistas do Brasil"
            },
            {
                id: 2, 
                name: "Itaú Unibanco", 
                sector: "Finanças", 
                location: "São Paulo, SP",
                lat: -23.5500, lng: -46.6390, 
                averageRating: 0, 
                reviewCount: 0,
                description: "Maior banco privado da América Latina"
            }
        ];
        localStorage.setItem('reputai_companies', JSON.stringify(savedCompanies));
    }
    
    // Atualiza avaliações
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    savedCompanies.forEach(company => {
        const companyEvaluations = evaluations.filter(e => 
            (e.companyId === company.id || e.companyName === company.name) && 
            !e.removida && !e.denunciada
        );
        
        if (companyEvaluations.length > 0) {
            company.averageRating = companyEvaluations.reduce((sum, e) => sum + e.rating, 0) / companyEvaluations.length;
            company.reviewCount = companyEvaluations.length;
        }
    });
    
    companies = savedCompanies;
    return savedCompanies;
}

function loadHomeCompanies() {
    const allCompanies = loadCompaniesData();
    displayCompanies(allCompanies.slice(0, 6));
    
    if (map) {
        addCompaniesToMap(allCompanies.slice(0, 6));
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
                </div>
            </div>
        </div>
    `).join('');
}

function showCompanyDetails(companyId) {
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    let company = companies.find(c => c.id === companyId);
    
    if (!company) {
        showToast('Empresa não encontrada', 'error');
        return;
    }
    
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const companyEvaluations = evaluations.filter(e => 
        e.companyId === companyId || e.companyName === company.name
    ).filter(e => !e.removida && !e.denunciada);
    
    const avgRating = companyEvaluations.length > 0 ? 
        (companyEvaluations.reduce((sum, e) => sum + e.rating, 0) / companyEvaluations.length).toFixed(1) : 0;
    
    const modalContent = `
        <div style="max-width:600px;max-height:80vh;overflow-y:auto;padding:20px;">
            <div style="display:flex;align-items:center;gap:15px;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid var(--gray-light);">
                <div style="width:60px;height:60px;background:var(--primary);color:white;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:24px;">
                    ${company.name.substring(0, 2)}
                </div>
                <div>
                    <h3 style="margin:0;">${company.name}</h3>
                    <p style="margin:5px 0;color:var(--gray);">
                        <i class="fas fa-map-marker-alt"></i> ${company.location || 'Localização não informada'}
                    </p>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="color:#FFD700;font-size:20px;">
                            ${avgRating > 0 ? '★'.repeat(Math.floor(avgRating)) + '☆'.repeat(5 - Math.floor(avgRating)) : 'Sem avaliações'}
                        </div>
                        <span style="font-weight:bold;">${avgRating}/5</span>
                        <span style="color:var(--gray);">(${companyEvaluations.length} avaliações)</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom:20px;">
                <h4 style="color:var(--dark);margin-bottom:10px;">Descrição</h4>
                <p>${company.description || 'Empresa cadastrada na plataforma ReputAí.'}</p>
                <div style="display:flex;gap:10px;margin-top:10px;">
                    <span style="background:var(--gray-light);padding:5px 10px;border-radius:20px;font-size:0.85rem;">
                        ${company.sector || 'Setor não informado'}
                    </span>
                    <span style="background:var(--gray-light);padding:5px 10px;border-radius:20px;font-size:0.85rem;">
                        ${companyEvaluations.length} avaliações
                    </span>
                </div>
            </div>
            
            <div>
                <h4 style="color:var(--dark);margin-bottom:15px;">
                    Avaliações (${companyEvaluations.length})
                </h4>
                ${companyEvaluations.length > 0 ? 
                    `<div style="max-height:300px;overflow-y:auto;padding-right:10px;">
                        ${companyEvaluations.map(eval => `
                            <div style="background:var(--light);padding:15px;border-radius:var(--radius);margin-bottom:10px;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                    <strong>${eval.anonima ? 'Usuário Anônimo' : eval.userName}</strong>
                                    <div style="color:#FFD700;">
                                        ${'★'.repeat(eval.rating)}${'☆'.repeat(5 - eval.rating)}
                                    </div>
                                </div>
                                <p style="margin-bottom:8px;font-size:0.95rem;">${eval.text}</p>
                                <small style="color:var(--gray);">
                                    ${new Date(eval.date).toLocaleDateString('pt-BR')}
                                </small>
                            </div>
                        `).join('')}
                    </div>` :
                    `<p style="text-align:center;color:var(--gray);padding:20px;">
                        <i class="fas fa-star" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>
                        Nenhuma avaliação disponível. Seja o primeiro a avaliar!
                    </p>`
                }
            </div>
            
            <div style="margin-top:20px;text-align:center;">
                <button onclick="closeModal()" class="btn btn-primary">Fechar</button>
                ${window.currentUser ? `
                    <button onclick="window.location.href='avaliacao.html?company=${encodeURIComponent(company.name)}'; closeModal();" class="btn btn-success" style="margin-left:10px;">
                        <i class="fas fa-star"></i> Avaliar esta Empresa
                    </button>
                ` : `
                    <button onclick="showAuthModal(); closeModal();" class="btn btn-warning" style="margin-left:10px;">
                        <i class="fas fa-sign-in-alt"></i> Entrar para Avaliar
                    </button>
                `}
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

// ==================== PÁGINA DE AVALIAÇÃO ====================
function initEvaluationPage() {
    console.log('⭐ Inicializando página de avaliação...');
    
    // Configura autocomplete
    setupCompanyAutocomplete();
    
    // Preenche setores
    const sectorSelect = document.getElementById('evaluate-sector');
    if (sectorSelect) {
        const setoresUnicos = [...new Set(companies.map(c => c.sector).filter(Boolean))];
        setoresUnicos.forEach(setor => {
            if (!Array.from(sectorSelect.options).some(opt => opt.value === setor)) {
                const option = document.createElement('option');
                option.value = setor;
                option.textContent = setor;
                sectorSelect.appendChild(option);
            }
        });
    }
    
    // Configura campos opcionais
    initOptionalFields();
    
    // Preenche empresa se vier por parâmetro
    const urlParams = new URLSearchParams(window.location.search);
    const companyParam = urlParams.get('company');
    if (companyParam) {
        document.getElementById('evaluate-company').value = decodeURIComponent(companyParam);
    }
}

function setupCompanyAutocomplete() {
    const input = document.getElementById('evaluate-company');
    if (!input) return;
    
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
    
    input.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
        
        if (searchTerm.length < 2) return;
        
        const filtered = companies.filter(company =>
            company.name.toLowerCase().includes(searchTerm)
        ).slice(0, 5);
        
        if (filtered.length > 0) {
            suggestions.innerHTML = filtered.map(company => `
                <div style="padding:10px;cursor:pointer;border-bottom:1px solid var(--gray-light);" 
                     onmouseover="this.style.background='var(--gray-light)';" 
                     onmouseout="this.style.background='white';"
                     onclick="selectCompanySuggestion('${company.name}')">
                    <div style="font-weight:500;">${company.name}</div>
                    <small style="color:var(--gray);">
                        ${company.sector || 'Setor não informado'} • ${company.location || 'Localização não informada'}
                    </small>
                </div>
            `).join('');
            
            suggestions.style.display = 'block';
            suggestions.style.top = `${input.offsetTop + input.offsetHeight + 5}px`;
            suggestions.style.left = `${input.offsetLeft}px`;
        }
    });
    
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
    
    const company = companies.find(c => c.name === companyName);
    if (company && company.sector) {
        const sectorSelect = document.getElementById('evaluate-sector');
        if (sectorSelect) sectorSelect.value = company.sector;
    }
}

function initOptionalFields() {
    // Ambiente
    document.querySelectorAll('.ambient-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.ambient-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Benefícios
    document.querySelectorAll('.benefit-checkbox').forEach(benefit => {
        benefit.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });
    
    // Benefício customizado
    const addBenefitBtn = document.getElementById('add-custom-benefit-btn');
    const customBenefitInput = document.getElementById('custom-benefit');
    
    if (addBenefitBtn && customBenefitInput) {
        addBenefitBtn.addEventListener('click', addCustomBenefit);
        customBenefitInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addCustomBenefit();
                e.preventDefault();
            }
        });
    }
    
    // Carrega rascunho
    loadEvaluationDraft();
}

function addCustomBenefit() {
    const input = document.getElementById('custom-benefit');
    const benefit = input.value.trim();
    const list = document.getElementById('custom-benefits-list');
    
    if (benefit && list) {
        const tag = document.createElement('div');
        tag.className = 'custom-benefit-tag';
        tag.innerHTML = `
            ${benefit}
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;font-size:1rem;padding:0;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">&times;</button>
        `;
        list.appendChild(tag);
        input.value = '';
        showToast('Benefício adicionado!', 'success');
    }
}

function loadEvaluationDraft() {
    const draft = JSON.parse(localStorage.getItem('reputai_evaluation_draft') || 'null');
    if (draft) {
        if (draft.companyName) document.getElementById('evaluate-company').value = draft.companyName;
        if (draft.sector) document.getElementById('evaluate-sector').value = draft.sector;
        if (draft.location) document.getElementById('evaluate-location').value = draft.location;
        if (draft.text) document.getElementById('evaluation-text').value = draft.text;
        showToast('Rascunho carregado', 'info');
    }
}

function saveEvaluationDraft() {
    const draft = {
        companyName: document.getElementById('evaluate-company')?.value || '',
        sector: document.getElementById('evaluate-sector')?.value || '',
        location: document.getElementById('evaluate-location')?.value || '',
        text: document.getElementById('evaluation-text')?.value || '',
        savedAt: new Date().toISOString()
    };
    localStorage.setItem('reputai_evaluation_draft', JSON.stringify(draft));
}

// ==================== ENVIO DE AVALIAÇÃO ====================
function submitEvaluation() {
    if (!window.currentUser) {
        showToast('Faça login para avaliar', 'info');
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
    const isAnonima = document.getElementById('avaliacao-anonima')?.checked || false;
    
    // Coleta dados opcionais
    const ambient = document.querySelector('.ambient-option.selected')?.getAttribute('data-value');
    const benefits = Array.from(document.querySelectorAll('.benefit-checkbox.selected')).map(b => b.getAttribute('data-value'));
    const customBenefits = Array.from(document.querySelectorAll('.custom-benefit-tag')).map(tag => tag.textContent.trim().replace('×', ''));
    const salaryAmount = document.getElementById('salary-amount')?.value || '';
    const salaryPeriod = document.getElementById('salary-period')?.value || 'mensal';
    
    // Cria avaliação
    const evaluation = {
        id: Date.now(),
        companyName: companyName,
        rating: rating,
        text: text,
        sector: sector,
        location: location,
        userId: window.currentUser.id,
        userName: isAnonima ? 'Usuário Anônimo' : window.currentUser.name,
        userEmail: window.currentUser.email,
        date: new Date().toISOString(),
        anonima: isAnonima,
        ambient: ambient,
        benefits: [...benefits, ...customBenefits],
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
        // Cria nova empresa
        company = {
            id: companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1,
            name: companyName,
            sector: sector,
            location: location,
            lat: -15 + (Math.random() - 0.5) * 20,
            lng: -50 + (Math.random() - 0.5) * 20,
            averageRating: rating,
            reviewCount: 1,
            description: `Empresa cadastrada através de avaliação - Setor: ${sector}`,
            dataCadastro: new Date().toISOString()
        };
        companies.push(company);
    } else {
        // Atualiza empresa existente
        const companyEvaluations = evaluations.filter(e => 
            e.companyName.toLowerCase() === companyName.toLowerCase()
        );
        
        if (companyEvaluations.length > 0) {
            const totalRating = companyEvaluations.reduce((sum, e) => sum + e.rating, 0);
            company.averageRating = totalRating / companyEvaluations.length;
            company.reviewCount = companyEvaluations.length;
        }
    }
    
    localStorage.setItem('reputai_companies', JSON.stringify(companies));
    
    // Limpa formulário
    localStorage.removeItem('reputai_evaluation_draft');
    document.getElementById('evaluate-company').value = '';
    document.getElementById('evaluate-sector').value = '';
    document.getElementById('evaluate-location').value = '';
    document.getElementById('evaluation-text').value = '';
    document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);
    document.querySelectorAll('.ambient-option').forEach(o => o.classList.remove('selected'));
    document.querySelectorAll('.benefit-checkbox').forEach(b => b.classList.remove('selected'));
    document.getElementById('custom-benefits-list').innerHTML = '';
    
    hideAvisoModal();
    showToast('✅ Avaliação enviada com sucesso!', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// ==================== PÁGINA DE EMPRESAS ====================
function initCompaniesPage() {
    console.log('🏢 Inicializando página de empresas...');
    
    // Carrega estatísticas
    carregarEstatisticas();
    
    // Carrega todas as empresas
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    displayCompanies(companies);
    
    // Configura filtros
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', filtrarEmpresas);
    }
    
    const filterInputs = ['filter-name', 'filter-location'];
    filterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') filtrarEmpresas();
            });
        }
    });
}

function carregarEstatisticas() {
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    
    const totalEmpresas = document.getElementById('total-empresas');
    const totalAvaliacoes = document.getElementById('total-avaliacoes');
    const mediaGeral = document.getElementById('media-geral');
    const setores = document.getElementById('setores');
    
    if (totalEmpresas) totalEmpresas.textContent = companies.length;
    if (totalAvaliacoes) totalAvaliacoes.textContent = evaluations.length;
    
    // Calcula média geral
    const avg = evaluations.length > 0 ? 
        (evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length).toFixed(1) : '0.0';
    if (mediaGeral) mediaGeral.textContent = avg;
    
    // Conta setores únicos
    const setoresUnicos = [...new Set(companies.map(c => c.sector))].filter(s => s);
    if (setores) setores.textContent = setoresUnicos.length;
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
    }
    
    // Exibir empresas
    displayCompanies(filtered);
    
    const noCompanies = document.getElementById('no-companies');
    if (noCompanies) {
        noCompanies.style.display = filtered.length === 0 ? 'block' : 'none';
    }
    
    showToast(`${filtered.length} empresas encontradas`, 'info');
}

// ==================== FUNÇÕES UTILITÁRIAS ====================
function setupSearch() {
    const searchBtn = document.querySelector('.btn-search');
    const searchInput = document.getElementById('search-company');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', searchCompanies);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchCompanies();
        });
    }
    
    const filterTags = document.querySelectorAll('.filter-tag');
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const sector = this.getAttribute('data-sector');
            filterBySector(sector);
        });
    });
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
        company.sector.toLowerCase().includes(searchTerm) ||
        company.location.toLowerCase().includes(searchTerm)
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
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const filtered = companies.filter(company => company.sector === sector);
    displayCompanies(filtered);
    
    if (map) {
        addCompaniesToMap(filtered);
    }
    
    showToast(`Filtrado por: ${sector}`, 'info');
}

function setupCommonEvents() {
    // Configurar botão de login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAuthModal();
        });
    }
    
    // Fechar modais
    document.addEventListener('click', function(e) {
        // Fechar ao clicar no X
        if (e.target.classList.contains('modal-close')) {
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                if (modal.id === 'auth-modal') hideAuthModal();
                else if (modal.id === 'termos-modal') hideTermosModal();
                else if (modal.id === 'aviso-modal') hideAvisoModal();
                else {
                    modal.classList.remove('active');
                    setTimeout(() => modal.style.display = 'none', 300);
                }
            }
        }
        
        // Fechar ao clicar fora
        if (e.target.classList.contains('modal-overlay')) {
            if (e.target.id === 'auth-modal') hideAuthModal();
            else if (e.target.id === 'termos-modal') hideTermosModal();
            else if (e.target.id === 'aviso-modal') hideAvisoModal();
        }
    });
}

function showToast(message, type = 'info') {
    console.log(`📢 [${type}]: ${message}`);
    
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
    const colors = { success: '#10b981', error: '#dc2626', info: '#3b82f6' };
    
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
}

function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// ==================== EXPORTAÇÕES GLOBAIS ====================
window.initApp = initApp;
window.showCompanyDetails = showCompanyDetails;
window.selectCompanySuggestion = selectCompanySuggestion;
window.addCustomBenefit = addCustomBenefit;
window.submitEvaluation = submitEvaluation;
window.hideAvisoModal = hideAvisoModal;
window.prosseguirAvaliacao = prosseguirAvaliacao;
window.filtrarEmpresas = filtrarEmpresas;
window.searchCompanies = searchCompanies;
window.filterBySector = filterBySector;
window.showToast = showToast;
window.showModal = showModal;
window.closeModal = closeModal;

// Inicializa quando DOM carrega
document.addEventListener('DOMContentLoaded', initApp);
console.log('✅ Sistema principal pronto');