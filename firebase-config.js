// firebase-config.js - Configuração simplificada do Firebase
console.log('🔥 [firebase-config] Carregando Firebase...');

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCikJ1Cf_AS8tfKgythZdUqeyUAc96z7Eg",
    authDomain: "reputai143.firebaseapp.com",
    projectId: "reputai143",
    storageBucket: "reputai143.appspot.com",
    messagingSenderId: "127119539085",
    appId: "1:127119539085:web:325373bf1da5a16b5c9bc4"
};

// Variáveis globais
window.firebaseApp = null;
window.firebaseAuth = null;
window.firebaseDb = null;
window.firebaseUser = null;

// Inicialização imediata do Firebase
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            // Verificar se já foi inicializado
            if (!firebase.apps.length) {
                window.firebaseApp = firebase.initializeApp(firebaseConfig);
                console.log('✅ Firebase inicializado com sucesso!');
            } else {
                window.firebaseApp = firebase.app();
                console.log('✅ Firebase já estava inicializado');
            }
            
            // Disponibilizar imediatamente
            window.firebaseAuth = firebase.auth();
            window.firebaseDb = firebase.firestore();
            
            // Configurar persistência
            window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(() => console.log('✅ Persistência LOCAL configurada'))
                .catch(err => console.warn('⚠️ Persistência falhou:', err));
                
            return true;
        } else {
            console.warn('⚠️ Firebase SDK não carregado');
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return false;
    }
}

// Monitorar estado de autenticação
function setupAuthListener() {
    if (window.firebaseAuth) {
        window.firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                console.log('👤 Usuário Firebase detectado:', user.email);
                window.firebaseUser = user;
                
                // Criar objeto de usuário simplificado
                const userData = {
                    id: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    avatar: user.photoURL || (user.displayName?.charAt(0).toUpperCase() || 'U'),
                    isAdmin: user.email === "gusta2206@admin.com",
                    photoURL: user.photoURL,
                    firebaseUser: true,
                    provider: user.providerData[0]?.providerId || 'firebase'
                };
                
                // Salvar no localStorage
                localStorage.setItem('reputai_user', JSON.stringify(userData));
                
                // Atualizar usuário global
                window.currentUser = userData;
                
                // Atualizar interface
                if (typeof updateUserInterface === 'function') {
                    setTimeout(updateUserInterface, 100);
                }
                
                // Verificar termos
                const termosKey = `reputai_termos_${user.uid}`;
                window.termosAceitos = localStorage.getItem(termosKey) === 'true';
                
            } else {
                console.log('👤 Nenhum usuário Firebase logado');
                window.firebaseUser = null;
            }
        });
    }
}

// Funções de autenticação simplificadas
async function loginWithFirebase(email, password) {
    if (!window.firebaseAuth) {
        if (!initFirebase()) {
            return { success: false, message: 'Firebase não disponível' };
        }
    }
    
    try {
        const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        return {
            success: true,
            user: result.user,
            message: '✅ Login realizado com sucesso!'
        };
    } catch (error) {
        console.error('Erro no login:', error);
        return {
            success: false,
            message: error.message || 'Erro ao fazer login'
        };
    }
}

async function registerWithFirebase(name, email, password) {
    if (!window.firebaseAuth) {
        if (!initFirebase()) {
            return { success: false, message: 'Firebase não disponível' };
        }
    }
    
    try {
        // Criar usuário
        const result = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        
        // Atualizar perfil
        await result.user.updateProfile({
            displayName: name
        });
        
        // Criar documento do usuário no Firestore (opcional)
        if (window.firebaseDb) {
            await window.firebaseDb.collection('users').doc(result.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isAdmin: email === "gusta2206@admin.com"
            });
        }
        
        return {
            success: true,
            user: result.user,
            message: '✅ Conta criada com sucesso!'
        };
    } catch (error) {
        console.error('Erro no registro:', error);
        return {
            success: false,
            message: error.message || 'Erro ao criar conta'
        };
    }
}

// Login com provedores sociais
async function loginWithGoogle() {
    if (!window.firebaseAuth) {
        if (!initFirebase()) {
            return { success: false, message: 'Firebase não disponível' };
        }
    }
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const result = await window.firebaseAuth.signInWithPopup(provider);
        return {
            success: true,
            user: result.user,
            message: '✅ Login com Google realizado com sucesso!'
        };
    } catch (error) {
        console.error('Erro no login com Google:', error);
        return {
            success: false,
            message: error.message || 'Erro ao fazer login com Google'
        };
    }
}

async function loginWithFacebook() {
    if (!window.firebaseAuth) {
        if (!initFirebase()) {
            return { success: false, message: 'Firebase não disponível' };
        }
    }
    
    const provider = new firebase.auth.FacebookAuthProvider();
    
    try {
        const result = await window.firebaseAuth.signInWithPopup(provider);
        return {
            success: false,
            user: result.user,
            message: '✅ Login com Facebook realizado com sucesso!'
        };
    } catch (error) {
        console.error('Erro no login com Facebook:', error);
        return {
            success: false,
            message: error.message || 'Erro ao fazer login com Facebook'
        };
    }
}

// Logout
async function logoutFirebase() {
    if (window.firebaseAuth) {
        try {
            await window.firebaseAuth.signOut();
            console.log('✅ Logout do Firebase realizado');
            return true;
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            return false;
        }
    }
    return true;
}

// Inicializar imediatamente
if (typeof firebase !== 'undefined') {
    initFirebase();
    setupAuthListener();
} else {
    console.warn('⚠️ Firebase SDK ainda não carregado');
    // Tentar novamente quando o SDK carregar
    const firebaseCheck = setInterval(() => {
        if (typeof firebase !== 'undefined') {
            initFirebase();
            setupAuthListener();
            clearInterval(firebaseCheck);
        }
    }, 100);
}

// Exportar funções globais
window.initFirebase = initFirebase;
window.loginWithFirebase = loginWithFirebase;
window.registerWithFirebase = registerWithFirebase;
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;
window.logoutFirebase = logoutFirebase;

console.log('✅ [firebase-config] Configuração completa e pronta');