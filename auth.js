// auth.js - Sistema de interface de autenticação
console.log('🔐 [auth] Carregando interface de autenticação...');

// ==================== VARIÁVEIS ====================
let authModal = null;
window.currentUser = null;
window.termosAceitos = false;

// ==================== SISTEMA UNIFICADO DE AUTENTICAÇÃO ====================
async function unifiedLogin(email, password) {
    console.log('🔐 Tentando login com:', email);
    
    // 1. Verificar admin local (para testes)
    if (email === "gusta2206@admin.com" && password === "B@tata123") {
        const adminData = {
            id: 9999,
            name: "Administrador",
            email: "gusta2206@admin.com",
            avatar: "👑",
            isAdmin: true,
            joined: new Date().toISOString(),
            provider: 'email'
        };
        
        localStorage.setItem('reputai_user', JSON.stringify(adminData));
        window.currentUser = adminData;
        
        return {
            success: true,
            user: adminData,
            message: '👑 Bem-vindo, Administrador!'
        };
    }
    
    // 2. Tentar Firebase
    if (typeof loginWithFirebase === 'function') {
        const result = await loginWithFirebase(email, password);
        if (result.success) {
            return result;
        }
    }
    
    // 3. Tentar usuários locais
    const savedUsers = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    const localUser = savedUsers.find(u => u.email === email && u.password === password);
    
    if (localUser) {
        const userData = {
            id: localUser.id,
            name: localUser.name,
            email: localUser.email,
            avatar: localUser.avatar || localUser.name.charAt(0).toUpperCase(),
            joined: localUser.joined,
            isAdmin: false,
            provider: 'email'
        };
        
        localStorage.setItem('reputai_user', JSON.stringify(userData));
        window.currentUser = userData;
        
        return {
            success: true,
            user: userData,
            message: `Bem-vindo de volta, ${userData.name}!`
        };
    }
    
    return {
        success: false,
        message: 'Email ou senha incorretos'
    };
}

async function unifiedRegister(name, email, password) {
    // 1. Tentar Firebase primeiro
    if (typeof registerWithFirebase === 'function') {
        const result = await registerWithFirebase(name, email, password);
        if (result.success) {
            return result;
        }
    }
    
    // 2. Fallback para localStorage
    const savedUsers = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    
    // Verificar se email já existe
    if (savedUsers.some(u => u.email === email)) {
        return {
            success: false,
            message: 'Este email já está cadastrado'
        };
    }
    
    // Criar novo usuário local
    const newUser = {
        id: savedUsers.length > 0 ? Math.max(...savedUsers.map(u => u.id)) + 1 : 1,
        name: name,
        email: email,
        password: password,
        avatar: name.charAt(0).toUpperCase(),
        joined: new Date().toISOString(),
        evaluations: []
    };
    
    savedUsers.push(newUser);
    localStorage.setItem('reputai_users', JSON.stringify(savedUsers));
    
    const userData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        joined: newUser.joined,
        isAdmin: false,
        provider: 'email'
    };
    
    localStorage.setItem('reputai_user', JSON.stringify(userData));
    window.currentUser = userData;
    
    return {
        success: true,
        user: userData,
        message: `Conta criada com sucesso, ${userData.name}!`
    };
}

// Função de logout unificada
async function logoutUser() {
    // Logout do Firebase se estiver conectado
    if (window.firebaseUser && typeof logoutFirebase === 'function') {
        await logoutFirebase();
    }
    
    // Limpar localStorage
    localStorage.removeItem('reputai_user');
    window.currentUser = null;
    window.termosAceitos = false;
    
    console.log('👋 Usuário deslogado do sistema');
    showToast('Você saiu da sua conta', 'info');
    
    setTimeout(() => {
        if (typeof updateUserInterface === 'function') {
            updateUserInterface();
        }
    }, 300);
}

// ==================== VERIFICAÇÃO INICIAL DE SESSÃO ====================
function initSessionCheck() {
    console.log('🔍 Verificando sessão do usuário...');
    
    // 1. Verificar localStorage
    const savedUser = localStorage.getItem('reputai_user');
    
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            window.currentUser = userData;
            console.log('👤 Usuário carregado do localStorage:', userData.email);
            
            // Verificar se é Firebase user
            if (userData.firebaseUser && window.firebaseAuth) {
                // Verificar se a sessão Firebase ainda é válida
                window.firebaseAuth.currentUser?.reload()
                    .then(() => {
                        console.log('✅ Sessão Firebase válida');
                    })
                    .catch(() => {
                        console.log('⚠️ Sessão Firebase expirada');
                        window.currentUser = null;
                        localStorage.removeItem('reputai_user');
                    });
            }
            
            // Verificar termos
            window.termosAceitos = localStorage.getItem(`reputai_termos_${userData.id}`) === 'true';
            
        } catch (e) {
            console.error('❌ Erro ao carregar usuário:', e);
            window.currentUser = null;
        }
    } else {
        console.log('👤 Nenhum usuário no localStorage');
        window.currentUser = null;
    }
    
    // 2. Atualizar interface
    setTimeout(() => {
        if (typeof updateUserInterface === 'function') {
            updateUserInterface();
        }
    }, 300);
}

// ==================== FUNÇÕES DO MODAL ====================
function showAuthModal(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('🔓 Abrindo modal de autenticação...');
    
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        authModal = modal;
        
        // Mostrar login por padrão
        showLoginForm();
        
        // Focar no email
        setTimeout(() => {
            const emailInput = document.getElementById('login-email');
            if (emailInput) {
                emailInput.focus();
            }
        }, 100);
        
        // Adicionar botões sociais
        if (typeof addSocialLoginButtons === 'function') {
            setTimeout(addSocialLoginButtons, 200);
        }
    } else {
        console.error('❌ Modal de autenticação não encontrado!');
    }
}

function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

function showLoginForm() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    
    if (loginTab) {
        loginTab.style.display = 'block';
        setTimeout(() => loginTab.classList.add('active'), 10);
    }
    
    if (registerTab) {
        registerTab.style.display = 'none';
        registerTab.classList.remove('active');
    }
    
    // Limpar campos
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
    
    // Focar no email
    setTimeout(() => {
        if (loginEmail) loginEmail.focus();
    }, 50);
}

function showRegisterForm() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    
    if (loginTab) {
        loginTab.style.display = 'none';
        loginTab.classList.remove('active');
    }
    
    if (registerTab) {
        registerTab.style.display = 'block';
        setTimeout(() => registerTab.classList.add('active'), 10);
    }
    
    // Limpar campos
    const registerName = document.getElementById('register-name');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    
    if (registerName) registerName.value = '';
    if (registerEmail) registerEmail.value = '';
    if (registerPassword) registerPassword.value = '';
    
    // Focar no nome
    setTimeout(() => {
        if (registerName) registerName.focus();
    }, 50);
}

// ==================== FUNÇÕES DE LOGIN/REGISTER ====================
function login() {
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        showToast('Preencha email e senha', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Digite um email válido', 'error');
        return;
    }
    
    console.log('🔐 Tentando login com:', email);
    
    if (typeof unifiedLogin === 'function') {
        const result = unifiedLogin(email, password);
        
        if (result.success) {
            showToast(result.message, 'success');
            hideAuthModal();
            
            setTimeout(() => {
                updateUserInterface();
                
                // Verificar termos de uso
                if (!window.termosAceitos) {
                    setTimeout(() => {
                        showTermosModal();
                    }, 1000);
                }
            }, 300);
        } else {
            showToast(result.message, 'error');
        }
    } else {
        showToast('Sistema de login não disponível', 'error');
    }
}

function register() {
    const name = document.getElementById('register-name')?.value.trim();
    const email = document.getElementById('register-email')?.value.trim();
    const password = document.getElementById('register-password')?.value;
    
    if (!name || !email || !password) {
        showToast('Preencha todos os campos', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Digite um email válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('A senha deve ter no mínimo 6 caracteres', 'error');
        return;
    }
    
    if (typeof unifiedRegister === 'function') {
        const result = unifiedRegister(name, email, password);
        
        if (result.success) {
            showToast(result.message, 'success');
            hideAuthModal();
            
            setTimeout(() => {
                updateUserInterface();
                
                // Mostrar termos de uso para novo usuário
                setTimeout(() => {
                    showTermosModal();
                }, 1000);
            }, 300);
        } else {
            showToast(result.message, 'error');
        }
    } else {
        showToast('Sistema de registro não disponível', 'error');
    }
}

// ==================== FUNÇÕES DE INTERFACE ====================
function updateUserInterface() {
    console.log('🔄 Atualizando interface do usuário...');
    
    const loginBtn = document.getElementById('login-btn');
    const userAvatar = document.getElementById('user-avatar');
    const userMenu = document.getElementById('user-menu');
    
    if (!loginBtn || !userAvatar) {
        console.warn('⚠️ Elementos de interface não encontrados');
        return;
    }
    
    const user = window.currentUser;
    
    if (user) {
        console.log('👤 Mostrando interface para usuário:', user.name);
        
        // Esconder botão de login
        loginBtn.style.display = 'none';
        
        // Mostrar avatar
        userAvatar.style.display = 'flex';
        
        // Configurar avatar
        if (user.photoURL && (user.provider === 'google' || user.provider === 'facebook')) {
            userAvatar.innerHTML = `
                <img src="${user.photoURL}" 
                     style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" 
                     alt="${user.name}"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${user.avatar || user.name.charAt(0)}</text></svg>'">
            `;
        } else {
            userAvatar.textContent = user.avatar || user.name.charAt(0).toUpperCase();
        }
        
        userAvatar.title = `${user.name}${user.isAdmin ? ' 👑' : ''}`;
        
        // Estilos especiais
        if (user.isAdmin) {
            userAvatar.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
            userAvatar.style.boxShadow = '0 0 10px rgba(220, 38, 38, 0.5)';
        } else if (user.provider === 'google') {
            userAvatar.style.background = 'linear-gradient(135deg, #4285F4, #34A853)';
        } else if (user.provider === 'facebook') {
            userAvatar.style.background = 'linear-gradient(135deg, #4267B2, #898F9C)';
        } else {
            userAvatar.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        }
        
        // Adicionar evento de clique
        userAvatar.onclick = toggleUserMenu;
        
        // Esconder menu se estiver aberto
        if (userMenu) {
            userMenu.style.display = 'none';
            userMenu.classList.remove('active');
        }
        
    } else {
        console.log('👤 Mostrando interface para visitante');
        
        // Mostrar botão de login
        loginBtn.style.display = 'flex';
        
        // Esconder avatar
        userAvatar.style.display = 'none';
        
        // Configurar evento no botão de login
        loginBtn.onclick = showAuthModal;
        
        // Esconder menu
        if (userMenu) {
            userMenu.style.display = 'none';
            userMenu.classList.remove('active');
        }
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    const userAvatar = document.getElementById('user-avatar');
    
    if (!menu || !userAvatar) return;
    
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
        setTimeout(() => {
            menu.style.display = 'none';
        }, 300);
    } else {
        updateUserMenuContent();
        
        menu.style.display = 'block';
        setTimeout(() => {
            menu.classList.add('active');
        }, 10);
        
        // Posicionar menu
        const avatarRect = userAvatar.getBoundingClientRect();
        menu.style.top = `${avatarRect.bottom + 5}px`;
        menu.style.right = `${window.innerWidth - avatarRect.right}px`;
        
        // Fechar menu ao clicar fora
        setTimeout(() => {
            const closeMenuHandler = (e) => {
                if (!menu.contains(e.target) && !userAvatar.contains(e.target)) {
                    menu.classList.remove('active');
                    setTimeout(() => {
                        menu.style.display = 'none';
                    }, 300);
                    document.removeEventListener('click', closeMenuHandler);
                }
            };
            document.addEventListener('click', closeMenuHandler);
        }, 100);
    }
}

function updateUserMenuContent() {
    const menu = document.getElementById('user-menu');
    const user = window.currentUser;
    
    if (!menu || !user) return;
    
    let avatarHTML = '';
    if (user.photoURL && (user.provider === 'google' || user.provider === 'facebook')) {
        avatarHTML = `
            <img src="${user.photoURL}" 
                 style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" 
                 alt="${user.name}"
                 onerror="this.style.display='none'">
        `;
    } else {
        const adminStyle = user.isAdmin ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 
                          user.provider === 'google' ? 'linear-gradient(135deg, #4285F4, #34A853)' :
                          user.provider === 'facebook' ? 'linear-gradient(135deg, #4267B2, #898F9C)' :
                          'linear-gradient(135deg, #3b82f6, #2563eb)';
        
        avatarHTML = `
            <div style="width: 40px; height: 40px; background: ${adminStyle}; color: white; 
                        border-radius: 50%; display: flex; align-items: center; 
                        justify-content: center; font-weight: bold; font-size: ${user.isAdmin ? '1.2rem' : '1rem'};">
                ${user.avatar || user.name.charAt(0).toUpperCase()}
            </div>
        `;
    }
    
    const providerBadge = user.provider === 'google' ? 
        '<span style="background: #DB4437; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin-left: 5px;">Google</span>' :
        user.provider === 'facebook' ? 
        '<span style="background: #4267B2; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; margin-left: 5px;">Facebook</span>' : '';
    
    const termosStatus = window.termosAceitos ? 
        '<span style="color: #10b981; font-size: 0.8rem;"><i class="fas fa-check-circle"></i> Termos aceitos</span>' :
        '<span style="color: #f59e0b; font-size: 0.8rem;"><i class="fas fa-exclamation-triangle"></i> Aceitar termos</span>';
    
    menu.innerHTML = `
        <div class="user-info" style="padding: 15px; border-bottom: 1px solid var(--gray-light);">
            <div style="display: flex; align-items: center; gap: 12px;">
                ${avatarHTML}
                <div>
                    <strong>${user.name}${user.isAdmin ? ' 👑' : ''}</strong>
                    <div style="font-size: 0.85rem; color: var(--gray); margin-top: 2px;">
                        ${user.email} ${providerBadge}
                    </div>
                    <small style="color: var(--gray); font-size: 0.75rem;">
                        Logado via ${user.provider || 'email'}
                    </small>
                    <div style="margin-top: 5px;">
                        ${termosStatus}
                    </div>
                </div>
            </div>
        </div>
        ${user.isAdmin ? `
            <a href="#" onclick="showAdminPanel(); return false;" class="menu-item">
                <i class="fas fa-crown" style="color: #f59e0b;"></i> Painel Administrativo
            </a>
            <a href="#" onclick="manageCompanies(); return false;" class="menu-item">
                <i class="fas fa-building"></i> Gerenciar Empresas
            </a>
            <a href="#" onclick="viewDenuncias(); return false;" class="menu-item">
                <i class="fas fa-flag"></i> Denúncias Pendentes
                <span id="denuncias-count" class="badge"></span>
            </a>
            <a href="#" onclick="viewStatistics(); return false;" class="menu-item">
                <i class="fas fa-chart-bar"></i> Estatísticas
            </a>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid var(--gray-light);">
        ` : ''}
        ${!window.termosAceitos ? `
            <a href="#" onclick="showTermosModal(); return false;" class="menu-item">
                <i class="fas fa-file-contract" style="color: #f59e0b;"></i> Ler e Aceitar Termos
            </a>
        ` : ''}
        <a href="#" onclick="showMyEvaluations(); return false;" class="menu-item">
            <i class="fas fa-star"></i> Minhas Avaliações
        </a>
        <a href="#" onclick="sincronizarEmpresasDoMapa(); return false;" class="menu-item">
            <i class="fas fa-sync-alt"></i> Sincronizar Empresas
        </a>
        <hr style="margin: 10px 0; border: none; border-top: 1px solid var(--gray-light);">
        <a href="#" onclick="logout(); return false;" class="menu-item" style="color: var(--danger);">
            <i class="fas fa-sign-out-alt"></i> Sair
        </a>
    `;
    
    // Atualizar contador de denúncias
    if (user.isAdmin) {
        updateDenunciasCount();
    }
}

function updateDenunciasCount() {
    const denuncias = JSON.parse(localStorage.getItem('reputai_denuncias') || '[]');
    const pendentes = denuncias.filter(d => d.status === 'pendente').length;
    
    const badge = document.getElementById('denuncias-count');
    if (badge) {
        if (pendentes > 0) {
            badge.textContent = pendentes;
            badge.style.cssText = `
                background: #dc2626;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem;
                margin-left: auto;
            `;
        } else {
            badge.textContent = '';
            badge.style.display = 'none';
        }
    }
}

// ==================== MODAL DE TERMOS DE USO ====================
function showTermosModal() {
    const modal = document.getElementById('termos-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Configurar botão de aceitar
        const aceitarBtn = document.getElementById('aceitar-termos-btn');
        const checkbox = document.getElementById('concordar-termos');
        
        if (aceitarBtn && checkbox) {
            checkbox.checked = false;
            aceitarBtn.disabled = true;
            
            checkbox.onchange = function() {
                aceitarBtn.disabled = !this.checked;
            };
            
            aceitarBtn.onclick = function() {
                if (checkbox.checked) {
                    aceitarTermos();
                    hideTermosModal();
                    showToast('✅ Termos de uso aceitos!', 'success');
                    
                    // Atualizar menu
                    setTimeout(() => {
                        updateUserMenuContent();
                    }, 300);
                }
            };
        }
    }
}

function hideTermosModal() {
    const modal = document.getElementById('termos-modal');
    if (modal) {
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

function aceitarTermos() {
    if (!window.currentUser) return false;
    
    window.termosAceitos = true;
    
    // Salvar aceitação para este usuário
    if (window.currentUser.id) {
        localStorage.setItem(`reputai_termos_${window.currentUser.id}`, 'true');
        
        // Atualizar usuário atual
        if (window.currentUser) {
            window.currentUser.termosAceitos = true;
            localStorage.setItem('reputai_user', JSON.stringify(window.currentUser));
        }
    }
    
    console.log('✅ Termos de uso aceitos por:', window.currentUser.email);
    return true;
}

// ==================== LOGIN SOCIAL ====================
async function handleGoogleLogin() {
    showToast('Conectando com Google...', 'info');
    
    if (typeof loginWithGoogle === 'function') {
        const result = await loginWithGoogle();
        
        if (result.success) {
            showToast(result.message, 'success');
            hideAuthModal();
            
            setTimeout(() => {
                updateUserInterface();
                
                // Verificar termos de uso
                if (!window.termosAceitos) {
                    setTimeout(() => {
                        showTermosModal();
                    }, 1000);
                }
            }, 500);
        } else {
            showToast(result.message, 'error');
        }
    } else {
        showToast('Login com Google não disponível', 'error');
    }
}

async function handleFacebookLogin() {
    showToast('Conectando com Facebook...', 'info');
    
    if (typeof loginWithFacebook === 'function') {
        const result = await loginWithFacebook();
        
        if (result.success) {
            showToast(result.message, 'success');
            hideAuthModal();
            
            setTimeout(() => {
                updateUserInterface();
                
                // Verificar termos de uso
                if (!window.termosAceitos) {
                    setTimeout(() => {
                        showTermosModal();
                    }, 1000);
                }
            }, 500);
        } else {
            showToast(result.message, 'error');
        }
    } else {
        showToast('Login com Facebook não disponível', 'error');
    }
}

function addSocialLoginButtons() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    
    const socialButtonsHTML = `
        <div class="social-login" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--gray-light);">
            <p style="color: var(--gray); margin-bottom: 10px; text-align: center;">Ou entre com:</p>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button onclick="handleGoogleLogin()" style="flex: 1; background: #DB4437; color: white; border: none; padding: 10px; border-radius: var(--radius); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 500;">
                    <i class="fab fa-google"></i> Google
                </button>
                <button onclick="handleFacebookLogin()" style="flex: 1; background: #4267B2; color: white; border: none; padding: 10px; border-radius: var(--radius); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 500;">
                    <i class="fab fa-facebook-f"></i> Facebook
                </button>
            </div>
        </div>
    `;
    
    if (loginTab && !loginTab.querySelector('.social-login')) {
        loginTab.insertAdjacentHTML('beforeend', socialButtonsHTML);
    }
    
    if (registerTab && !registerTab.querySelector('.social-login')) {
        registerTab.insertAdjacentHTML('beforeend', socialButtonsHTML);
    }
}

// ==================== FUNÇÕES AUXILIARES ====================
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        logoutUser();
    }
}

// Funções administrativas
function showAdminPanel() {
    showToast('Painel administrativo em desenvolvimento', 'info');
}

function manageCompanies() {
    showToast('Gerenciador de empresas em desenvolvimento', 'info');
}

function viewDenuncias() {
    showDenunciasPanel();
}

function viewStatistics() {
    showToast('Estatísticas em desenvolvimento', 'info');
}

function showMyEvaluations() {
    showToast('Minhas avaliações em desenvolvimento', 'info');
}

// ==================== PAINEL DE DENÚNCIAS ====================
function showDenunciasPanel() {
    const denuncias = JSON.parse(localStorage.getItem('reputai_denuncias') || '[]');
    const avaliacoes = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    
    let denunciasHTML = '';
    
    if (denuncias.length === 0) {
        denunciasHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--gray);">
                <i class="fas fa-flag" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Nenhuma denúncia pendente</h3>
                <p>Todas as denúncias foram resolvidas.</p>
            </div>
        `;
    } else {
        denunciasHTML = denuncias.map(denuncia => {
            const avaliacao = avaliacoes.find(a => a.id === denuncia.avaliacaoId);
            const statusColor = denuncia.status === 'pendente' ? '#f59e0b' : 
                               denuncia.status === 'removida' ? '#dc2626' : 
                               denuncia.status === 'mantida' ? '#10b981' : '#64748b';
            
            return `
                <div style="background: white; border-radius: var(--radius); padding: 1rem; margin-bottom: 1rem; border-left: 4px solid ${statusColor};">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <strong>${denuncia.empresa}</strong>
                            <div style="color: var(--gray); font-size: 0.9rem; margin-top: 5px;">
                                Avaliação por: ${denuncia.usuario}
                            </div>
                            ${avaliacao ? `
                                <div style="margin-top: 10px; padding: 10px; background: var(--light); border-radius: 6px;">
                                    <strong>Avaliação:</strong>
                                    <p style="margin: 5px 0; color: var(--dark);">${avaliacao.text}</p>
                                    <div style="color: #FFD700; font-size: 14px;">
                                        ${'★'.repeat(avaliacao.rating)}${'☆'.repeat(5 - avaliacao.rating)}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div style="text-align: right;">
                            <span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
                                ${denuncia.status}
                            </span>
                            <div style="color: var(--gray); font-size: 0.8rem; margin-top: 5px;">
                                ${new Date(denuncia.data).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        ${denuncia.status === 'pendente' ? `
                            <button onclick="resolverDenuncia(${denuncia.id}, 'removida')" style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                <i class="fas fa-trash"></i> Remover Avaliação
                            </button>
                            <button onclick="resolverDenuncia(${denuncia.id}, 'mantida')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                <i class="fas fa-check"></i> Manter Avaliação
                            </button>
                        ` : `
                            <button onclick="verDetalhesDenuncia(${denuncia.id})" style="background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem;">
                                <i class="fas fa-eye"></i> Ver Detalhes
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    const modalContent = `
        <div style="max-width: 800px; max-height: 80vh; overflow-y: auto; padding: 20px;">
            <h3 style="margin-bottom: 1.5rem; color: var(--dark);">
                <i class="fas fa-flag"></i> Painel de Denúncias
                <span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.9rem; margin-left: 10px;">
                    ${denuncias.filter(d => d.status === 'pendente').length} pendentes
                </span>
            </h3>
            
            ${denunciasHTML}
            
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--gray-light);">
                <button onclick="closeModal()" style="background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: var(--radius); cursor: pointer;">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

function resolverDenuncia(denunciaId, acao) {
    const denuncias = JSON.parse(localStorage.getItem('reputai_denuncias') || '[]');
    const index = denuncias.findIndex(d => d.id === denunciaId);
    
    if (index !== -1) {
        denuncias[index].status = acao;
        denuncias[index].resolvidaEm = new Date().toISOString();
        denuncias[index].resolvidaPor = window.currentUser?.name || 'Administrador';
        
        if (acao === 'removida') {
            // Remover a avaliação
            removerAvaliacaoOfensiva(denuncias[index].avaliacaoId);
        }
        
        localStorage.setItem('reputai_denuncias', JSON.stringify(denuncias));
        
        showToast(`Denúncia ${acao === 'removida' ? 'removida' : 'mantida'} com sucesso`, 'success');
        
        // Atualizar painel
        setTimeout(() => {
            showDenunciasPanel();
            updateDenunciasCount();
        }, 500);
    }
}

function verDetalhesDenuncia(denunciaId) {
    showToast('Detalhes da denúncia em desenvolvimento', 'info');
}

// Funções de moderação
function verificarConteudoOfensivo(texto) {
    const PALAVRAS_OFENSIVAS = [
        'imbecil', 'idiota', 'burro', 'estúpido', 'retardado', 'cretino',
        'vagabundo', 'vagaba', 'piranha', 'puta', 'prostituta', 'meretriz',
        'fdp', 'filho da puta', 'vai se foder', 'vai tomar no cu', 'vtnc',
        'cu', 'caralho', 'porra', 'buceta', 'xoxota', 'pinto', 'pau'
    ];
    
    if (!texto || typeof texto !== 'string') return false;
    
    const textoLower = texto.toLowerCase();
    return PALAVRAS_OFENSIVAS.some(palavra => {
        const regex = new RegExp(`\\b${palavra.toLowerCase()}\\b`, 'i');
        return regex.test(textoLower);
    });
}

function marcarAvaliacaoComoDenunciada(avaliacaoId) {
    const avaliacoes = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const index = avaliacoes.findIndex(a => a.id === avaliacaoId);
    
    if (index !== -1) {
        avaliacoes[index].denunciada = true;
        avaliacoes[index].denunciadaEm = new Date().toISOString();
        localStorage.setItem('reputai_evaluations', JSON.stringify(avaliacoes));
        
        return true;
    }
    return false;
}

function removerAvaliacaoOfensiva(avaliacaoId) {
    const avaliacoes = JSON.parse(localStorage.getItem('reputai_evaluations') || '[]');
    const index = avaliacoes.findIndex(a => a.id === avaliacaoId);
    
    if (index !== -1) {
        avaliacoes[index].removida = true;
        avaliacoes[index].removidaEm = new Date().toISOString();
        avaliacoes[index].removidaPor = 'Sistema de moderação';
        localStorage.setItem('reputai_evaluations', JSON.stringify(avaliacoes));
        
        return true;
    }
    return false;
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 [auth] Interface de autenticação inicializada');
    
    // Configurar botão de login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.onclick = showAuthModal;
    }
    
    // Configurar eventos do modal
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideAuthModal();
            }
        });
    }
    
    // Configurar botões de fechar
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    });
    
    // Adicionar botões sociais com delay
    setTimeout(() => {
        addSocialLoginButtons();
    }, 1500);
});

// ==================== EXPORTAÇÃO GLOBAL ====================
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.login = login;
window.register = register;
window.updateUserInterface = updateUserInterface;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;
window.handleGoogleLogin = handleGoogleLogin;
window.handleFacebookLogin = handleFacebookLogin;
window.addSocialLoginButtons = addSocialLoginButtons;
window.showTermosModal = showTermosModal;
window.hideTermosModal = hideTermosModal;
window.aceitarTermos = aceitarTermos;
window.showDenunciasPanel = showDenunciasPanel;
window.resolverDenuncia = resolverDenuncia;
window.updateDenunciasCount = updateDenunciasCount;
window.unifiedLogin = unifiedLogin;
window.unifiedRegister = unifiedRegister;
window.logoutUser = logoutUser;
window.initSessionCheck = initSessionCheck;
window.verificarConteudoOfensivo = verificarConteudoOfensivo;
window.marcarAvaliacaoComoDenunciada = marcarAvaliacaoComoDenunciada;
window.removerAvaliacaoOfensiva = removerAvaliacaoOfensiva;

console.log('✅ [auth] Interface de autenticação carregada');