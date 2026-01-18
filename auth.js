// auth.js - Sistema completo de autenticação do ReputAí
console.log('🔐 [auth] Carregando sistema de autenticação...');

// ==================== VARIÁVEIS GLOBAIS ====================
let authModal = null;
window.currentUser = null;
window.termosAceitos = false;

// ==================== SISTEMA DE SESSÃO PERSISTENTE ====================
function initSessionCheck() {
    console.log('🔍 Verificando sessão do usuário...');
    
    // 1. Tenta carregar do localStorage
    const savedUser = localStorage.getItem('reputai_user');
    
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            
            // VERIFICAÇÃO CRÍTICA: Admin não pode logar automaticamente via localStorage
            if ((userData.email === "gusta2206@admin.com" || userData.email === "gustavosantos@admin.com") && !userData.firebaseUser) {
                console.log('🛑 Admin detectado no localStorage, mas requer login Firebase');
                localStorage.removeItem('reputai_user');
                window.currentUser = null;
                showToast('Administrador precisa fazer login novamente', 'warning');
                return;
            }
            
            window.currentUser = userData;
            
            // Verifica termos aceitos
            const termosKey = `reputai_termos_${userData.id}`;
            window.termosAceitos = localStorage.getItem(termosKey) === 'true';
            
            console.log(`👤 Sessão restaurada: ${userData.name} (${userData.email})`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar sessão:', error);
            localStorage.removeItem('reputai_user');
            window.currentUser = null;
        }
    } else {
        console.log('👤 Nenhuma sessão ativa encontrada');
        window.currentUser = null;
    }
    
    // 2. Atualiza interface após verificação
    setTimeout(() => {
        if (typeof updateUserInterface === 'function') {
            updateUserInterface();
        }
    }, 300);
}

// ==================== FUNÇÕES DE MODAL ====================
function showAuthModal(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('🔓 Abrindo modal de autenticação...');
    
    const modal = document.getElementById('auth-modal');
    if (!modal) {
        console.error('❌ Modal de autenticação não encontrado!');
        return;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    authModal = modal;
    
    // Mostra login por padrão
    showLoginForm();
    
    // Foca no campo de email
    setTimeout(() => {
        const emailInput = document.getElementById('login-email');
        if (emailInput) emailInput.focus();
    }, 100);
    
    // Configurar eventos
    setupAuthModalEvents();
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
    
    // Limpa campos
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
    
    // Foca no email
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
    
    // Limpa campos
    const registerName = document.getElementById('register-name');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    
    if (registerName) registerName.value = '';
    if (registerEmail) registerEmail.value = '';
    if (registerPassword) registerPassword.value = '';
    
    // Foca no nome
    setTimeout(() => {
        if (registerName) registerName.focus();
    }, 50);
}

function setupAuthModalEvents() {
    // Links entre login e registro
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    
    if (showRegisterLink) {
        showRegisterLink.onclick = function(e) {
            e.preventDefault();
            showRegisterForm();
        };
    }
    
    if (showLoginLink) {
        showLoginLink.onclick = function(e) {
            e.preventDefault();
            showLoginForm();
        };
    }
    
    if (forgotPasswordLink) {
        forgotPasswordLink.onclick = function(e) {
            e.preventDefault();
            hideAuthModal();
            showPasswordRecoveryModal();
        };
    }
}

// ==================== SISTEMA UNIFICADO DE LOGIN ====================
async function unifiedLogin(emailOrUsername, password) {
    console.log('🔐 Tentando login com:', emailOrUsername);
    
    // VALIDAÇÕES INICIAIS
    if (!emailOrUsername || !password) {
        return { success: false, message: 'Preencha email e senha' };
    }
    
    // Validar email/nome de usuário
    const validEmail = validateEmailForLogin(emailOrUsername);
    if (!validEmail) {
        return { 
            success: false, 
            message: 'Email ou nome de usuário não encontrado' 
        };
    }
    
    // 1. VERIFICAÇÃO ESPECIAL PARA ADMIN (APENAS FIREBASE)
    if (validEmail === "gusta2206@admin.com" || validEmail === "gustavosantos@admin.com") {
        if (typeof loginWithFirebase === 'function') {
            const result = await loginWithFirebase(validEmail, password);
            if (result.success) {
                return result;
            }
        }
        return { success: false, message: 'Credenciais de administrador incorretas' };
    }
    
    // 2. TENTA FIREBASE PRIMEIRO
    if (typeof loginWithFirebase === 'function') {
        const result = await loginWithFirebase(validEmail, password);
        if (result.success) {
            return result;
        }
    }
    
    // 3. FALLBACK PARA USUÁRIOS LOCAIS
    const savedUsers = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    const localUser = savedUsers.find(u => u.email === validEmail && u.password === password);
    
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
        
        // Verifica termos aceitos
        const termosKey = `reputai_termos_${userData.id}`;
        window.termosAceitos = localStorage.getItem(termosKey) === 'true';
        
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

// ==================== SISTEMA DE CADASTRO COM TERMOS OBRIGATÓRIOS ====================
async function unifiedRegister(name, email, password) {
    console.log('📝 Registrando novo usuário:', email);
    
    // 1. VALIDAÇÕES BÁSICAS
    if (!name || !email || !password) {
        return { success: false, message: 'Preencha todos os campos' };
    }
    
    if (password.length < 6) {
        return { success: false, message: 'A senha deve ter no mínimo 6 caracteres' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, message: 'Digite um email válido' };
    }
    
    // 2. IMPEDE CADASTRO COMO ADMIN
    if (email === "gusta2206@admin.com" || email === "gustavosantos@admin.com") {
        return { success: false, message: 'Este email é reservado para administração' };
    }
    
    // 3. VERIFICA SE EMAIL JÁ EXISTE (LOCAL)
    const savedUsers = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    if (savedUsers.some(u => u.email === email)) {
        return { success: false, message: 'Este email já está cadastrado' };
    }
    
    // 4. TENTA CADASTRO NO FIREBASE PRIMEIRO
    if (typeof registerWithFirebase === 'function') {
        const result = await registerWithFirebase(name, email, password);
        if (result.success) {
            return result;
        }
    }
    
    // 5. CADASTRO LOCAL (FALLBACK)
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
        provider: 'email',
        termosAceitos: false,
        justRegistered: true // ⭐ FLAG CRÍTICA: usuário recém-cadastrado
    };
    
    localStorage.setItem('reputai_user', JSON.stringify(userData));
    window.currentUser = userData;
    
    return {
        success: true,
        user: userData,
        message: `Conta criada com sucesso, ${userData.name}!`
    };
}

// ==================== FUNÇÕES DE LOGIN/REGISTER (INTERFACE) ====================
function login() {
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        showToast('Preencha email e senha', 'error');
        return;
    }
    
    // Mostra loading
    const submitBtn = document.getElementById('login-submit-btn');
    const originalText = submitBtn?.innerHTML;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        submitBtn.disabled = true;
    }
    
    // Executa login unificado
    unifiedLogin(email, password).then(result => {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        
        if (result.success) {
            showToast(result.message, 'success');
            hideAuthModal();
            
            // Atualiza interface
            setTimeout(() => {
                updateUserInterface();
                
                // ⭐ NÃO MOSTRA TERMOS NO LOGIN - só verifica se já aceitou
                if (!window.termosAceitos) {
                    console.log('⚠️ Usuário logado sem termos aceitos, mas não mostra automaticamente');
                }
            }, 500);
        } else {
            showToast(result.message, 'error');
        }
    }).catch(error => {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        showToast('Erro no sistema de login', 'error');
        console.error('Erro no login:', error);
    });
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
    
    // Mostra loading
    const submitBtn = document.getElementById('register-submit-btn');
    const originalText = submitBtn?.innerHTML;
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
        submitBtn.disabled = true;
    }
    
    // Executa registro unificado
    unifiedRegister(name, email, password).then(result => {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        
        if (result.success) {
            showToast(result.message, 'success');
            hideAuthModal();
            
            // Atualiza interface
            setTimeout(() => {
                updateUserInterface();
                
                // ⭐ MOSTRA TERMOS DE USO APENAS PARA NOVO USUÁRIO
                setTimeout(() => {
                    showTermosModal();
                    console.log('📜 Modal de termos aberto para novo usuário');
                }, 1000);
                
            }, 500);
        } else {
            showToast(result.message, 'error');
        }
    }).catch(error => {
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
        showToast('Erro no sistema de registro', 'error');
        console.error('Erro no registro:', error);
    });
}

// ==================== LOGOUT COMPLETO ====================
async function logoutUser() {
    if (!window.currentUser) return;
    
    if (confirm('Tem certeza que deseja sair da sua conta?')) {
        // 1. Logout do Firebase se conectado
        if (window.firebaseUser && typeof logoutFirebase === 'function') {
            await logoutFirebase();
        }
        
        // 2. Limpa dados locais
        localStorage.removeItem('reputai_user');
        window.currentUser = null;
        window.termosAceitos = false;
        
        // 3. Fecha modais abertos
        hideAuthModal();
        hideTermosModal();
        
        // 4. Feedback visual
        showToast('Você saiu da sua conta', 'info');
        
        // 5. Atualiza interface
        setTimeout(() => {
            updateUserInterface();
        }, 500);
        
        console.log('👤 Usuário deslogado do sistema');
    }
}

// ==================== INTERFACE DO USUÁRIO (COMPLETA) ====================
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
        
        // Esconde botão de login
        loginBtn.style.display = 'none';
        
        // Mostra avatar
        userAvatar.style.display = 'flex';
        
        // Configura avatar com imagem ou inicial
        if (user.photoURL && (user.provider === 'google' || user.provider === 'facebook')) {
            userAvatar.innerHTML = `
                <img src="${user.photoURL}" 
                     style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" 
                     alt="${user.name}"
                     onerror="this.onerror=null; this.style.display='none'; this.parentElement.textContent='${user.avatar}';">
            `;
        } else {
            userAvatar.textContent = user.avatar || user.name.charAt(0).toUpperCase();
        }
        
        // Adiciona classes especiais
        userAvatar.className = 'user-avatar';
        if (user.isAdmin) userAvatar.classList.add('avatar-admin');
        if (user.provider === 'google') userAvatar.classList.add('avatar-google');
        if (user.provider === 'facebook') userAvatar.classList.add('avatar-facebook');
        
        // Atualiza menu do usuário
        updateUserMenuContent();
        
        // Configura eventos do avatar
        userAvatar.onclick = toggleUserMenu;
        
        // Fecha menu ao clicar fora
        document.addEventListener('click', closeUserMenuOnClickOutside);
        
    } else {
        // Usuário não logado
        loginBtn.style.display = 'flex';
        userAvatar.style.display = 'none';
        if (userMenu) userMenu.style.display = 'none';
    }
}

function updateUserMenuContent() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu || !window.currentUser) return;
    
    const user = window.currentUser;
    
    let menuHTML = `
        <div class="user-info">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="user-avatar" style="width: 40px; height: 40px;">
                    ${user.photoURL ? 
                        `<img src="${user.photoURL}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : 
                        user.avatar || user.name.charAt(0).toUpperCase()
                    }
                </div>
                <div>
                    <strong style="display: block; color: var(--dark);">${user.name}</strong>
                    <small style="color: var(--gray);">${user.email}</small>
                    ${user.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
                    ${!window.termosAceitos ? '<span style="color: var(--warning); font-size: 0.8rem;">Termos pendentes</span>' : ''}
                </div>
            </div>
        </div>
    `;
    
    // Itens do menu
    menuHTML += `
        <a href="avaliacao.html" class="menu-item" onclick="closeUserMenu()">
            <i class="fas fa-star"></i> Avaliar Empresa
        </a>
    `;
    
    if (!window.termosAceitos) {
        menuHTML += `
            <a href="#" class="menu-item" onclick="showTermosModal(); closeUserMenu();">
                <i class="fas fa-scale-balanced"></i> Aceitar Termos de Uso
            </a>
        `;
    }
    
    menuHTML += `
        <a href="#" class="menu-item" onclick="logoutUser(); closeUserMenu();">
            <i class="fas fa-sign-out-alt"></i> Sair da Conta
        </a>
    `;
    
    userMenu.innerHTML = menuHTML;
}

function toggleUserMenu(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    
    const userMenu = document.getElementById('user-menu');
    if (!userMenu) return;
    
    if (userMenu.classList.contains('active')) {
        userMenu.classList.remove('active');
        userMenu.style.display = 'none';
    } else {
        userMenu.classList.add('active');
        userMenu.style.display = 'block';
    }
}

function closeUserMenu() {
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
        userMenu.classList.remove('active');
        userMenu.style.display = 'none';
    }
}

function closeUserMenuOnClickOutside(e) {
    const userMenu = document.getElementById('user-menu');
    const userAvatar = document.getElementById('user-avatar');
    
    if (userMenu && userAvatar && 
        !userMenu.contains(e.target) && 
        !userAvatar.contains(e.target)) {
        closeUserMenu();
    }
}

// ==================== SISTEMA DE TERMOS DE USO ====================
function showTermosModal() {
    const modal = document.getElementById('termos-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        
        const checkbox = document.getElementById('concordar-termos');
        const button = document.getElementById('aceitar-termos-btn');
        
        if (checkbox && button) {
            checkbox.checked = false;
            button.disabled = true;
            
            checkbox.onchange = function() {
                button.disabled = !this.checked;
            };
        }
    }
}

function hideTermosModal() {
    const modal = document.getElementById('termos-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function aceitarTermos() {
    if (!window.currentUser) {
        showToast('❌ Faça login para aceitar os termos', 'error');
        return;
    }
    
    const termosKey = `reputai_termos_${window.currentUser.id}`;
    localStorage.setItem(termosKey, 'true');
    window.termosAceitos = true;
    
    // Limpa flag de recém-cadastrado
    const userData = JSON.parse(localStorage.getItem('reputai_user') || '{}');
    delete userData.justRegistered;
    localStorage.setItem('reputai_user', JSON.stringify(userData));
    
    hideTermosModal();
    showToast('✅ Termos de uso aceitos com sucesso!', 'success');
    
    // Atualiza o menu do usuário
    setTimeout(() => {
        updateUserMenuContent();
    }, 500);
}

function verificarTermosParaAcao(acaoNome) {
    if (window.currentUser && !window.termosAceitos) {
        showToast(`❌ Você precisa aceitar os termos de uso para ${acaoNome}`, 'warning');
        showTermosModal();
        return false;
    }
    return true;
}

// ==================== SISTEMA DE RECUPERAÇÃO DE SENHA (SIMPLIFICADO) ====================
function showPasswordRecoveryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'recovery-modal';
    modal.innerHTML = `
        <div class="auth-modal" style="max-width: 500px;">
            <button class="modal-close" onclick="hidePasswordRecoveryModal()">&times;</button>
            <div class="modal-header" style="background: linear-gradient(135deg, #8B5CF6, #7C3AED);">
                <h2><i class="fas fa-key"></i> Recuperação de Senha</h2>
                <p>Recupere o acesso à sua conta</p>
            </div>
            
            <div class="tab-content" style="padding: 1.5rem;">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="recovery-email" placeholder="seu@email.com">
                </div>
                
                <div style="background: #f0f9ff; padding: 1rem; border-radius: var(--radius); margin: 1rem 0;">
                    <p style="color: var(--gray); font-size: 0.9rem;">
                        <i class="fas fa-info-circle"></i> Enviaremos um link de recuperação para seu email.
                    </p>
                </div>
                
                <button class="btn btn-primary" onclick="enviarRecuperacaoSenha()" style="width: 100%;">
                    <i class="fas fa-paper-plane"></i> Enviar Link de Recuperação
                </button>
                
                <div style="text-align: center; margin-top: 1rem;">
                    <p style="color: var(--gray);">
                        Lembrou a senha? <a href="#" onclick="hidePasswordRecoveryModal(); showAuthModal();">Faça login</a>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === this) hidePasswordRecoveryModal();
    });
}

function hidePasswordRecoveryModal() {
    const modal = document.getElementById('recovery-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

async function enviarRecuperacaoSenha() {
    const email = document.getElementById('recovery-email')?.value.trim();
    
    if (!email) {
        showToast('Digite seu email', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Digite um email válido', 'error');
        return;
    }
    
    // Tenta Firebase primeiro
    if (typeof sendPasswordResetEmail === 'function') {
        const result = await sendPasswordResetEmail(email);
        if (result.success) {
            showToast(result.message, 'success');
            hidePasswordRecoveryModal();
            return;
        }
    }
    
    // Fallback local
    const users = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    const userExists = users.some(u => u.email === email);
    
    if (userExists) {
        showToast('📧 Link de recuperação enviado para seu email (simulado)', 'info');
        hidePasswordRecoveryModal();
    } else {
        showToast('Email não encontrado', 'error');
    }
}

// ==================== FUNÇÕES UTILITÁRIAS ====================
function validateEmailForLogin(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Se não for email, verificar se é nome de usuário
    if (!emailRegex.test(email)) {
        const users = JSON.parse(localStorage.getItem('reputai_users') || '[]');
        const user = users.find(u => u.name.toLowerCase() === email.toLowerCase());
        
        if (user) {
            return user.email;
        }
        
        return null;
    }
    
    return email;
}

// ==================== HANDLERS PARA LOGIN SOCIAL ====================
async function handleGoogleLogin() {
    if (typeof loginWithGoogle === 'function') {
        const result = await loginWithGoogle();
        
        if (result.success) {
            showToast(result.message, 'success');
            hideAuthModal();
            
            setTimeout(() => {
                updateUserInterface();
                
                // Verifica termos
                if (!window.termosAceitos && result.hasLocalAccount) {
                    showToast('Vinculação de conta realizada', 'info');
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

// ==================== CONFIGURAÇÃO DE EVENTOS GLOBAIS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Configurar botão de login no header
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAuthModal(e);
        });
    }
    
    // Configurar botões de fechar modal
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-close')) {
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                if (modal.id === 'auth-modal') {
                    hideAuthModal();
                } else if (modal.id === 'termos-modal') {
                    hideTermosModal();
                } else {
                    modal.classList.remove('active');
                    setTimeout(() => modal.style.display = 'none', 300);
                }
            }
        }
    });
    
    // Fechar modal ao clicar fora
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
            if (e.target.id === 'auth-modal') {
                hideAuthModal();
            } else if (e.target.id === 'termos-modal') {
                hideTermosModal();
            }
        }
    });
    
    // Configurar botões do modal de termos
    const aceitarTermosBtn = document.getElementById('aceitar-termos-btn');
    if (aceitarTermosBtn) {
        aceitarTermosBtn.addEventListener('click', function() {
            aceitarTermos();
        });
    }
});

// ==================== EXPORTAÇÕES GLOBAIS ====================
window.initSessionCheck = initSessionCheck;
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.login = login;
window.register = register;
window.logoutUser = logoutUser;
window.updateUserInterface = updateUserInterface;
window.showTermosModal = showTermosModal;
window.hideTermosModal = hideTermosModal;
window.aceitarTermos = aceitarTermos;
window.verificarTermosParaAcao = verificarTermosParaAcao;
window.showPasswordRecoveryModal = showPasswordRecoveryModal;
window.hidePasswordRecoveryModal = hidePasswordRecoveryModal;
window.enviarRecuperacaoSenha = enviarRecuperacaoSenha;
window.handleGoogleLogin = handleGoogleLogin;
window.handleFacebookLogin = handleFacebookLogin;

console.log('✅ [auth] Sistema de autenticação carregado');