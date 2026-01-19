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

function initFirebase() {
    if (typeof firebase === 'undefined') return false;

    if (!firebase.apps.length) {
        window.firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
        window.firebaseApp = firebase.app();
    }

    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();

    if (location.hostname === "localhost") {
        window.firebaseDb.useEmulator('localhost', 8080);
    }

    window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    return true;
}

function setupAuthListener() {
    window.firebaseAuth.onAuthStateChanged(user => {
        if (user) {
            const userData = {
                id: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                avatar: user.photoURL || user.displayName.charAt(0).toUpperCase(),
                isAdmin: user.email === "gusta2206@admin.com",
                provider: user.providerData[0]?.providerId || 'firebase'
            };
            localStorage.setItem('reputai_user', JSON.stringify(userData));
            window.currentUser = userData;
            updateUserInterface();
        } else {
            localStorage.removeItem('reputai_user');
            window.currentUser = null;
            updateUserInterface();
        }
    });
}

async function loginWithFirebase(email, password) {
    try {
        const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        return { success: true, user: result.user, message: 'Login realizado!' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function registerWithFirebase(name, email, password, cpf) {
    try {
        const result = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: name });
        await window.firebaseDb.collection('users').doc(result.user.uid).set({
            name,
            email,
            cpf,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, user: result.user, message: 'Conta criada!' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function logoutFirebase() {
    await window.firebaseAuth.signOut();
    return true;
}

// Inicialização
if (typeof firebase !== 'undefined') {
    initFirebase();
    setupAuthListener();
} else {
    const interval = setInterval(() => {
        if (typeof firebase !== 'undefined') {
            initFirebase();
            setupAuthListener();
            clearInterval(interval);
        }
    }, 100);
}

// Export
window.initFirebase = initFirebase;
window.loginWithFirebase = loginWithFirebase;
window.registerWithFirebase = registerWithFirebase;
window.logoutFirebase = logoutFirebase;

console.log('✅ [firebase-config] Configuração completa');