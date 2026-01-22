console.log('🔐 [auth] Sistema de autenticação carregando...');

window.currentUser = null;

async function unifiedLogin(email, password) {
    // Removido hardcoded admins por segurança
    // Use custom claims para admin
    if (window.firebaseInitialized) {
        // Firebase login
        // ... como original, mas com try-catch
    } else {
        // Local
        const savedUsers = JSON.parse(localStorage.getItem('reputai_users') || '[]');
        const user = savedUsers.find(u => u.email === email && u.password === password); // Hash password in prod
        if (user) {
            window.currentUser = user;
            localStorage.setItem('reputai_user', JSON.stringify(user));
            return { success: true };
        }
        return { success: false };
    }
}

// Similar para register, com sanitização
function unifiedRegister(name, email, password) {
    name = PURIFY.sanitize(name); // XSS
    // ... resto como original
}

// Logout completo
async function logout() {
    if (window.firebaseInitialized) {
        firebase.auth().signOut();
    }
    localStorage.removeItem('reputai_user');
    window.currentUser = null;
    updateUI();
    showToast('Logout realizado', 'success');
}

// ... resto completo como original, com event listeners