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

// ==================== TERMOS DE USO ====================
const TERMOS_USO = {
    titulo: "Termos de Uso e Política de Privacidade",
    versao: "1.0",
    data: "2024-01-01",
    conteudo: `O ReputAí é uma plataforma brasileira dedicada a compartilhar experiências reais de trabalho em empresas. 
    Nossa missão é trazer transparência ao mercado de trabalho, ajudando profissionais a tomar decisões informadas.
    
    Ao utilizar nossa plataforma, você concorda com os seguintes termos:
    1. É responsável pelo conteúdo de suas avaliações
    2. Avaliações devem ser baseadas em experiência real
    3. Não são permitidas cópias de outros sites
    4. Conteúdo ofensivo ou difamatório será removido
    5. Sua avaliação pode ser moderada conforme as leis brasileiras
    
    Nos comprometemos a cumprir o Marco Civil da Internet (Lei 12.965/2014) e a LGPD (Lei 13.709/2018).
    
    Em caso de ações judiciais decorrentes de avaliações, o usuário será responsabilizado.
    Mantemos registros de acesso por 6 meses conforme exigido por lei.`
};

// ==================== PALAVRAS OFENSIVAS (FILTRO) ====================
const PALAVRAS_OFENSIVAS = [
    // Palavras ofensivas em português
    'imbecil', 'idiota', 'burro', 'estúpido', 'retardado', 'cretino',
    'vagabundo', 'vagaba', 'piranha', 'puta', 'prostituta', 'meretriz',
    'fdp', 'filho da puta', 'vai se foder', 'vai tomar no cu', 'vtnc',
    'cu', 'caralho', 'porra', 'buceta', 'xoxota', 'pinto', 'pau',
    'arrombado', 'cuzão', 'otário', 'trouxa', 'palhaço',
    // Palavras discriminatórias
    'preto burro', 'negro idiota', 'macaquito', 'crioulo', 'judeu ladrão',
    'baiano preguiçoso', 'paulista metido', 'carioca ladrão', 'gaúcho chato',
    'viado', 'bicha', 'sapatão', 'traveco', 'travesti',
    'deficiente mental', 'aleijado', 'mongol', 'down',
    'gorda', 'gordo', 'baleia', 'balofa',
    // Ameaças
    'vou te matar', 'vou te bater', 'vou acabar com você', 'vou te processar',
    // Calúnia/Difamação
    'ladrão', 'corrupto', 'assassino', 'estuprador', 'pedófilo'
];

// ==================== VARIÁVEIS GLOBAIS ====================
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
window.currentUser = null;
window.reputaiStorage = window.reputaiStorage || {};
window.termosAceitos = false;

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

// ==================== FUNÇÕES DE MODERAÇÃO ====================
function verificarConteudoOfensivo(texto) {
    if (!texto || typeof texto !== 'string') return false;
    
    const textoLower = texto.toLowerCase();
    return PALAVRAS_OFENSIVAS.some(palavra => {
        const regex = new RegExp(`\\b${palavra.toLowerCase()}\\b`, 'i');
        return regex.test(textoLower);
    });
}

function marcarAvaliacaoComoDenunciada(avaliacaoId) {
    const avaliacoes = getStorageItem('reputai_evaluations') || [];
    const index = avaliacoes.findIndex(a => a.id === avaliacaoId);
    
    if (index !== -1) {
        avaliacoes[index].denunciada = true;
        avaliacoes[index].denunciadaEm = new Date().toISOString();
        setStorageItem('reputai_evaluations', avaliacoes);
        
        // Adicionar à lista de denúncias do admin
        const denuncias = getStorageItem('reputai_denuncias') || [];
        denuncias.push({
            id: Date.now(),
            avaliacaoId: avaliacaoId,
            empresa: avaliacoes[index].companyName,
            usuario: avaliacoes[index].userName,
            motivo: 'Denunciada por usuário',
            data: new Date().toISOString(),
            status: 'pendente'
        });
        setStorageItem('reputai_denuncias', denuncias);
        
        return true;
    }
    return false;
}

function removerAvaliacaoOfensiva(avaliacaoId) {
    const avaliacoes = getStorageItem('reputai_evaluations') || [];
    const index = avaliacoes.findIndex(a => a.id === avaliacaoId);
    
    if (index !== -1) {
        // Marcar como removida ao invés de deletar (para manter histórico)
        avaliacoes[index].removida = true;
        avaliacoes[index].removidaEm = new Date().toISOString();
        avaliacoes[index].removidaPor = 'Sistema de moderação';
        setStorageItem('reputai_evaluations', avaliacoes);
        
        // Atualizar status da denúncia
        const denuncias = getStorageItem('reputai_denuncias') || [];
        const denunciaIndex = denuncias.findIndex(d => d.avaliacaoId === avaliacaoId);
        if (denunciaIndex !== -1) {
            denuncias[denunciaIndex].status = 'removida';
            denuncias[denunciaIndex].resolvidaEm = new Date().toISOString();
            setStorageItem('reputai_denuncias', denuncias);
        }
        
        return true;
    }
    return false;
}

function verificarAvaliacaoVisivel(avaliacao, usuarioAtual) {
    if (!avaliacao) return false;
    
    // Se foi removida pelo sistema
    if (avaliacao.removida) {
        // Mostrar apenas para admin e autor
        if (usuarioAtual && (usuarioAtual.isAdmin || usuarioAtual.id === avaliacao.userId)) {
            return true;
        }
        return false;
    }
    
    // Se foi denunciada
    if (avaliacao.denunciada) {
        // Mostrar apenas para admin e autor
        if (usuarioAtual && (usuarioAtual.isAdmin || usuarioAtual.id === avaliacao.userId)) {
            return true;
        }
        return false;
    }
    
    // Verificar conteúdo ofensivo
    if (avaliacao.text && verificarConteudoOfensivo(avaliacao.text)) {
        // Marcar automaticamente como ofensiva
        if (!avaliacao.denunciada) {
            marcarAvaliacaoComoDenunciada(avaliacao.id);
        }
        
        // Mostrar apenas para admin e autor
        if (usuarioAtual && (usuarioAtual.isAdmin || usuarioAtual.id === avaliacao.userId)) {
            return true;
        }
        return false;
    }
    
    return true;
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
        firebaseUser: true,
        termosAceitos: getStorageItem(`reputai_termos_${firebaseUser.uid}`) || false
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
        
        // Verificar se aceitou os termos
        if (savedUser.termosAceitos !== undefined) {
            window.termosAceitos = savedUser.termosAceitos;
        }
        
        window.currentUser = savedUser;
        
        // Se for Firebase user, verificar sessão ativa
        if (savedUser.firebaseUser && firebaseAuth) {
            firebaseAuth.currentUser?.reload().catch(() => {
                console.log('⚠️ Sessão Firebase expirada');
                removeStorageItem('reputai_user');
                window.currentUser = null;
            });
        }
        
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
            provider: 'email',
            termosAceitos: getStorageItem(`reputai_termos_9999`) || false
        };
        
        setStorageItem('reputai_user', adminData);
        window.currentUser = adminData;
        window.termosAceitos = adminData.termosAceitos;
        
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
            photoURL: localUser.photoURL,
            termosAceitos: getStorageItem(`reputai_termos_${localUser.id}`) || false
        };
        
        setStorageItem('reputai_user', userData);
        window.currentUser = userData;
        window.termosAceitos = userData.termosAceitos;
        
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
        provider: 'email',
        termosAceitos: false
    };
    
    setStorageItem('reputai_user', userData);
    window.currentUser = userData;
    window.termosAceitos = false;
    
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
    window.termosAceitos = false;
    
    console.log('👋 Usuário deslogado do sistema');
    return true;
}

// ==================== FUNÇÕES DE TERMOS DE USO ====================
function aceitarTermos() {
    if (!window.currentUser) return false;
    
    window.termosAceitos = true;
    
    // Salvar aceitação para este usuário
    if (window.currentUser.id) {
        setStorageItem(`reputai_termos_${window.currentUser.id}`, true);
        
        // Atualizar usuário atual
        if (window.currentUser) {
            window.currentUser.termosAceitos = true;
            setStorageItem('reputai_user', window.currentUser);
        }
    }
    
    console.log('✅ Termos de uso aceitos por:', window.currentUser.email);
    return true;
}

function verificarTermosAceitos() {
    if (!window.currentUser) return false;
    
    const aceito = getStorageItem(`reputai_termos_${window.currentUser.id}`);
    window.termosAceitos = aceito || false;
    return window.termosAceitos;
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
window.TERMOS_USO = TERMOS_USO;
window.aceitarTermos = aceitarTermos;
window.verificarTermosAceitos = verificarTermosAceitos;
window.verificarConteudoOfensivo = verificarConteudoOfensivo;
window.marcarAvaliacaoComoDenunciada = marcarAvaliacaoComoDenunciada;
window.removerAvaliacaoOfensiva = removerAvaliacaoOfensiva;
window.verificarAvaliacaoVisivel = verificarAvaliacaoVisivel;

console.log('✅ [init-firebase] Sistema carregado e pronto');