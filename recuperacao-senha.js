// recuperacao-senha.js - Sistema simplificado de recuperação
console.log('🔐 [recuperacao] Sistema carregado...');

function showPasswordRecoveryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'recovery-modal';
    modal.innerHTML = `
        <div class="auth-modal" style="max-width:500px;">
            <button class="modal-close" onclick="hidePasswordRecoveryModal()">&times;</button>
            <div class="modal-header" style="background:linear-gradient(135deg, #8B5CF6, #7C3AED);">
                <h2><i class="fas fa-key"></i> Recuperação de Senha</h2>
                <p>Digite seu email para recuperar o acesso</p>
            </div>
            <div style="padding:1.5rem;">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="recovery-email" placeholder="seu@email.com">
                </div>
                <button class="btn btn-primary" onclick="sendRecoveryEmail()" style="width:100%;margin-top:1rem;">
                    <i class="fas fa-paper-plane"></i> Enviar Link de Recuperação
                </button>
                <div style="text-align:center;margin-top:1rem;">
                    <p style="color:var(--gray);">
                        Lembrou a senha? <a href="#" onclick="hidePasswordRecoveryModal();showAuthModal();">Faça login</a>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    
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

async function sendRecoveryEmail() {
    const email = document.getElementById('recovery-email')?.value.trim();
    
    if (!email) {
        showToast('Digite seu email', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Email inválido', 'error');
        return;
    }
    
    // Simula envio (em produção usar Firebase)
    showToast('📧 Link de recuperação enviado! Verifique seu email.', 'success');
    setTimeout(() => {
        hidePasswordRecoveryModal();
    }, 2000);
}

// Adiciona link "Esqueci a senha" aos modais
setTimeout(() => {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    
    const addForgotLink = (tab) => {
        if (tab && !tab.querySelector('.forgot-password-link')) {
            const linkHTML = `
                <div style="text-align:center;margin-top:1rem;">
                    <p style="color:var(--gray);">
                        <a href="#" class="forgot-password-link" style="font-size:0.9rem;color:var(--primary);">
                            <i class="fas fa-question-circle"></i> Esqueceu a senha?
                        </a>
                    </p>
                </div>
            `;
            tab.insertAdjacentHTML('beforeend', linkHTML);
            
            const link = tab.querySelector('.forgot-password-link');
            if (link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    hideAuthModal();
                    showPasswordRecoveryModal();
                });
            }
        }
    };
    
    addForgotLink(loginTab);
    addForgotLink(registerTab);
}, 1000);

// Exportações
window.showPasswordRecoveryModal = showPasswordRecoveryModal;
window.hidePasswordRecoveryModal = hidePasswordRecoveryModal;
window.sendRecoveryEmail = sendRecoveryEmail;