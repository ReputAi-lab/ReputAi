// firebase-config.js - Sistema Firebase simplificado
console.log('🔥 [firebase-config] Inicializando Firebase...');

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
window.firebaseAdminEmails = ["gusta2206@admin.com", "gustavosantos@admin.com"];

// ==================== INICIALIZAÇÃO ====================
function initFirebase() {
    try {
        // Verifica se Firebase SDK está disponível
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK não carregado no navegador');
            return false;
        }

        // Evita múltiplas inicializações
        if (!firebase.apps.length) {
            window.firebaseApp = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase APP inicializado com sucesso');
        } else {
            window.firebaseApp = firebase.app();
            console.log('✅ Firebase já estava inicializado');
        }

        // Configura serviços
        window.firebaseAuth = firebase.auth();
        window.firebaseDb = firebase.firestore();

        // Configura persistência LOCAL
        window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => console.log('✅ Persistência LOCAL configurada'))
            .catch(err => console.warn('⚠️ Erro na persistência:', err));

        return true;
    } catch (error) {
        console.error('❌ ERRO ao inicializar Firebase:', error);
        return false;
    }
}

// ==================== MONITOR DE AUTENTICAÇÃO ====================
function setupAuthListener() {
    if (!window.firebaseAuth) {
        console.warn('⚠️ Firebase Auth não disponível para listener');
        return;
    }

    window.firebaseAuth.onAuthStateChanged(async (user) => {
        console.log('🔐 Estado de autenticação alterado:', user ? user.email : 'Nenhum usuário');
        window.firebaseUser = user;

        if (user) {
            // Verifica se é administrador
            const isAdmin = window.firebaseAdminEmails.includes(user.email);
            
            // Atualiza perfil se necessário
            const needsProfileUpdate = !user.displayName && user.email;
            if (needsProfileUpdate) {
                try {
                    await user.updateProfile({
                        displayName: user.email.split('@')[0]
                    });
                } catch (err) {
                    console.warn('⚠️ Não foi possível atualizar perfil:', err);
                }
            }

            // Cria objeto de usuário para o sistema
            const userData = {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                avatar: user.photoURL || (user.displayName?.charAt(0).toUpperCase() || 'U'),
                isAdmin: isAdmin,
                photoURL: user.photoURL,
                firebaseUser: true,
                provider: user.providerData[0]?.providerId || 'firebase',
                lastLogin: new Date().toISOString(),
                emailVerified: user.emailVerified,
                createdAt: user.metadata.creationTime
            };

            // Salva no localStorage
            localStorage.setItem('reputai_user', JSON.stringify(userData));
            localStorage.setItem('reputai_user_id', user.uid);
            window.currentUser = userData;

            // Verifica termos aceitos
            if (userData.id) {
                const termosKey = `reputai_termos_${userData.id}`;
                window.termosAceitos = localStorage.getItem(termosKey) === 'true';
            }

            // Salva no Firestore (opcional)
            if (window.firebaseDb) {
                try {
                    await window.firebaseDb.collection('users').doc(user.uid).set({
                        ...userData,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                } catch (firestoreError) {
                    console.warn('⚠️ Não foi possível salvar no Firestore:', firestoreError);
                }
            }

            // Atualiza interface
            setTimeout(() => {
                if (typeof updateUserInterface === 'function') {
                    updateUserInterface();
                }
            }, 200);

        } else {
            // Usuário deslogado - limpa dados
            localStorage.removeItem('reputai_user');
            localStorage.removeItem('reputai_user_id');
            window.currentUser = null;
            window.termosAceitos = false;
            console.log('👤 Sessão finalizada, dados limpos');
        }
    });
}

// ==================== FUNÇÕES DE AUTENTICAÇÃO ====================
async function loginWithFirebase(email, password) {
    if (!window.firebaseAuth) {
        if (!initFirebase()) {
            return { success: false, message: 'Firebase não disponível' };
        }
    }

    try {
        const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        
        // Mensagem especial para admin
        const isAdmin = window.firebaseAdminEmails.includes(result.user.email);
        const message = isAdmin 
            ? '👑 Bem-vindo, Administrador!' 
            : '✅ Login realizado com sucesso!';
            
        return {
            success: true,
            user: result.user,
            message: message,
            isAdmin: isAdmin
        };
    } catch (error) {
        console.error('❌ Erro no login Firebase:', error);
        
        // Mensagens de erro amigáveis
        let message = 'Erro ao fazer login';
        if (error.code === 'auth/user-not-found') {
            message = 'Usuário não encontrado';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Senha incorreta';
        } else if (error.code === 'auth/too-many-requests') {
            message = 'Muitas tentativas. Tente novamente mais tarde';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Email inválido';
        } else if (error.code === 'auth/network-request-failed') {
            message = 'Erro de conexão. Verifique sua internet';
        }
        
        return {
            success: false,
            message: message,
            errorCode: error.code
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
        // Validação adicional
        if (password.length < 6) {
            return { 
                success: false, 
                message: 'A senha deve ter pelo menos 6 caracteres' 
            };
        }

        // 1. Cria usuário
        const result = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        
        // 2. Atualiza perfil com nome
        await result.user.updateProfile({
            displayName: name
        });

        // 3. Cria dados locais
        const userData = {
            id: result.user.uid,
            name: name,
            email: email,
            avatar: name.charAt(0).toUpperCase(),
            isAdmin: window.firebaseAdminEmails.includes(email),
            firebaseUser: true,
            provider: 'email',
            lastLogin: new Date().toISOString(),
            emailVerified: false,
            justRegistered: true
        };
        
        localStorage.setItem('reputai_user', JSON.stringify(userData));
        localStorage.setItem('reputai_user_id', result.user.uid);

        return {
            success: true,
            user: result.user,
            message: '✅ Conta criada com sucesso!',
            needsVerification: false
        };
    } catch (error) {
        console.error('❌ Erro no registro Firebase:', error);
        
        let message = 'Erro ao criar conta';
        if (error.code === 'auth/email-already-in-use') {
            message = 'Este email já está em uso';
        } else if (error.code === 'auth/weak-password') {
            message = 'A senha é muito fraca';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Email inválido';
        }
        
        return {
            success: false,
            message: message,
            errorCode: error.code
        };
    }
}

async function loginWithGoogle() {
    if (!window.firebaseAuth) {
        if (!initFirebase()) {
            return { success: false, message: 'Firebase não disponível' };
        }
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    try {
        const result = await window.firebaseAuth.signInWithPopup(provider);
        const user = result.user;
        
        // Verifica se é administrador
        const isAdmin = window.firebaseAdminEmails.includes(user.email);
        
        // Verifica se há conta local com mesmo email para vincular
        const localUsers = JSON.parse(localStorage.getItem('reputai_users') || '[]');
        const localUser = localUsers.find(u => u.email === user.email);
        
        let message = '✅ Login com Google realizado com sucesso!';
        const hasLocalAccount = !!localUser;
        
        // Salva dados locais
        const userData = {
            id: user.uid,
            name: user.displayName,
            email: user.email,
            avatar: user.photoURL || user.displayName?.charAt(0).toUpperCase(),
            isAdmin: isAdmin,
            photoURL: user.photoURL,
            firebaseUser: true,
            provider: 'google',
            lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('reputai_user', JSON.stringify(userData));
        localStorage.setItem('reputai_user_id', user.uid);
        
        return {
            success: true,
            user: user,
            message: message,
            isAdmin: isAdmin,
            hasLocalAccount: hasLocalAccount
        };
    } catch (error) {
        console.error('❌ Erro no login com Google:', error);
        
        let message = 'Erro ao fazer login com Google';
        if (error.code === 'auth/popup-closed-by-user') {
            message = 'Login cancelado pelo usuário';
        }
        
        return {
            success: false,
            message: message,
            errorCode: error.code
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
    provider.addScope('email');
    
    try {
        const result = await window.firebaseAuth.signInWithPopup(provider);
        const user = result.user;
        
        // Verifica se é administrador
        const isAdmin = window.firebaseAdminEmails.includes(user.email);
        
        // Salva dados locais
        const userData = {
            id: user.uid,
            name: user.displayName,
            email: user.email,
            avatar: user.photoURL || user.displayName?.charAt(0).toUpperCase(),
            isAdmin: isAdmin,
            photoURL: user.photoURL,
            firebaseUser: true,
            provider: 'facebook',
            lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('reputai_user', JSON.stringify(userData));
        localStorage.setItem('reputai_user_id', user.uid);
        
        return {
            success: true,
            user: user,
            message: '✅ Login com Facebook realizado com sucesso!',
            isAdmin: isAdmin
        };
    } catch (error) {
        console.error('❌ Erro no login com Facebook:', error);
        
        let message = 'Erro ao fazer login com Facebook';
        if (error.code === 'auth/popup-closed-by-user') {
            message = 'Login cancelado pelo usuário';
        }
        
        return {
            success: false,
            message: message,
            errorCode: error.code
        };
    }
}

async function logoutFirebase() {
    if (window.firebaseAuth) {
        try {
            await window.firebaseAuth.signOut();
            console.log('✅ Logout do Firebase realizado');
            return true;
        } catch (error) {
            console.error('❌ Erro no logout Firebase:', error);
            return false;
        }
    }
    return true;
}

async function sendPasswordResetEmail(email) {
    if (!window.firebaseAuth) {
        if (!initFirebase()) {
            return { success: false, message: 'Firebase não disponível' };
        }
    }

    try {
        await window.firebaseAuth.sendPasswordResetEmail(email);
        
        return {
            success: true,
            message: '📧 Email de recuperação enviado! Verifique sua caixa de entrada.',
            email: email
        };
    } catch (error) {
        console.error('❌ Erro ao enviar email de recuperação:', error);
        
        let message = 'Erro ao enviar email de recuperação';
        if (error.code === 'auth/user-not-found') {
            message = 'Usuário não encontrado';
        }
        
        return {
            success: false,
            message: message,
            errorCode: error.code
        };
    }
}

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================
if (typeof firebase !== 'undefined') {
    initFirebase();
    setupAuthListener();
} else {
    console.warn('⚠️ Firebase SDK ainda não carregou.');
    
    // Tenta novamente quando SDK carregar
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined') {
            initFirebase();
            setupAuthListener();
            clearInterval(checkFirebase);
            console.log('✅ Firebase SDK carregado com sucesso');
        }
    }, 500);
    
    // Timeout após 10 segundos
    setTimeout(() => {
        if (checkFirebase) clearInterval(checkFirebase);
        console.error('❌ Firebase SDK não carregou após 10 segundos');
    }, 10000);
}

// ==================== EXPORTAÇÕES GLOBAIS ====================
window.loginWithFirebase = loginWithFirebase;
window.registerWithFirebase = registerWithFirebase;
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;
window.logoutFirebase = logoutFirebase;
window.sendPasswordResetEmail = sendPasswordResetEmail;

console.log('✅ [firebase-config] Firebase configurado');