// init-firebase.js - Sistema de autenticação unificado para GitHub Pages
console.log('🔥 [init-firebase] Sistema de autenticação carregando...');

// ==================== CONFIGURAÇÃO FIREBASE ====================
const firebaseConfig = {
    apiKey: "AIzaSyCikJ1Cf_AS8tfKgythZdUqeyUAc96z7Eg",
    authDomain: "reputai143.firebaseapp.com",
    projectId: "reputai143",
    storageBucket: "reputai143.appspot.com",
    messagingSenderId: "127119539085",
    appId: "1:127119539085:web:325373bf1da5a16b5c9bc4"
};

// ==================== CREDENCIAIS DO ADMIN ====================
const ADMIN_CREDENTIALS = {
    email: "gusta2206@admin.com",
    password: "B@tata123",
    name: "Administrador",
    avatar: "👑",
    isAdmin: true
};

// ==================== VARIÁVEIS GLOBAIS ====================
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
window.currentUser = null;
window.reputaiStorage = window.reputaiStorage || {};

// ==================== FUNÇÕES DE STORAGE COMPATÍVEL ====================
function getStorageItem(key) {
    // 1. Tentar localStorage
    try {
        if (typeof localStorage !== 'undefined') {
            const item = localStorage.getItem(key);
            if (item) {
                return JSON.parse(item);
            }
        }
    } catch (e) {
        console.warn(`⚠️ Erro no localStorage para ${key}:`, e.message);
    }
    
    // 2. Tentar sessionStorage
    try {
        if (typeof sessionStorage !== 'undefined') {
            const item = sessionStorage.getItem(key);
            if (item) {
                return JSON.parse(item);
            }
        }
    } catch (e) {
        console.warn(`⚠️ Erro no sessionStorage para ${key}:`, e.message);
    }
    
    // 3. Tentar storage global
    if (window.reputaiStorage[key]) {
        return window.reputaiStorage[key];
    }
    
    return null;
}

function setStorageItem(key, value) {
    console.log(`💾 Salvando ${key}:`, value);
    
    // 1. Salvar no localStorage
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(value));
        }
    } catch (e) {
        console.warn(`⚠️ Não foi possível salvar ${key} no localStorage:`, e.message);
    }
    
    // 2. Salvar no sessionStorage
    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(key, JSON.stringify(value));
        }
    } catch (e) {
        console.warn(`⚠️ Não foi possível salvar ${key} no sessionStorage:`, e.message);
    }
    
    // 3. Salvar no storage global
    window.reputaiStorage[key] = value;
    
    return true;
}

function removeStorageItem(key) {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
        }
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(key);
        }
        if (window.reputaiStorage[key]) {
            delete window.reputaiStorage[key];
        }
        return true;
    } catch (e) {
        console.warn(`⚠️ Erro ao remover ${key}:`, e.message);
        return false;
    }
}

// ==================== INICIALIZAÇÃO DO FIREBASE ====================
function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase SDK não carregado');
        return false;
    }
    
    try {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase inicializado com sucesso!');
        } else {
            firebaseApp = firebase.app();
            console.log('✅ Firebase já estava inicializado');
        }
        
        firebaseAuth = firebase.auth();
        firebaseDb = firebase.firestore();
        
        // Configurar persistência
        firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => console.log('✅ Persistência LOCAL configurada'))
            .catch(error => console.error('❌ Erro na persistência:', error));
        
        // Monitorar estado de autenticação
        firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                console.log('👤 Usuário Firebase detectado:', user.email);
                handleFirebaseUser(user);
            }
        });
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return false;
    }
}

// ==================== MANIPULAÇÃO DE USUÁRIOS ====================
function handleFirebaseUser(firebaseUser) {
    const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        avatar: firebaseUser.photoURL || firebaseUser.displayName?.charAt(0).toUpperCase() || 'U',
        isAdmin: firebaseUser.email === ADMIN_CREDENTIALS.email,
        joined: firebaseUser.metadata.creationTime || new Date().toISOString(),
        provider: firebaseUser.providerData[0]?.providerId || 'firebase',
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        firebaseUser: true
    };
    
    setStorageItem('reputai_user', userData);
    window.currentUser = userData;
    
    console.log('✅ Usuário Firebase sincronizado com localStorage');
    
    // Atualizar interface
    setTimeout(() => {
        if (typeof updateUserInterface === 'function') {
            updateUserInterface();
        }
    }, 100);
}

function checkUserSession() {
    console.log('🔍 Verificando sessão do usuário...');
    
    // Verificar ambiente
    const isGithub = window.location.hostname.includes('github.io');
    console.log(`🌐 Ambiente: ${isGithub ? 'GitHub Pages' : 'Local/Produção'}`);
    
    // Carregar usuário do storage
    const savedUser = getStorageItem('reputai_user');
    
    if (savedUser) {
        console.log('👤 Usuário encontrado no storage:', savedUser.email);
        window.currentUser = savedUser;
        return true;
    } else {
        console.log('👤 Nenhum usuário encontrado no storage');
        window.currentUser = null;
        return false;
    }
}

// ==================== FUNÇÕES DE AUTENTICAÇÃO ====================
function unifiedLogin(email, password) {
    // Verificar admin
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const adminData = {
            id: 9999,
            name: ADMIN_CREDENTIALS.name,
            email: ADMIN_CREDENTIALS.email,
            avatar: ADMIN_CREDENTIALS.avatar,
            isAdmin: true,
            joined: new Date().toISOString(),
            permissions: ['all'],
            provider: 'email'
        };
        
        setStorageItem('reputai_user', adminData);
        window.currentUser = adminData;
        
        return {
            success: true,
            user: adminData,
            message: '👑 Bem-vindo, Administrador!'
        };
    }
    
    // Verificar usuários locais
    const savedUsers = getStorageItem('reputai_users') || [];
    const localUser = savedUsers.find(u => u.email === email && u.password === password);
    
    if (localUser) {
        const userData = {
            id: localUser.id,
            name: localUser.name,
            email: localUser.email,
            avatar: localUser.avatar || localUser.name.charAt(0).toUpperCase(),
            joined: localUser.joined,
            isAdmin: false,
            provider: localUser.provider || 'email',
            photoURL: localUser.photoURL
        };
        
        setStorageItem('reputai_user', userData);
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

function unifiedRegister(name, email, password) {
    const savedUsers = getStorageItem('reputai_users') || [];
    
    // Verificar se email já existe
    if (savedUsers.some(u => u.email === email)) {
        return {
            success: false,
            message: 'Este email já está cadastrado'
        };
    }
    
    // Validar senha
    if (password.length < 6) {
        return {
            success: false,
            message: 'A senha deve ter no mínimo 6 caracteres'
        };
    }
    
    // Criar novo usuário
    const newUser = {
        id: savedUsers.length > 0 ? Math.max(...savedUsers.map(u => u.id)) + 1 : 1,
        name: name,
        email: email,
        password: password,
        avatar: name.charAt(0).toUpperCase(),
        joined: new Date().toISOString(),
        evaluations: [],
        provider: 'email'
    };
    
    savedUsers.push(newUser);
    setStorageItem('reputai_users', savedUsers);
    
    const userData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        joined: newUser.joined,
        isAdmin: false,
        provider: 'email'
    };
    
    setStorageItem('reputai_user', userData);
    window.currentUser = userData;
    
    return {
        success: true,
        user: userData,
        message: `Conta criada com sucesso, ${userData.name}!`
    };
}

async function loginWithGoogle() {
    if (!firebaseAuth) {
        if (!initFirebase()) {
            return {
                success: false,
                message: 'Firebase não disponível'
            };
        }
    }
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const result = await firebaseAuth.signInWithPopup(provider);
        return {
            success: true,
            user: result.user,
            message: '✅ Login com Google realizado com sucesso!'
        };
    } catch (error) {
        console.error('Erro no login com Google:', error);
        return {
            success: false,
            message: `Erro: ${error.message}`
        };
    }
}

async function loginWithFacebook() {
    if (!firebaseAuth) {
        if (!initFirebase()) {
            return {
                success: false,
                message: 'Firebase não disponível'
            };
        }
    }
    
    const provider = new firebase.auth.FacebookAuthProvider();
    
    try {
        const result = await firebaseAuth.signInWithPopup(provider);
        return {
            success: true,
            user: result.user,
            message: '✅ Login com Facebook realizado com sucesso!'
        };
    } catch (error) {
        console.error('Erro no login com Facebook:', error);
        return {
            success: false,
            message: `Erro: ${error.message}`
        };
    }
}

function logoutUser() {
    // Logout do Firebase
    if (firebaseAuth) {
        firebaseAuth.signOut()
            .then(() => console.log('✅ Logout do Firebase realizado'))
            .catch(error => console.error('❌ Erro no logout do Firebase:', error));
    }
    
    // Limpar storage
    removeStorageItem('reputai_user');
    window.currentUser = null;
    
    console.log('👋 Usuário deslogado do sistema');
    return true;
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 [init-firebase] Inicializando...');
    
    // Inicializar Firebase com delay
    setTimeout(() => {
        initFirebase();
    }, 800);
    
    // Verificar sessão com delay maior
    setTimeout(() => {
        checkUserSession();
        
        // Atualizar interface
        if (typeof updateUserInterface === 'function') {
            setTimeout(updateUserInterface, 300);
        }
    }, 1200);
});

// ==================== EXPORTAÇÃO GLOBAL ====================
window.initFirebase = initFirebase;
window.checkUserSession = checkUserSession;
window.logoutUser = logoutUser;
window.unifiedLogin = unifiedLogin;
window.unifiedRegister = unifiedRegister;
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;
window.getStorageItem = getStorageItem;
window.setStorageItem = setStorageItem;
window.removeStorageItem = removeStorageItem;
window.ADMIN_CREDENTIALS = ADMIN_CREDENTIALS;

console.log('✅ [init-firebase] Sistema carregado e pronto');