// firebase-auth-unificado.js - Sistema completo de autenticação
console.log('🔐 [auth] Sistema de autenticação carregado...');

// ==================== CONFIGURAÇÃO FIREBASE ====================
const firebaseConfig = {
    apiKey: "AIzaSyCikJ1Cf_AS8tfKgythZdUqeyUAc96z7Eg",
    authDomain: "reputai143.firebaseapp.com",
    projectId: "reputai143",
    storageBucket: "reputai143.appspot.com",
    messagingSenderId: "127119539085",
    appId: "1:127119539085:web:325373bf1da5a16b5c9bc4"
};

// Variáveis globais
window.currentUser = null;
window.firebaseApp = null;
window.firebaseAuth = null;
window.firebaseDb = null;
window.firebaseAdminEmails = ["gusta2206@admin.com", "gustavosantos@admin.com"];

// ==================== INICIALIZAÇÃO ====================
function initFirebaseAuth() {
    try {
        if (!firebase.apps.length) {
            window.firebaseApp = firebase.initializeApp(firebaseConfig);
            window.firebaseAuth = firebase.auth();
            window.firebaseDb = firebase.firestore();
            
            window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(() => console.log('✅ Persistência LOCAL configurada'));
            
            setupAuthListener();
            console.log('✅ Firebase inicializado');
        }
    } catch (error) {
        console.error('❌ Erro Firebase:', error);
    }
}

// ==================== LISTENER DE AUTENTICAÇÃO ====================
function setupAuthListener() {
    window.firebaseAuth.onAuthStateChanged(async (user) => {
        if (user) {
            const isAdmin = window.firebaseAdminEmails.includes(user.email);
            const userData = {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                avatar: user.photoURL || user.displayName?.charAt(0).toUpperCase() || 'U',
                isAdmin: isAdmin,
                photoURL: user.photoURL,
                firebaseUser: true,
                provider: user.providerData[0]?.providerId || 'firebase',
                lastLogin: new Date().toISOString()
            };
            
            localStorage.setItem('reputai_user', JSON.stringify(userData));
            localStorage.setItem('reputai_user_id', user.uid);
            window.currentUser = userData;
            
            // Salva no Firestore
            if (window.firebaseDb) {
                await window.firebaseDb.collection('users').doc(user.uid).set({
                    ...userData,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            
            showToast(`Bem-vindo, ${userData.name}!`, 'success');
            updateUserInterface();
            
        } else {
            localStorage.removeItem('reputai_user');
            localStorage.removeItem('reputai_user_id');
            window.currentUser = null;
        }
    });
}

// ==================== FUNÇÕES DE LOGIN/REGISTRO ====================
async function loginWithEmail(email, password) {
    try {
        const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        return { success: true, user: result.user, message: 'Login realizado!' };
    } catch (error) {
        return { success: false, message: getErrorMessage(error.code) };
    }
}

async function registerWithEmail(name, email, password) {
    try {
        const result = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: name });
        
        // Marca como recém-cadastrado
        const userData = {
            id: result.user.uid,
            name: name,
            email: email,
            avatar: name.charAt(0).toUpperCase(),
            isAdmin: false,
            firebaseUser: true,
            provider: 'email',
            justRegistered: true // Flag importante
        };
        
        localStorage.setItem('reputai_user', JSON.stringify(userData));
        localStorage.setItem('reputai_user_id', result.user.uid);
        window.currentUser = userData;
        
        return { 
            success: true, 
            user: result.user, 
            message: 'Conta criada com sucesso!',
            justRegistered: true
        };
    } catch (error) {
        return { success: false, message: getErrorMessage(error.code) };
    }
}

// ==================== FUNÇÕES AUXILIARES ====================
function getErrorMessage(code) {
    const messages = {
        'auth/user-not-found': 'Usuário não encontrado',
        'auth/wrong-password': 'Senha incorreta',
        'auth/email-already-in-use': 'Email já cadastrado',
        'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres)',
        'auth/invalid-email': 'Email inválido',
        'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde',
        'auth/network-request-failed': 'Erro de conexão'
    };
    return messages[code] || 'Erro na autenticação';
}

function logoutUser() {
    if (confirm('Tem certeza que deseja sair?')) {
        if (window.firebaseAuth) window.firebaseAuth.signOut();
        localStorage.removeItem('reputai_user');
        localStorage.removeItem('reputai_user_id');
        window.currentUser = null;
        showToast('Você saiu da sua conta', 'info');
        updateUserInterface();
    }
}

// ==================== INTERFACE DO USUÁRIO ====================
function updateUserInterface() {
    const loginBtn = document.getElementById('login-btn');
    const userAvatar = document.getElementById('user-avatar');
    const userMenu = document.getElementById('user-menu');
    
    if (!loginBtn || !userAvatar) return;
    
    const user = window.currentUser;
    
    if (user) {
        loginBtn.style.display = 'none';
        userAvatar.style.display = 'flex';
        
        if (user.photoURL && (user.provider === 'google' || user.provider === 'facebook')) {
            userAvatar.innerHTML = `<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            userAvatar.textContent = user.avatar || user.name.charAt(0);
        }
        
        if (user.isAdmin) userAvatar.classList.add('avatar-admin');
        updateUserMenuContent();
        
        userAvatar.onclick = (e) => {
            e.stopPropagation();
            userMenu?.classList.toggle('active');
        };
        
        document.addEventListener('click', (e) => {
            if (!userAvatar.contains(e.target) && !userMenu?.contains(e.target)) {
                userMenu?.classList.remove('active');
            }
        });
        
    } else {
        loginBtn.style.display = 'flex';
        userAvatar.style.display = 'none';
        userMenu && (userMenu.style.display = 'none');
    }
}

function updateUserMenuContent() {
    const userMenu = document.getElementById('user-menu');
    if (!userMenu || !window.currentUser) return;
    
    const user = window.currentUser;
    
    userMenu.innerHTML = `
        <div class="user-info">
            <strong>${user.name}</strong>
            <p style="color: var(--gray); font-size: 0.9rem; margin-top: 5px;">${user.email}</p>
            ${user.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
        </div>
        <a href="avaliacao.html" class="menu-item">
            <i class="fas fa-star"></i> Avaliar Empresa
        </a>
        <a href="empresas.html" class="menu-item">
            <i class="fas fa-building"></i> Ver Empresas
        </a>
        <div class="menu-item" onclick="logoutUser()">
            <i class="fas fa-sign-out-alt"></i> Sair
        </div>
    `;
    userMenu.style.display = 'block';
}

// ==================== MODAIS DE AUTENTICAÇÃO ====================
function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        showLoginForm();
    }
}

function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
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
}

// ==================== FUNÇÕES DE FORMULÁRIO ====================
async function handleLogin() {
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        showToast('Preencha email e senha', 'error');
        return;
    }
    
    const btn = document.getElementById('login-submit-btn');
    const originalText = btn?.innerHTML;
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        btn.disabled = true;
    }
    
    const result = await loginWithEmail(email, password);
    
    if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
    
    if (result.success) {
        showToast(result.message, 'success');
        hideAuthModal();
        updateUserInterface();
    } else {
        showToast(result.message, 'error');
    }
}

async function handleRegister() {
    const name = document.getElementById('register-name')?.value.trim();
    const email = document.getElementById('register-email')?.value.trim();
    const password = document.getElementById('register-password')?.value;
    
    if (!name || !email || !password) {
        showToast('Preencha todos os campos', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Email inválido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Senha deve ter no mínimo 6 caracteres', 'error');
        return;
    }
    
    const btn = document.getElementById('register-submit-btn');
    const originalText = btn?.innerHTML;
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
        btn.disabled = true;
    }
    
    const result = await registerWithEmail(name, email, password);
    
    if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
    
    if (result.success) {
        showToast('Conta criada com sucesso!', 'success');
        hideAuthModal();
        updateUserInterface();
        
        // Mostra termos apenas para novo usuário
        if (result.justRegistered) {
            setTimeout(() => {
                if (typeof showTermosModal === 'function') showTermosModal();
            }, 1000);
        }
    } else {
        showToast(result.message, 'error');
    }
}

// ==================== INICIALIZAÇÃO ====================
function initAuthSystem() {
    // Verifica sessão salva
    const savedUser = localStorage.getItem('reputai_user');
    if (savedUser) {
        try {
            window.currentUser = JSON.parse(savedUser);
            // Admin não pode logar automaticamente
            if ((window.currentUser.email === "gusta2206@admin.com" || 
                 window.currentUser.email === "gustavosantos@admin.com") && 
                !window.currentUser.firebaseUser) {
                localStorage.removeItem('reputai_user');
                window.currentUser = null;
            }
        } catch (e) {
            localStorage.removeItem('reputai_user');
            window.currentUser = null;
        }
    }
    
    // Inicializa Firebase
    if (typeof firebase !== 'undefined') {
        initFirebaseAuth();
    } else {
        console.warn('Firebase não carregado');
    }
    
    // Atualiza interface
    setTimeout(updateUserInterface, 500);
}

// ==================== EXPORTAÇÕES ====================
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logoutUser = logoutUser;
window.updateUserInterface = updateUserInterface;
window.initAuthSystem = initAuthSystem;

// Inicializa quando DOM carrega
document.addEventListener('DOMContentLoaded', initAuthSystem);
console.log('✅ Sistema de autenticação pronto');