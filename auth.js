// auth.js - Sistema de interface de autenticação
console.log('🔐 [auth] Carregando interface de autenticação...');

// ==================== VARIÁVEIS ====================
let authModal = null;

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
            <a href="#" onclick="viewStatistics(); return false;" class="menu-item">
                <i class="fas fa-chart-bar"></i> Estatísticas
            </a>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid var(--gray-light);">
        ` : ''}
        <a href="#" onclick="showMyEvaluations(); return false;" class="menu-item">
            <i class="fas fa-star"></i> Minhas Avaliações
        </a>
        <a href="#" onclick="sincronizarEmpresasDoMapa(); return false;" class="menu-item">
            <i class="fas fa-sync-alt"></i> Sincronizar Empresas
        </a>
        <a href="#" onclick="logout(); return false;" class="menu-item" style="color: var(--danger);">
            <i class="fas fa-sign-out-alt"></i> Sair
        </a>
    `;
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
        if (typeof logoutUser === 'function') {
            logoutUser();
        } else {
            removeStorageItem('reputai_user');
            window.currentUser = null;
        }
        
        showToast('Você saiu da sua conta', 'info');
        
        setTimeout(() => {
            updateUserInterface();
        }, 300);
    }
}

// Funções placeholder
function showAdminPanel() {
    showToast('Painel administrativo em desenvolvimento', 'info');
}

function manageCompanies() {
    showToast('Gerenciador de empresas em desenvolvimento', 'info');
}

function viewStatistics() {
    showToast('Estatísticas em desenvolvimento', 'info');
}

function showMyEvaluations() {
    showToast('Minhas avaliações em desenvolvimento', 'info');
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

console.log('✅ [auth] Interface de autenticação carregada');