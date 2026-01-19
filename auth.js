console.log('🔐 [auth] Carregando interface de autenticação...');

// ==================== VARIÁVEIS ====================
let authModal = null;
window.currentUser = null;
window.termosAceitos = false;

// ==================== SISTEMA UNIFICADO DE AUTENTICAÇÃO ====================
async function unifiedLogin(email, password) {
    console.log('🔐 Tentando login com:', email);
    
    // Verificar admin local
    if (email === "gusta2206@admin.com" && password === "B@tata123") {
        const adminData = {
            id: 9999,
            name: "Administrador",
            email: "gusta2206@admin.com",
            avatar: "👑",
            isAdmin: true,
            joined: new Date().toISOString(),
            provider: 'email'
        };
        
        localStorage.setItem('reputai_user', JSON.stringify(adminData));
        window.currentUser = adminData;
        
        return {
            success: true,
            user: adminData,
            message: '👑 Bem-vindo, Administrador!'
        };
    }
    
    // Tentar Firebase
    if (typeof loginWithFirebase === 'function') {
        const result = await loginWithFirebase(email, password);
        if (result.success) {
            result.user.isAdmin = email === "gusta2206@admin.com";
            return result;
        }
    }
    
    // Fallback local
    const savedUsers = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    const localUser = savedUsers.find(u => u.email === email && u.password === password);
    
    if (localUser) {
        const userData = {
            id: localUser.id,
            name: localUser.name,
            email: localUser.email,
            avatar: localUser.avatar || localUser.name.charAt(0).toUpperCase(),
            joined: localUser.joined,
            isAdmin: localUser.isAdmin || email === "gusta2206@admin.com",
            provider: 'email'
        };
        
        localStorage.setItem('reputai_user', JSON.stringify(userData));
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

async function unifiedRegister(name, email, password, cpf) {
    // Validações...
    if (typeof registerWithFirebase === 'function') {
        const result = await registerWithFirebase(name, email, password, cpf);
        if (result.success) return result;
    }

    // Fallback local
    const savedUsers = JSON.parse(localStorage.getItem('reputai_users') || '[]');
    if (savedUsers.some(u => u.email === email)) return { success: false, message: 'Email já cadastrado' };

    const newUser = {
        id: savedUsers.length + 1,
        name,
        email,
        password,
        cpf,
        avatar: name.charAt(0).toUpperCase(),
        joined: new Date().toISOString(),
        isAdmin: false,
        provider: 'email'
    };

    savedUsers.push(newUser);
    localStorage.setItem('reputai_users', JSON.stringify(savedUsers));

    const userData = { ...newUser };
    delete userData.password;

    localStorage.setItem('reputai_user', JSON.stringify(userData));
    window.currentUser = userData;

    return { success: true, user: userData, message: 'Conta criada!' };
}

function updateUserInterface() {
    const loginBtn = document.getElementById('login-btn');
    const userAvatar = document.getElementById('user-avatar');
    const userMenu = document.getElementById('user-menu');
    const adminLink = document.getElementById('admin-link');

    if (window.currentUser) {
        loginBtn.style.display = 'none';
        userAvatar.textContent = window.currentUser.avatar;
        userAvatar.style.display = 'block';
        userMenu.style.display = 'block';
        if (window.currentUser.isAdmin) adminLink.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        userAvatar.style.display = 'none';
        userMenu.style.display = 'none';
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function logout() {
    localStorage.removeItem('reputai_user');
    window.currentUser = null;
    updateUserInterface();
    showToast('Logout realizado', 'success');
}

// ==================== EXPORTAÇÕES ====================
window.unifiedLogin = unifiedLogin;
window.unifiedRegister = unifiedRegister;
window.updateUserInterface = updateUserInterface;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;

console.log('✅ [auth] Interface de autenticação carregada');