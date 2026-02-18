// auth.js
import { auth, db, onAuthStateChanged, googleProvider, facebookProvider } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    signInWithPopup, 
    updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// =======================
// UTILITÁRIOS DE TOAST
// =======================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show';
    
    if (type === 'success') toast.style.backgroundColor = 'var(--success)';
    else if (type === 'error') toast.style.backgroundColor = 'var(--danger)';
    else toast.style.backgroundColor = 'var(--info)';
    
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// =======================
// LOGIN EMAIL/SENHA
// =======================
export async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showToast('Preencha email e senha', 'error');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login realizado com sucesso!', 'success');
        hideAuthModal();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

// =======================
// REGISTRO EMAIL/SENHA
// =======================
export async function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const cpf = document.getElementById('register-cpf').value;

    if (!name || !email || !password) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Atualiza nome no perfil
        await updateProfile(user, { displayName: name });

        // Salva dados no Firestore
        await setDoc(doc(db, 'usuarios', user.uid), {
            nome: name,
            email: email,
            cpf: cpf || '',
            role: 'user',
            createdAt: new Date()
        });

        showToast('Conta criada com sucesso!', 'success');
        hideAuthModal();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

// =======================
// LOGIN GOOGLE
// =======================
export async function handleGoogleLogin() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Checa se usuário já existe
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await setDoc(docRef, {
                nome: user.displayName || '',
                email: user.email,
                role: 'user',
                createdAt: new Date()
            });
        }

        showToast('Login Google realizado com sucesso!', 'success');
        hideAuthModal();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

// =======================
// LOGIN FACEBOOK
// =======================
export async function handleFacebookLogin() {
    try {
        const result = await signInWithPopup(auth, facebookProvider);
        const user = result.user;

        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await setDoc(docRef, {
                nome: user.displayName || '',
                email: user.email,
                role: 'user',
                createdAt: new Date()
            });
        }

        showToast('Login Facebook realizado com sucesso!', 'success');
        hideAuthModal();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

// =======================
// LOGOUT
// =======================
export async function logout() {
    try {
        await signOut(auth);
        showToast('Logout realizado com sucesso!', 'success');
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
}

// =======================
// ATUALIZA HEADER E MENU
// =======================
function updateHeader(user) {
    const loginBtn = document.getElementById('login-btn');
    const userAvatar = document.getElementById('user-avatar');
    const userMenu = document.getElementById('user-menu');
    const adminLink = document.getElementById('admin-link');

    if (user) {
        loginBtn.style.display = 'none';
        userAvatar.style.display = 'block';
        userAvatar.textContent = user.displayName ? user.displayName[0].toUpperCase() : 'U';
        userMenu.style.display = 'none';

        // Busca role do usuário
        getDoc(doc(db, 'usuarios', user.uid)).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.role === 'admin') adminLink.style.display = 'block';
                else adminLink.style.display = 'none';
            }
        });
    } else {
        loginBtn.style.display = 'block';
        userAvatar.style.display = 'none';
        userMenu.style.display = 'none';
        adminLink.style.display = 'none';
    }
}

// Alterna menu de usuário
export function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu.style.display === 'block') menu.style.display = 'none';
    else menu.style.display = 'block';
}

// =======================
// MONITORA AUTH STATE
// =======================
onAuthStateChanged(user => {
    updateHeader(user);
});