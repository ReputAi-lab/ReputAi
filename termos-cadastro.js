// termos-cadastro.js - Termos apenas no cadastro
console.log('📜 [termos] Sistema de termos carregado...');

function showTermosModal() {
    const modal = document.getElementById('termos-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        
        const checkbox = document.getElementById('concordar-termos');
        const button = document.getElementById('aceitar-termos-btn');
        
        if (checkbox && button) {
            checkbox.checked = false;
            button.disabled = true;
            
            checkbox.onchange = function() {
                button.disabled = !this.checked;
            };
        }
    }
}

function hideTermosModal() {
    const modal = document.getElementById('termos-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function aceitarTermos() {
    if (!window.currentUser) {
        showToast('Erro: usuário não encontrado', 'error');
        return;
    }
    
    // Remove flag de recém-cadastrado
    const userData = JSON.parse(localStorage.getItem('reputai_user') || '{}');
    delete userData.justRegistered;
    localStorage.setItem('reputai_user', JSON.stringify(userData));
    
    hideTermosModal();
    showToast('✅ Termos de uso aceitos com sucesso!', 'success');
}

// Verifica se é novo usuário após carregar
setTimeout(() => {
    if (window.currentUser && window.currentUser.justRegistered) {
        console.log('📜 Novo usuário detectado - mostrando termos...');
        setTimeout(() => {
            showTermosModal();
        }, 1500);
    }
}, 2000);

// Configura eventos
document.addEventListener('DOMContentLoaded', function() {
    const aceitarTermosBtn = document.getElementById('aceitar-termos-btn');
    const concordarTermosCheckbox = document.getElementById('concordar-termos');
    
    if (aceitarTermosBtn && concordarTermosCheckbox) {
        concordarTermosCheckbox.addEventListener('change', function() {
            aceitarTermosBtn.disabled = !this.checked;
        });
        
        aceitarTermosBtn.addEventListener('click', aceitarTermos);
    }
});

// Exportações
window.showTermosModal = showTermosModal;
window.hideTermosModal = hideTermosModal;
window.aceitarTermos = aceitarTermos;