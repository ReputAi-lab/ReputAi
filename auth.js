// auth.js - Sistema de autenticação com painel administrativo completo CORRIGIDO
let authModal = null;

// ==================== CREDENCIAIS DO ADMIN ====================
const ADMIN_CREDENTIALS = {
    email: "gusta2206@admin.com",
    password: "B@tata123",
    name: "Administrador",
    avatar: "👑",
    isAdmin: true
};

// ==================== MODAL DE AUTENTICAÇÃO ====================
function showAuthModal(e) {
    if (e) e.preventDefault();
    
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        authModal = modal;
        
        // Mostrar formulário de login por padrão
        showLoginForm();
        
        // Focar no campo de email
        setTimeout(() => {
            const emailInput = document.getElementById('login-email');
            if (emailInput) emailInput.focus();
        }, 100);
    }
}

function hideAuthModal() {
    if (authModal) {
        authModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function showLoginForm() {
    document.getElementById('login-tab').style.display = 'block';
    document.getElementById('register-tab').style.display = 'none';
    
    // Limpar campos
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    
    // Focar no email
    setTimeout(() => {
        document.getElementById('login-email').focus();
    }, 50);
}

function showRegisterForm() {
    document.getElementById('login-tab').style.display = 'none';
    document.getElementById('register-tab').style.display = 'block';
    
    // Limpar campos
    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    
    // Focar no nome
    setTimeout(() => {
        document.getElementById('register-name').focus();
    }, 50);
}

// ==================== SISTEMA DE LOGIN/REGISTRO ====================
function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Validações básicas
    if (!email || !password) {
        showToast('Preencha email e senha', 'error');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Digite um email válido', 'error');
        return;
    }
    
    // VERIFICAÇÃO DO ADMIN (CREDENCIAIS ESPECÍFICAS)
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        // Login como administrador
        currentUser = {
            id: 9999,
            name: ADMIN_CREDENTIALS.name,
            email: ADMIN_CREDENTIALS.email,
            avatar: ADMIN_CREDENTIALS.avatar,
            isAdmin: true,
            joined: new Date().toISOString(),
            permissions: ['all']
        };
        
        // Salvar sessão
        localStorage.setItem('reputai_user', JSON.stringify(currentUser));
        
        showToast(`👑 Bem-vindo, Administrador!`, 'success');
        hideAuthModal();
        updateUserInterface();
        return;
    }
    
    // Verificar se usuário existe (usuários normais)
    const savedUsers = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    const user = savedUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Login bem-sucedido para usuário normal
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.name.charAt(0).toUpperCase(),
            joined: user.joined,
            isAdmin: false,
            permissions: []
        };
        
        // Salvar sessão
        localStorage.setItem('reputai_user', JSON.stringify(currentUser));
        
        showToast(`Bem-vindo de volta, ${currentUser.name}!`, 'success');
        hideAuthModal();
        updateUserInterface();
    } else {
        showToast('Email ou senha incorretos', 'error');
    }
}

function register() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    
    // Validações
    if (!name || !email || !password) {
        showToast('Preencha todos os campos', 'error');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Digite um email válido', 'error');
        return;
    }
    
    // Validar senha
    if (password.length < 6) {
        showToast('A senha deve ter no mínimo 6 caracteres', 'error');
        return;
    }
    
    // Verificar se email já está cadastrado
    const savedUsers = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    if (savedUsers.some(u => u.email === email)) {
        showToast('Este email já está cadastrado', 'error');
        return;
    }
    
    // Criar novo usuário
    const newUser = {
        id: savedUsers.length > 0 ? Math.max(...savedUsers.map(u => u.id)) + 1 : 1,
        name: name,
        email: email,
        password: password,
        joined: new Date().toISOString(),
        evaluations: []
    };
    
    // Salvar usuário
    savedUsers.push(newUser);
    localStorage.setItem('reputai_users', JSON.stringify(savedUsers));
    
    // Fazer login automaticamente
    currentUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.name.charAt(0).toUpperCase(),
        joined: newUser.joined,
        isAdmin: false,
        permissions: []
    };
    
    // Salvar sessão
    localStorage.setItem('reputai_user', JSON.stringify(currentUser));
    
    showToast(`Conta criada com sucesso, ${currentUser.name}!`, 'success');
    hideAuthModal();
    updateUserInterface();
}

// ==================== GERENCIAMENTO DE USUÁRIO ====================
function checkUserLogin() {
    const savedUser = localStorage.getItem('reputai_user');
    
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            
            // Verificar se é um usuário válido
            if (user.email && user.name) {
                // NÃO permitir auto-login do admin
                if (user.isAdmin && user.email === ADMIN_CREDENTIALS.email) {
                    // Admin precisa fazer login novamente
                    localStorage.removeItem('reputai_user');
                    currentUser = null;
                    showToast('Admin: Por favor, faça login novamente', 'info');
                } else {
                    currentUser = user;
                }
            } else {
                // Dados inválidos, remover
                localStorage.removeItem('reputai_user');
                currentUser = null;
            }
        } catch (e) {
            console.error('Erro ao carregar usuário:', e);
            localStorage.removeItem('reputai_user');
            currentUser = null;
        }
    }
    
    updateUserInterface();
}

function updateUserInterface() {
    const loginBtn = document.getElementById('login-btn');
    const userAvatar = document.getElementById('user-avatar');
    const userMenu = document.getElementById('user-menu');
    
    if (currentUser) {
        // Usuário logado
        if (loginBtn) loginBtn.style.display = 'none';
        
        if (userAvatar) {
            userAvatar.style.display = 'flex';
            userAvatar.innerHTML = currentUser.avatar;
            userAvatar.title = `${currentUser.name}${currentUser.isAdmin ? ' (Admin)' : ''}`;
            userAvatar.setAttribute('aria-label', `Perfil de ${currentUser.name}`);
            
            // Estilo especial para admin
            if (currentUser.isAdmin) {
                userAvatar.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
                userAvatar.style.borderColor = '#fca5a5';
                userAvatar.style.boxShadow = '0 0 10px rgba(220, 38, 38, 0.5)';
            } else {
                userAvatar.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
                userAvatar.style.borderColor = '#e2e8f0';
            }
        }
    } else {
        // Usuário não logado
        if (loginBtn) loginBtn.style.display = 'flex';
        if (userAvatar) userAvatar.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'none';
            userMenu.classList.remove('active');
        }
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    const userAvatar = document.getElementById('user-avatar');
    
    if (!menu || !userAvatar || !currentUser) return;
    
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
        menu.style.display = 'none';
    } else {
        // Atualizar conteúdo do menu
        updateUserMenuContent();
        
        menu.classList.add('active');
        menu.style.display = 'block';
        
        // Posicionar menu
        const avatarRect = userAvatar.getBoundingClientRect();
        menu.style.top = `${avatarRect.bottom + 5}px`;
        menu.style.right = `${window.innerWidth - avatarRect.right}px`;
        
        // Fechar menu ao clicar fora
        setTimeout(() => {
            const closeMenuHandler = (e) => {
                if (!menu.contains(e.target) && !userAvatar.contains(e.target)) {
                    menu.classList.remove('active');
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeMenuHandler);
                }
            };
            document.addEventListener('click', closeMenuHandler);
        }, 100);
    }
}

function updateUserMenuContent() {
    const menu = document.getElementById('user-menu');
    if (!menu || !currentUser) return;
    
    menu.innerHTML = `
        <div class="user-info">
            <div class="user-avatar-small" style="
                width: 40px; 
                height: 40px; 
                background: ${currentUser.isAdmin ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #3b82f6, #2563eb)'}; 
                color: white; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-weight: bold;
                font-size: ${currentUser.isAdmin ? '1.2rem' : '1rem'};
            ">
                ${currentUser.avatar}
            </div>
            <div>
                <strong>${currentUser.name}${currentUser.isAdmin ? ' 👑' : ''}</strong>
                <br>
                <small>${currentUser.email}</small>
            </div>
        </div>
        <hr style="margin: 10px 0; border: none; border-top: 1px solid var(--gray-light);">
        ${currentUser.isAdmin ? `
            <a href="#" onclick="showAdminPanelFromAuth(); return false;" class="menu-item">
                <i class="fas fa-crown" style="color: #f59e0b;"></i> Painel Administrativo
            </a>
            <a href="#" onclick="manageCompaniesFromAuth(); return false;" class="menu-item">
                <i class="fas fa-building"></i> Gerenciar Empresas
            </a>
            <a href="#" onclick="viewStatisticsFromAuth(); return false;" class="menu-item">
                <i class="fas fa-chart-bar"></i> Estatísticas
            </a>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid var(--gray-light);">
        ` : ''}
        <a href="#" onclick="showMyEvaluations(); return false;" class="menu-item">
            <i class="fas fa-star"></i> Minhas Avaliações
        </a>
        <a href="#" onclick="logout(); return false;" class="menu-item" style="color: var(--danger);">
            <i class="fas fa-sign-out-alt"></i> Sair
        </a>
    `;
}

function showMyEvaluations() {
    if (!currentUser) return;
    
    // Obter avaliações do usuário atual
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const userEvaluations = evaluations.filter(eval => eval.userId === currentUser.id);
    
    if (userEvaluations.length === 0) {
        const modalContent = `
            <div style="padding: 2rem; text-align: center;">
                <i class="fas fa-star" style="font-size: 3rem; color: var(--gray-light); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--dark); margin-bottom: 0.5rem;">Nenhuma avaliação ainda</h3>
                <p style="color: var(--gray);">Você ainda não avaliou nenhuma empresa.</p>
                <button onclick="closeModal()" style="margin-top: 1rem; background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer;">
                    Fechar
                </button>
            </div>
        `;
        
        showModal(modalContent);
        return;
    }
    
    const modalContent = `
        <div style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <div style="padding: 1.5rem; border-bottom: 2px solid var(--gray-light);">
                <h3 style="margin: 0; color: var(--dark);">
                    Minhas Avaliações (${userEvaluations.length})
                </h3>
            </div>
            
            <div style="padding: 1.5rem;">
                ${userEvaluations.map(eval => {
                    const company = companies.find(c => c.id === eval.companyId);
                    return `
                        <div style="background: var(--light); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <h4 style="margin: 0; color: var(--dark);">${company?.name || 'Empresa desconhecida'}</h4>
                                <div style="color: #FFD700;">
                                    ${'★'.repeat(eval.rating)}${'☆'.repeat(5 - eval.rating)}
                                </div>
                            </div>
                            <p style="color: var(--text); margin-bottom: 0.5rem; font-size: 0.95rem;">${eval.text}</p>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <small style="color: var(--gray);">
                                    ${new Date(eval.date).toLocaleDateString('pt-BR')}
                                </small>
                                <button onclick="deleteEvaluation(${eval.id})" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                                    Excluir
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="padding: 1rem; border-top: 1px solid var(--gray-light); text-align: center;">
                <button onclick="closeModal()" style="background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer;">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
    toggleUserMenu();
}

function deleteEvaluation(evaluationId) {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;
    
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const updatedEvaluations = evaluations.filter(e => e.id !== evaluationId);
    
    localStorage.setItem('reputai_evaluations', JSON.stringify(updatedEvaluations));
    showToast('Avaliação excluída com sucesso', 'success');
    
    // Recarregar minhas avaliações
    setTimeout(() => {
        showMyEvaluations();
    }, 500);
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        currentUser = null;
        localStorage.removeItem('reputai_user');
        
        showToast('Você saiu da sua conta', 'info');
        updateUserInterface();
        toggleUserMenu();
    }
}

// ==================== PAINEL ADMINISTRATIVO ====================
function showAdminPanelFromAuth() {
    if (!currentUser || !currentUser.isAdmin) {
        showToast('Acesso negado', 'error');
        return;
    }
    
    // Coletar estatísticas
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const users = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    
    const totalCompanies = companies.length;
    const totalEvaluations = evaluations.length;
    const totalUsers = users.length + 1; // +1 para admin
    
    // Empresa mais avaliada
    let mostReviewed = null;
    if (companies.length > 0) {
        mostReviewed = companies.reduce((prev, current) => 
            (prev.reviewCount || 0) > (current.reviewCount || 0) ? prev : current
        );
    }
    
    // Melhor avaliação
    let bestRated = null;
    const companiesWithReviews = companies.filter(c => (c.reviewCount || 0) > 0);
    if (companiesWithReviews.length > 0) {
        bestRated = companiesWithReviews.reduce((prev, current) => 
            (prev.averageRating || 0) > (current.averageRating || 0) ? prev : current
        );
    }
    
    const modalContent = `
        <div style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div style="padding: 2rem; border-bottom: 2px solid var(--gray-light);">
                <h2 style="margin: 0; color: var(--dark); display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-crown" style="color: #f59e0b;"></i>
                    Painel Administrativo
                </h2>
                <p style="color: var(--gray); margin-top: 5px;">
                    Último acesso: ${new Date().toLocaleString('pt-BR')}
                </p>
            </div>
            
            <div style="padding: 2rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 1.5rem; border-radius: var(--radius); text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: bold;">${totalCompanies}</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">Empresas</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 1.5rem; border-radius: var(--radius); text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: bold;">${totalEvaluations}</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">Avaliações</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 1.5rem; border-radius: var(--radius); text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: bold;">${totalUsers}</div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">Usuários</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    ${bestRated ? `
                        <div style="background: var(--light); padding: 1.5rem; border-radius: var(--radius);">
                            <h4 style="margin-bottom: 1rem; color: var(--dark); display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-star" style="color: #FFD700;"></i>
                                Melhor Avaliada
                            </h4>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #2563eb); 
                                          color: white; border-radius: 12px; display: flex; align-items: center; 
                                          justify-content: center; font-weight: bold; font-size: 1.2rem;">
                                    ${bestRated.logo || bestRated.name.substring(0, 2)}
                                </div>
                                <div>
                                    <strong>${bestRated.name}</strong>
                                    <div style="color: #FFD700; margin: 5px 0; font-size: 1.2rem;">
                                        ${'★'.repeat(Math.floor(bestRated.averageRating || 0))}
                                        ${'☆'.repeat(5 - Math.floor(bestRated.averageRating || 0))}
                                    </div>
                                    <div style="color: var(--gray);">
                                        ${(bestRated.averageRating || 0).toFixed(1)}/5 • ${bestRated.reviewCount} avaliações
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${mostReviewed && mostReviewed.reviewCount > 0 ? `
                        <div style="background: var(--light); padding: 1.5rem; border-radius: var(--radius);">
                            <h4 style="margin-bottom: 1rem; color: var(--dark); display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-comments" style="color: var(--primary);"></i>
                                Mais Avaliada
                            </h4>
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #2563eb); 
                                          color: white; border-radius: 12px; display: flex; align-items: center; 
                                          justify-content: center; font-weight: bold; font-size: 1.2rem;">
                                    ${mostReviewed.logo || mostReviewed.name.substring(0, 2)}
                                </div>
                                <div>
                                    <strong>${mostReviewed.name}</strong>
                                    <div style="color: var(--gray); margin: 5px 0;">
                                        ${mostReviewed.reviewCount} avaliações
                                    </div>
                                    <div style="color: #FFD700; font-size: 1.1rem;">
                                        ${'★'.repeat(Math.floor(mostReviewed.averageRating || 0))}
                                        ${'☆'.repeat(5 - Math.floor(mostReviewed.averageRating || 0))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 2rem;">
                    <h4 style="margin-bottom: 1rem; color: var(--dark);">Ações Administrativas</h4>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <button onclick="manageCompaniesFromAuth()" style="flex: 1; min-width: 150px; background: var(--primary); color: white; border: none; padding: 12px; border-radius: var(--radius); cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-building"></i> Empresas
                        </button>
                        <button onclick="viewStatisticsFromAuth()" style="flex: 1; min-width: 150px; background: var(--success); color: white; border: none; padding: 12px; border-radius: var(--radius); cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-chart-bar"></i> Estatísticas
                        </button>
                        <button onclick="manageUsersFromAuth()" style="flex: 1; min-width: 150px; background: var(--warning); color: white; border: none; padding: 12px; border-radius: var(--radius); cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-users"></i> Usuários
                        </button>
                        <button onclick="exportDataFromAuth()" style="flex: 1; min-width: 150px; background: var(--danger); color: white; border: none; padding: 12px; border-radius: var(--radius); cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="fas fa-download"></i> Exportar
                        </button>
                    </div>
                </div>
                
                <div style="margin-top: 2rem; padding: 1.5rem; background: var(--light); border-radius: var(--radius);">
                    <h4 style="margin-bottom: 1rem; color: var(--dark);">Ações Rápidas</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <button onclick="addCompanyAdmin()" style="background: white; border: 2px solid var(--primary); color: var(--primary); padding: 10px; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                            <i class="fas fa-plus"></i> Nova Empresa
                        </button>
                        <button onclick="clearAllData()" style="background: white; border: 2px solid var(--danger); color: var(--danger); padding: 10px; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                            <i class="fas fa-trash"></i> Limpar Dados
                        </button>
                        <button onclick="generateTestData()" style="background: white; border: 2px solid var(--success); color: var(--success); padding: 10px; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                            <i class="fas fa-vial"></i> Dados de Teste
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalContent);
    toggleUserMenu();
}

// ==================== FUNÇÕES DO PAINEL ADMIN ====================
function manageCompaniesFromAuth() {
    if (!currentUser || !currentUser.isAdmin) {
        showToast('Acesso negado', 'error');
        return;
    }
    
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    
    const modalContent = `
        <div style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
            <div style="padding: 1.5rem; border-bottom: 2px solid var(--gray-light); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; color: var(--dark); display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-building"></i>
                    Gerenciar Empresas (${companies.length})
                </h3>
                <button onclick="addCompanyAdmin()" style="background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                    <i class="fas fa-plus"></i> Nova
                </button>
            </div>
            
            <div style="padding: 1.5rem;">
                ${companies.length === 0 ? 
                    '<div style="text-align: center; padding: 3rem; color: var(--gray);">Nenhuma empresa cadastrada</div>' : 
                    companies.map(company => `
                        <div style="background: var(--light); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                    ${company.logo || company.name.substring(0, 2)}
                                </div>
                                <div>
                                    <strong>${company.name}</strong>
                                    <div style="font-size: 0.9rem; color: var(--gray); margin-top: 5px;">
                                        ${company.sector} • ${company.location}
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--gray); margin-top: 5px;">
                                        ${company.reviewCount || 0} avaliações • ${(company.averageRating || 0).toFixed(1)}/5
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button onclick="editCompanyAdmin(${company.id})" style="background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-left: 5px;">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteCompanyAdmin(${company.id})" style="background: var(--danger); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-left: 5px;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
            
            <div style="padding: 1rem; border-top: 1px solid var(--gray-light); text-align: center;">
                <button onclick="showAdminPanelFromAuth()" style="background: var(--gray-light); border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer; margin-right: 10px;">
                    <i class="fas fa-arrow-left"></i> Voltar
                </button>
                <button onclick="closeModal()" style="background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer;">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

function viewStatisticsFromAuth() {
    if (!currentUser || !currentUser.isAdmin) {
        showToast('Acesso negado', 'error');
        return;
    }
    
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const users = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    
    // Estatísticas por setor
    const sectorStats = {};
    companies.forEach(company => {
        sectorStats[company.sector] = (sectorStats[company.sector] || 0) + 1;
    });
    
    // Distribuição de avaliações
    const ratingDistribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    evaluations.forEach(eval => {
        const rating = Math.round(eval.rating);
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });
    
    // Crescimento de usuários
    const userGrowth = {};
    users.forEach(user => {
        const date = new Date(user.joined).toLocaleDateString('pt-BR');
        userGrowth[date] = (userGrowth[date] || 0) + 1;
    });
    
    const modalContent = `
        <div style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
            <div style="padding: 1.5rem; border-bottom: 2px solid var(--gray-light);">
                <h3 style="margin: 0; color: var(--dark); display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-chart-bar"></i>
                    Estatísticas Detalhadas
                </h3>
            </div>
            
            <div style="padding: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    <div>
                        <h4 style="margin-bottom: 1rem; color: var(--dark);">Empresas por Setor</h4>
                        ${Object.entries(sectorStats).map(([sector, count]) => `
                            <div style="margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span>${sector}</span>
                                    <span>${count}</span>
                                </div>
                                <div style="height: 8px; background: var(--gray-light); border-radius: 4px; overflow: hidden;">
                                    <div style="height: 100%; width: ${(count / companies.length) * 100}%; background: var(--primary);"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div>
                        <h4 style="margin-bottom: 1rem; color: var(--dark);">Distribuição de Avaliações</h4>
                        ${evaluations.length > 0 ? 
                            Object.entries(ratingDistribution).map(([rating, count]) => `
                                <div style="margin-bottom: 10px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                        <span>${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>
                                        <span>${count} (${((count / evaluations.length) * 100).toFixed(1)}%)</span>
                                    </div>
                                    <div style="height: 8px; background: var(--gray-light); border-radius: 4px; overflow: hidden;">
                                        <div style="height: 100%; width: ${(count / evaluations.length) * 100}%; background: #FFD700;"></div>
                                    </div>
                                </div>
                            `).join('') :
                            '<p style="color: var(--gray);">Nenhuma avaliação ainda</p>'
                        }
                    </div>
                </div>
                
                <div style="margin-top: 2rem;">
                    <h4 style="margin-bottom: 1rem; color: var(--dark);">Resumo Geral</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                        <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius);">
                            <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">${companies.length}</div>
                            <div style="color: var(--gray);">Empresas</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius);">
                            <div style="font-size: 2rem; font-weight: bold; color: var(--success);">${evaluations.length}</div>
                            <div style="color: var(--gray);">Avaliações</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius);">
                            <div style="font-size: 2rem; font-weight: bold; color: var(--warning);">${users.length + 1}</div>
                            <div style="color: var(--gray);">Usuários</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: var(--light); border-radius: var(--radius);">
                            <div style="font-size: 2rem; font-weight: bold; color: #FFD700;">
                                ${evaluations.length > 0 ? (evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length).toFixed(1) : '0.0'}
                            </div>
                            <div style="color: var(--gray);">Média Geral</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="padding: 1rem; border-top: 1px solid var(--gray-light); text-align: center;">
                <button onclick="showAdminPanelFromAuth()" style="background: var(--gray-light); border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer;">
                    <i class="fas fa-arrow-left"></i> Voltar ao Painel
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

function manageUsersFromAuth() {
    if (!currentUser || !currentUser.isAdmin) {
        showToast('Acesso negado', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    
    const modalContent = `
        <div style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
            <div style="padding: 1.5rem; border-bottom: 2px solid var(--gray-light);">
                <h3 style="margin: 0; color: var(--dark); display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-users"></i>
                    Gerenciar Usuários (${users.length})
                </h3>
            </div>
            
            <div style="padding: 1.5rem;">
                ${users.length === 0 ? 
                    '<div style="text-align: center; padding: 3rem; color: var(--gray);">Nenhum usuário cadastrado</div>' : 
                    users.map(user => `
                        <div style="background: var(--light); padding: 1rem; border-radius: var(--radius); margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                                        ${user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <strong>${user.name}</strong>
                                        <div style="font-size: 0.9rem; color: var(--gray); margin-top: 2px;">
                                            ${user.email}
                                        </div>
                                        <div style="font-size: 0.8rem; color: var(--gray); margin-top: 2px;">
                                            Cadastrado em: ${new Date(user.joined).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button onclick="deleteUserAdmin(${user.id})" style="background: var(--danger); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                                        <i class="fas fa-trash"></i> Remover
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
            
            <div style="padding: 1rem; border-top: 1px solid var(--gray-light); text-align: center;">
                <button onclick="showAdminPanelFromAuth()" style="background: var(--gray-light); border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer;">
                    <i class="fas fa-arrow-left"></i> Voltar
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

function exportDataFromAuth() {
    if (!currentUser || !currentUser.isAdmin) {
        showToast('Acesso negado', 'error');
        return;
    }
    
    const data = {
        companies: JSON.parse(localStorage.getItem('reputai_companies') || '[]'),
        evaluations: JSON.parse(localStorage.getItem('reputai_evaluations') || '[]'),
        users: JSON.parse(localStorage.getItem('reputai_users') || '[]'),
        exportDate: new Date().toISOString(),
        exportedBy: currentUser.name
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `reputai-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Dados exportados com sucesso!', 'success');
}

// ==================== FUNÇÕES ADMINISTRATIVAS ====================
function editCompanyAdmin(companyId) {
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const company = companies.find(c => c.id === companyId);
    
    if (!company) {
        showToast('Empresa não encontrada', 'error');
        return;
    }
    
    const modalContent = `
        <div style="max-width: 500px;">
            <div style="padding: 1.5rem; border-bottom: 2px solid var(--gray-light);">
                <h3 style="margin: 0; color: var(--dark);">
                    <i class="fas fa-edit"></i> Editar Empresa
                </h3>
            </div>
            
            <div style="padding: 1.5rem;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Nome da Empresa</label>
                    <input type="text" id="edit-company-name" value="${company.name}" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius);">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Setor</label>
                    <select id="edit-company-sector" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius);">
                        <option value="Tecnologia" ${company.sector === 'Tecnologia' ? 'selected' : ''}>Tecnologia</option>
                        <option value="Finanças" ${company.sector === 'Finanças' ? 'selected' : ''}>Finanças</option>
                        <option value="Saúde" ${company.sector === 'Saúde' ? 'selected' : ''}>Saúde</option>
                        <option value="Varejo" ${company.sector === 'Varejo' ? 'selected' : ''}>Varejo</option>
                        <option value="Serviços" ${company.sector === 'Serviços' ? 'selected' : ''}>Serviços</option>
                        <option value="Energia" ${company.sector === 'Energia' ? 'selected' : ''}>Energia</option>
                        <option value="Educação" ${company.sector === 'Educação' ? 'selected' : ''}>Educação</option>
                        <option value="Outros" ${company.sector === 'Outros' ? 'selected' : ''}>Outros</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Localização</label>
                    <input type="text" id="edit-company-location" value="${company.location}" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius);">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Descrição</label>
                    <textarea id="edit-company-description" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius); height: 100px;">${company.description}</textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Latitude</label>
                        <input type="number" id="edit-company-lat" value="${company.lat}" step="0.0001" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius);">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Longitude</label>
                        <input type="number" id="edit-company-lng" value="${company.lng}" step="0.0001" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius);">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Avaliação Média</label>
                        <input type="number" id="edit-company-rating" value="${company.averageRating}" min="0" max="5" step="0.1" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius);">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Nº de Avaliações</label>
                        <input type="number" id="edit-company-reviewcount" value="${company.reviewCount}" min="0" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius);">
                    </div>
                </div>
            </div>
            
            <div style="padding: 1rem; border-top: 1px solid var(--gray-light); display: flex; gap: 1rem;">
                <button onclick="saveCompanyEdit(${companyId})" style="flex: 1; background: var(--primary); color: white; border: none; padding: 12px; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                    <i class="fas fa-save"></i> Salvar
                </button>
                <button onclick="manageCompaniesFromAuth()" style="background: var(--gray-light); border: none; padding: 12px; border-radius: var(--radius); cursor: pointer;">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

function saveCompanyEdit(companyId) {
    const name = document.getElementById('edit-company-name').value.trim();
    const sector = document.getElementById('edit-company-sector').value;
    const location = document.getElementById('edit-company-location').value.trim();
    const description = document.getElementById('edit-company-description').value.trim();
    const lat = parseFloat(document.getElementById('edit-company-lat').value);
    const lng = parseFloat(document.getElementById('edit-company-lng').value);
    const averageRating = parseFloat(document.getElementById('edit-company-rating').value);
    const reviewCount = parseInt(document.getElementById('edit-company-reviewcount').value);
    
    if (!name || !sector || !location) {
        showToast('Preencha os campos obrigatórios', 'error');
        return;
    }
    
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const companyIndex = companies.findIndex(c => c.id === companyId);
    
    if (companyIndex === -1) {
        showToast('Empresa não encontrada', 'error');
        return;
    }
    
    companies[companyIndex] = {
        ...companies[companyIndex],
        name,
        sector,
        location,
        description,
        lat,
        lng,
        averageRating,
        reviewCount
    };
    
    localStorage.setItem('reputai_companies', JSON.stringify(companies));
    
    // Atualizar a lista global de empresas
    if (typeof window.companies !== 'undefined') {
        window.companies = companies;
        if (typeof displayCompanies === 'function') displayCompanies(companies);
        if (typeof addCompaniesToMap === 'function') addCompaniesToMap(companies);
    }
    
    showToast('Empresa atualizada com sucesso!', 'success');
    manageCompaniesFromAuth();
}

function deleteCompanyAdmin(companyId) {
    if (!confirm('Tem certeza que deseja excluir esta empresa? Todas as avaliações relacionadas também serão excluídas.')) return;
    
    // Remover empresa
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const updatedCompanies = companies.filter(c => c.id !== companyId);
    localStorage.setItem('reputai_companies', JSON.stringify(updatedCompanies));
    
    // Remover avaliações da empresa
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const updatedEvaluations = evaluations.filter(e => e.companyId !== companyId);
    localStorage.setItem('reputai_evaluations', JSON.stringify(updatedEvaluations));
    
    // Atualizar a lista global de empresas
    if (typeof window.companies !== 'undefined') {
        window.companies = updatedCompanies;
        if (typeof displayCompanies === 'function') displayCompanies(updatedCompanies);
        if (typeof addCompaniesToMap === 'function') addCompaniesToMap(updatedCompanies);
    }
    
    showToast('Empresa excluída com sucesso', 'success');
    manageCompaniesFromAuth();
}

function addCompanyAdmin() {
    const modalContent = `
        <div style="max-width: 500px;">
            <div style="padding: 1.5rem; border-bottom: 2px solid var(--gray-light);">
                <h3 style="margin: 0; color: var(--dark);">
                    <i class="fas fa-plus"></i> Adicionar Nova Empresa
                </h3>
            </div>
            
            <div style="padding: 1.5rem;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Nome da Empresa *</label>
                    <input type="text" id="new-company-name" placeholder="Nome da empresa" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius);">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Setor *</label>
                    <select id="new-company-sector" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius);">
                        <option value="">Selecione um setor</option>
                        <option value="Tecnologia">Tecnologia</option>
                        <option value="Finanças">Finanças</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Varejo">Varejo</option>
                        <option value="Serviços">Serviços</option>
                        <option value="Energia">Energia</option>
                        <option value="Educação">Educação</option>
                        <option value="Outros">Outros</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Localização *</label>
                    <input type="text" id="new-company-location" placeholder="Cidade, Estado" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius);">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Descrição</label>
                    <textarea id="new-company-description" placeholder="Descrição da empresa" style="width: 100%; padding: 10px; border: 2px solid var(--gray-light); border-radius: var(--radius); height: 100px;"></textarea>
                </div>
            </div>
            
            <div style="padding: 1rem; border-top: 1px solid var(--gray-light); display: flex; gap: 1rem;">
                <button onclick="saveNewCompany()" style="flex: 1; background: var(--primary); color: white; border: none; padding: 12px; border-radius: var(--radius); cursor: pointer; font-weight: 500;">
                    <i class="fas fa-save"></i> Salvar
                </button>
                <button onclick="manageCompaniesFromAuth()" style="background: var(--gray-light); border: none; padding: 12px; border-radius: var(--radius); cursor: pointer;">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

function saveNewCompany() {
    const name = document.getElementById('new-company-name').value.trim();
    const sector = document.getElementById('new-company-sector').value;
    const location = document.getElementById('new-company-location').value.trim();
    const description = document.getElementById('new-company-description').value.trim() || "Empresa cadastrada pelo administrador";
    
    if (!name || !sector || !location) {
        showToast('Preencha os campos obrigatórios', 'error');
        return;
    }
    
    const companies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    
    const newCompany = {
        id: companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1,
        name: name,
        sector: sector,
        location: location,
        lat: -15 + (Math.random() - 0.5) * 20,
        lng: -50 + (Math.random() - 0.5) * 20,
        logo: name.substring(0, 2).toUpperCase(),
        description: description,
        averageRating: 0,
        reviewCount: 0
    };
    
    companies.push(newCompany);
    localStorage.setItem('reputai_companies', JSON.stringify(companies));
    
    // Atualizar a lista global de empresas
    if (typeof window.companies !== 'undefined') {
        window.companies = companies;
        if (typeof displayCompanies === 'function') displayCompanies(companies);
        if (typeof addCompaniesToMap === 'function') addCompaniesToMap(companies);
    }
    
    showToast('Empresa adicionada com sucesso!', 'success');
    manageCompaniesFromAuth();
}

function deleteUserAdmin(userId) {
    if (!confirm('Tem certeza que deseja excluir este usuário? Todas as avaliações do usuário também serão excluídas.')) return;
    
    // Remover usuário
    const users = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('reputai_users', JSON.stringify(updatedUsers));
    
    // Remover avaliações do usuário
    const evaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const updatedEvaluations = evaluations.filter(e => e.userId !== userId);
    localStorage.setItem('reputai_evaluations', JSON.stringify(updatedEvaluations));
    
    showToast('Usuário excluído com sucesso', 'success');
    manageUsersFromAuth();
}

function clearAllData() {
    if (!confirm('⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nTem certeza que deseja limpar TODOS os dados?\n\nIsso excluirá todas as empresas, avaliações e usuários (exceto o admin).')) return;
    
    // Manter apenas o admin
    localStorage.removeItem('reputai_companies');
    localStorage.removeItem('reputai_evaluations');
    localStorage.removeItem('reputai_users');
    
    // Recarregar dados iniciais
    if (typeof loadCompanies === 'function') loadCompanies();
    
    showToast('Todos os dados foram limpos', 'success');
    showAdminPanelFromAuth();
}

function generateTestData() {
    if (!confirm('Deseja gerar dados de teste? Isso adicionará empresas e avaliações de exemplo.')) return;
    
    // Empresas de teste
    const testCompanies = [
        {
            id: 1001,
            name: "Tech Solutions BR",
            sector: "Tecnologia",
            location: "São Paulo, SP",
            lat: -23.5505,
            lng: -46.6333,
            description: "Empresa de tecnologia inovadora",
            averageRating: 4.5,
            reviewCount: 42
        },
        {
            id: 1002,
            name: "Health Care Plus",
            sector: "Saúde",
            location: "Rio de Janeiro, RJ",
            lat: -22.9068,
            lng: -43.1729,
            description: "Rede de saúde premium",
            averageRating: 4.2,
            reviewCount: 28
        },
        {
            id: 1003,
            name: "Eco Varejo",
            sector: "Varejo",
            location: "Curitiba, PR",
            lat: -25.4284,
            lng: -49.2733,
            description: "Varejo sustentável",
            averageRating: 4.7,
            reviewCount: 35
        }
    ];
    
    // Avaliações de teste
    const testEvaluations = [
        {
            id: 1001,
            companyId: 1001,
            userId: 100,
            userName: "Ana Silva",
            rating: 5,
            text: "Excelente ambiente de trabalho, muita inovação e oportunidades de crescimento.",
            date: new Date().toISOString()
        },
        {
            id: 1002,
            companyId: 1002,
            userId: 101,
            userName: "Carlos Santos",
            rating: 4,
            text: "Boa empresa, benefícios interessantes, mas carga horária pode ser pesada.",
            date: new Date().toISOString()
        }
    ];
    
    // Adicionar empresas de teste
    const existingCompanies = JSON.parse(localStorage.getItem('reputai_companies') || '[]');
    const allCompanies = [...existingCompanies, ...testCompanies];
    localStorage.setItem('reputai_companies', JSON.stringify(allCompanies));
    
    // Adicionar avaliações de teste
    const existingEvaluations = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const allEvaluations = [...existingEvaluations, ...testEvaluations];
    localStorage.setItem('reputai_evaluations', JSON.stringify(allEvaluations));
    
    // Atualizar a lista global de empresas
    if (typeof window.companies !== 'undefined') {
        window.companies = allCompanies;
        if (typeof displayCompanies === 'function') displayCompanies(allCompanies);
        if (typeof addCompaniesToMap === 'function') addCompaniesToMap(allCompanies);
    }
    
    showToast('Dados de teste gerados com sucesso!', 'success');
    showAdminPanelFromAuth();
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    // Verificar login ao carregar
    checkUserLogin();
    
    // Configurar eventos do modal
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) hideAuthModal();
        });
    }
    
    // Tecla ESC fecha modais
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAuthModal();
            const customModal = document.getElementById('custom-modal');
            if (customModal) closeModal();
        }
    });
    
    // Prevenir envio de formulário com Enter
    const forms = document.querySelectorAll('.tab-content input');
    forms.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.closest('#login-tab')) {
                    login();
                } else if (this.closest('#register-tab')) {
                    register();
                }
            }
        });
    });
});

// ==================== EXPORTAR FUNÇÕES GLOBAIS ====================
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.login = login;
window.register = register;
window.toggleUserMenu = toggleUserMenu;
window.showMyEvaluations = showMyEvaluations;
window.logout = logout;
window.showAdminPanelFromAuth = showAdminPanelFromAuth;
window.manageCompaniesFromAuth = manageCompaniesFromAuth;
window.viewStatisticsFromAuth = viewStatisticsFromAuth;
window.manageUsersFromAuth = manageUsersFromAuth;
window.exportDataFromAuth = exportDataFromAuth;
window.editCompanyAdmin = editCompanyAdmin;
window.deleteCompanyAdmin = deleteCompanyAdmin;
window.addCompanyAdmin = addCompanyAdmin;
window.saveNewCompany = saveNewCompany;
window.saveCompanyEdit = saveCompanyEdit;
window.deleteUserAdmin = deleteUserAdmin;
window.clearAllData = clearAllData;
window.generateTestData = generateTestData;
window.deleteEvaluation = deleteEvaluation;