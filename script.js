/*************************************************
 * REPUTAÍ - SCRIPT.JS (VERSÃO COMPLETA ATUALIZADA)
 * Funcionalidades: usuário, admin, testes
 *************************************************/

import { auth, db, onAuthStateChanged } from "./firebase-config.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    FacebookAuthProvider,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

console.log("📦 [script] Inicializando ReputAí...");

let currentUser = null;

// ================== AUTH STATE ==================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("✅ Usuário autenticado:", user.email);
        updateHeaderUser(user);
        await checkAdminRole(user.uid);
    } else {
        currentUser = null;
        console.log("🔓 Usuário deslogado");
        resetHeaderUser();
    }
});

// ================== LOGIN / REGISTER ==================
export async function login() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("Login realizado com sucesso!", "success");
        hideAuthModal();
    } catch (error) {
        console.error("Erro login:", error);
        showToast(error.message, "error");
    }
}

export async function register() {
    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();
    const cpf = document.getElementById("register-cpf").value.trim();

    if (!name || !email || !password) {
        showToast("Preencha todos os campos obrigatórios!", "error");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Criar documento de usuário
        await addDoc(collection(db, "usuarios"), {
            uid: uid,
            name: name,
            email: email,
            cpf: cpf || "",
            role: "user",
            createdAt: serverTimestamp(),
        });

        showToast("Cadastro realizado com sucesso!", "success");
        hideAuthModal();
    } catch (error) {
        console.error("Erro registro:", error);
        showToast(error.message, "error");
    }
}

// ================== LOGOUT ==================
export async function logout() {
    try {
        await signOut(auth);
        showToast("Logout realizado com sucesso!", "success");
    } catch (error) {
        console.error("Erro logout:", error);
        showToast(error.message, "error");
    }
}

// ================== LOGIN SOCIAL ==================
export async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        hideAuthModal();
        showToast("Login com Google realizado!", "success");
    } catch (error) {
        console.error("Erro Google login:", error);
        showToast(error.message, "error");
    }
}

export async function handleFacebookLogin() {
    const provider = new FacebookAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        hideAuthModal();
        showToast("Login com Facebook realizado!", "success");
    } catch (error) {
        console.error("Erro Facebook login:", error);
        showToast(error.message, "error");
    }
}

// ================== HEADER ==================
function updateHeaderUser(user) {
    document.getElementById("login-btn").style.display = "none";
    const avatar = document.getElementById("user-avatar");
    avatar.style.display = "block";
    avatar.textContent = user.email.charAt(0).toUpperCase();
    document.getElementById("user-menu").style.display = "block";
}

function resetHeaderUser() {
    document.getElementById("login-btn").style.display = "block";
    document.getElementById("user-avatar").style.display = "none";
    document.getElementById("user-menu").style.display = "none";
    document.getElementById("admin-link").style.display = "none";
}

// ================== CHECK ADMIN ==================
async function checkAdminRole(uid) {
    try {
        const q = query(collection(db, "usuarios"), where("uid", "==", uid));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.role === "admin") {
                document.getElementById("admin-link").style.display = "block";
                console.log("👑 Admin detectado");
            }
        });
    } catch (error) {
        console.error("Erro ao verificar role admin:", error);
    }
}

// ================== SEARCH / FILTER ==================
export async function searchCompanies() {
    const queryText = document.getElementById("search-company").value.trim();
    const companiesList = document.getElementById("companies-list");
    companiesList.innerHTML = "";

    try {
        const q = query(collection(db, "empresas"));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
            const company = doc.data();
            if (
                company.name.toLowerCase().includes(queryText.toLowerCase()) ||
                company.sector.toLowerCase().includes(queryText.toLowerCase()) ||
                company.location.toLowerCase().includes(queryText.toLowerCase())
            ) {
                renderCompanyCard(doc.id, company);
            }
        });
    } catch (error) {
        console.error("Erro ao buscar empresas:", error);
    }
}

export async function filterBySector(sector) {
    const companiesList = document.getElementById("companies-list");
    companiesList.innerHTML = "";

    try {
        const q = query(collection(db, "empresas"), where("sector", "==", sector));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => renderCompanyCard(doc.id, doc.data()));
    } catch (error) {
        console.error("Erro ao filtrar setor:", error);
    }
}

// ================== RENDER COMPANY CARD ==================
function renderCompanyCard(id, data) {
    const companiesList = document.getElementById("companies-list");
    const card = document.createElement("div");
    card.className = "company-card";
    card.innerHTML = `
        <div class="company-card-header">
            <h3>${data.name}</h3>
            <span class="sector">${data.sector}</span>
        </div>
        <div class="company-card-body">
            <p>${data.description || "Sem descrição disponível."}</p>
            <div class="company-rating">
                <i class="fas fa-star"></i> ${data.rating ? data.rating.toFixed(1) : "0.0"} / 5
            </div>
        </div>
    `;
    companiesList.appendChild(card);
}
/*************************************************
 * REPUTAÍ - SCRIPT.JS (PARTE 2)
 * Admin Dashboard, denúncias e estatísticas
 *************************************************/

// ================== ADMIN DASHBOARD ==================
export async function loadAdminDashboard() {
    if (!currentUser) return;

    const adminPanel = document.getElementById("admin-panel");
    if (!adminPanel) return;

    adminPanel.innerHTML = "<p>Carregando informações do admin...</p>";

    try {
        // ================== ESTATÍSTICAS ==================
        const usuariosSnap = await getDocs(collection(db, "usuarios"));
        const empresasSnap = await getDocs(collection(db, "empresas"));
        const avaliacoesSnap = await getDocs(collection(db, "avaliacoes"));

        const totalUsuarios = usuariosSnap.size;
        const totalEmpresas = empresasSnap.size;
        const totalAvaliacoes = avaliacoesSnap.size;

        // Exibir estatísticas
        adminPanel.innerHTML = `
            <h2>👑 Painel Admin</h2>
            <div class="admin-stats">
                <div>Total de Usuários: ${totalUsuarios}</div>
                <div>Total de Empresas: ${totalEmpresas}</div>
                <div>Total de Avaliações: ${totalAvaliacoes}</div>
            </div>
            <h3>Denúncias Pendentes</h3>
            <div id="denuncias-list">Carregando denúncias...</div>
        `;

        await loadDenuncias();
    } catch (error) {
        console.error("Erro ao carregar painel admin:", error);
        adminPanel.innerHTML = "<p>Erro ao carregar painel. Veja o console.</p>";
    }
}

// ================== DENÚNCIAS ==================
async function loadDenuncias() {
    const denunciasList = document.getElementById("denuncias-list");
    denunciasList.innerHTML = "";

    try {
        const q = query(collection(db, "denuncias"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            denunciasList.innerHTML = "<p>Não há denúncias pendentes.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const div = document.createElement("div");
            div.className = "denuncia-card";
            div.innerHTML = `
                <p><strong>Usuário:</strong> ${data.userName || "Anônimo"}</p>
                <p><strong>Avaliação ID:</strong> ${data.avaliacaoId}</p>
                <p><strong>Motivo:</strong> ${data.reason}</p>
                <div class="denuncia-actions">
                    <button onclick="approveDenuncia('${doc.id}')">Aprovar</button>
                    <button onclick="rejectDenuncia('${doc.id}')">Rejeitar</button>
                </div>
            `;
            denunciasList.appendChild(div);
        });
    } catch (error) {
        console.error("Erro ao carregar denúncias:", error);
        denunciasList.innerHTML = "<p>Erro ao carregar denúncias.</p>";
    }
}

export async function approveDenuncia(denunciaId) {
    try {
        const denunciaRef = doc(db, "denuncias", denunciaId);
        const denunciaSnap = await getDoc(denunciaRef);
        if (!denunciaSnap.exists()) return;

        const data = denunciaSnap.data();
        const avaliacaoRef = doc(db, "avaliacoes", data.avaliacaoId);

        // Remove a avaliação denunciada
        await deleteDoc(avaliacaoRef);

        // Remove a denúncia
        await deleteDoc(denunciaRef);

        showToast("Avaliação removida e denúncia aprovada!", "success");
        loadDenuncias();
    } catch (error) {
        console.error("Erro aprovar denúncia:", error);
        showToast("Erro ao aprovar denúncia", "error");
    }
}

export async function rejectDenuncia(denunciaId) {
    try {
        await deleteDoc(doc(db, "denuncias", denunciaId));
        showToast("Denúncia rejeitada com sucesso!", "success");
        loadDenuncias();
    } catch (error) {
        console.error("Erro rejeitar denúncia:", error);
        showToast("Erro ao rejeitar denúncia", "error");
    }
}

// ================== TEST FUNCTIONS ==================
export async function populateTestData() {
    try {
        // Criar empresas teste
        const empresasRef = collection(db, "empresas");
        await addDoc(empresasRef, {
            name: "Empresa Teste 1",
            sector: "Tecnologia",
            location: "São Paulo",
            rating: 4.5,
            description: "Empresa fictícia para teste",
            createdAt: serverTimestamp(),
        });

        await addDoc(empresasRef, {
            name: "Empresa Teste 2",
            sector: "Finanças",
            location: "Rio de Janeiro",
            rating: 3.8,
            description: "Empresa fictícia para teste",
            createdAt: serverTimestamp(),
        });

        // Criar avaliações teste
        const avaliacoesRef = collection(db, "avaliacoes");
        await addDoc(avaliacoesRef, {
            userId: currentUser.uid,
            companyId: "empresaTeste1",
            rating: 5,
            comment: "Ótima experiência!",
            createdAt: serverTimestamp(),
        });

        showToast("Dados de teste populados com sucesso!", "success");
    } catch (error) {
        console.error("Erro criar dados teste:", error);
        showToast("Erro ao criar dados de teste", "error");
    }
}
/*************************************************
 * REPUTAÍ - SCRIPT.JS (PARTE 3)
 * Perfil, Avaliações e Funções Auxiliares
 *************************************************/

// ================== PERFIL DO USUÁRIO ==================
export async function loadUserProfile() {
    if (!currentUser) return;

    const profileContainer = document.getElementById("profile-container");
    if (!profileContainer) return;

    try {
        const userRef = doc(db, "usuarios", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            profileContainer.innerHTML = "<p>Erro ao carregar perfil.</p>";
            return;
        }

        const userData = userSnap.data();
        profileContainer.innerHTML = `
            <h2>Meu Perfil</h2>
            <p><strong>Nome:</strong> ${userData.name}</p>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>CPF:</strong> ${userData.cpf || "Não informado"}</p>
            <p><strong>Função:</strong> ${userData.role}</p>
            <button onclick="editUserProfile()">Editar Perfil</button>
        `;

        loadUserAvaliacoes();
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        profileContainer.innerHTML = "<p>Erro ao carregar perfil.</p>";
    }
}

async function loadUserAvaliacoes() {
    const avaliacoesContainer = document.getElementById("user-avaliacoes");
    if (!avaliacoesContainer) return;

    avaliacoesContainer.innerHTML = "<p>Carregando suas avaliações...</p>";

    try {
        const q = query(collection(db, "avaliacoes"), where("userId", "==", currentUser.uid));
        const snapshot = await getDocs(q);

        avaliacoesContainer.innerHTML = "";
        if (snapshot.empty) {
            avaliacoesContainer.innerHTML = "<p>Você ainda não fez avaliações.</p>";
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement("div");
            div.className = "avaliacao-card";
            div.innerHTML = `
                <p><strong>Empresa:</strong> ${data.companyName || "Desconhecida"}</p>
                <p><strong>Avaliação:</strong> ${data.rating} estrelas</p>
                <p>${data.comment}</p>
                <button onclick="editAvaliacao('${docSnap.id}')">Editar</button>
                <button onclick="deleteAvaliacao('${docSnap.id}')">Excluir</button>
            `;
            avaliacoesContainer.appendChild(div);
        });
    } catch (error) {
        console.error("Erro ao carregar avaliações do usuário:", error);
        avaliacoesContainer.innerHTML = "<p>Erro ao carregar avaliações.</p>";
    }
}

export async function editUserProfile() {
    showToast("Funcionalidade de edição em desenvolvimento...", "info");
}

// ================== SUBMISSÃO DE AVALIAÇÕES ==================
export async function submitAvaliacao(companyId, rating, comment) {
    if (!currentUser) {
        showToast("Você precisa estar logado para avaliar!", "error");
        return;
    }

    try {
        const avaliacoesRef = collection(db, "avaliacoes");
        await addDoc(avaliacoesRef, {
            userId: currentUser.uid,
            companyId,
            rating,
            comment,
            createdAt: serverTimestamp(),
        });

        // Atualizar média da empresa
        await updateCompanyRating(companyId);

        showToast("Avaliação enviada com sucesso!", "success");
        loadUserAvaliacoes();
        loadCompanies(); // Atualizar listagem
    } catch (error) {
        console.error("Erro ao enviar avaliação:", error);
        showToast("Erro ao enviar avaliação", "error");
    }
}

async function updateCompanyRating(companyId) {
    const avaliacoesRef = collection(db, "avaliacoes");
    const q = query(avaliacoesRef, where("companyId", "==", companyId));
    const snapshot = await getDocs(q);

    let total = 0;
    let count = 0;
    snapshot.forEach((docSnap) => {
        total += docSnap.data().rating;
        count++;
    });

    const avg = count > 0 ? total / count : 0;
    const companyRef = doc(db, "empresas", companyId);
    await updateDoc(companyRef, { rating: avg });
}

// ================== FUNÇÕES AUXILIARES ==================
export function toggleUserMenu() {
    const menu = document.getElementById("user-menu");
    if (!menu) return;

    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

// Pesquisa de empresas
export async function searchCompanies() {
    const input = document.getElementById("search-company").value.toLowerCase();
    if (!input) return loadCompanies();

    const companiesRef = collection(db, "empresas");
    const snapshot = await getDocs(companiesRef);
    const results = snapshot.docs.filter(docSnap => {
        const data = docSnap.data();
        return data.name.toLowerCase().includes(input) ||
               (data.sector && data.sector.toLowerCase().includes(input)) ||
               (data.location && data.location.toLowerCase().includes(input));
    });

    displayCompanies(results);
}

// Filtrar por setor
export async function filterBySector(sector) {
    const companiesRef = collection(db, "empresas");
    const q = query(companiesRef, where("sector", "==", sector));
    const snapshot = await getDocs(q);

    displayCompanies(snapshot.docs);
}

// Renderização de empresas
function displayCompanies(docsArray) {
    const container = document.getElementById("companies-list");
    container.innerHTML = "";

    if (!docsArray || docsArray.length === 0) {
        container.innerHTML = "<p>Nenhuma empresa encontrada.</p>";
        return;
    }

    docsArray.forEach((docSnap) => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.className = "company-card";
        div.innerHTML = `
            <h3>${data.name}</h3>
            <p><strong>Setor:</strong> ${data.sector}</p>
            <p><strong>Localização:</strong> ${data.location}</p>
            <p><strong>Avaliação:</strong> ${data.rating || 0} estrelas</p>
        `;
        container.appendChild(div);
    });
}

// ================== EVENTOS GERAIS ==================
document.addEventListener("click", (e) => {
    const menu = document.getElementById("user-menu");
    if (!menu) return;

    if (!e.target.closest(".user-menu-container")) {
        menu.style.display = "none";
    }
});