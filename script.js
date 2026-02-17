// script.js - Configuração principal ATUALIZADA PARA FIRESTORE

import { db } from './firebase-config.js';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let userLocation = null;
let locationPermission = false;
let typingInterval = null;
let map = null;
let companies = [];
let evaluationData = null;

// ==================== HEADER SCROLL ====================
function initHeaderScroll() {
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (!header) return;
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// ==================== EMPRESAS - FIRESTORE ====================
async function loadCompanies() {
    try {
        const snapshot = await getDocs(collection(db, "companies"));
        companies = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));

        window.companies = companies;
        return companies;

    } catch (error) {
        console.error("Erro ao carregar empresas:", error);
        showToast("Erro ao carregar empresas", "error");
        return [];
    }
}

async function loadHomeCompanies() {
    const all = await loadCompanies();
    displayCompanies(all.slice(0, 4));
    if (map) addCompaniesToMap(all.slice(0, 4));
}

// ==================== AVALIAÇÃO - FIRESTORE ====================
async function submitEvaluation(evalData) {
    try {
        const companiesRef = collection(db, "companies");
        const q = query(companiesRef, where("name", "==", evalData.companyName));
        const snap = await getDocs(q);

        let companyId;
        let companyData;

        if (snap.empty) {
            const newCompany = await addDoc(companiesRef, {
                name: evalData.companyName,
                sector: evalData.sector,
                location: evalData.location,
                description: `Empresa cadastrada através de avaliação`,
                averageRating: evalData.rating,
                reviewCount: 1,
                createdAt: serverTimestamp()
            });

            companyId = newCompany.id;
            companyData = { averageRating: evalData.rating, reviewCount: 1 };

        } else {
            const companyDoc = snap.docs[0];
            companyId = companyDoc.id;
            companyData = companyDoc.data();

            const newCount = companyData.reviewCount + 1;
            const newAverage =
                ((companyData.averageRating * companyData.reviewCount) + evalData.rating) / newCount;

            await updateDoc(doc(db, "companies", companyId), {
                reviewCount: newCount,
                averageRating: newAverage
            });
        }

        await addDoc(collection(db, "evaluations"), {
            companyId,
            userId: currentUser ? currentUser.id : "anon",
            userName: currentUser ? currentUser.name : "Anônimo",
            rating: evalData.rating,
            text: evalData.text,
            createdAt: serverTimestamp(),
            avisoAceito: true
        });

        showToast("Avaliação enviada com sucesso!", "success");
        await loadHomeCompanies();

    } catch (error) {
        console.error("Erro ao enviar avaliação:", error);
        showToast("Erro ao enviar avaliação", "error");
    }
}

// ==================== MAPA ====================
function initMap() {
    if (document.getElementById('map')) {
        map = L.map('map').setView([-15.7801, -47.9292], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        if (companies.length > 0) {
            addCompaniesToMap(companies);
        }
    }
}

function addCompaniesToMap(companiesArray) {
    if (!map) return;

    companiesArray.forEach(company => {
        if (company.lat && company.lng) {
            L.marker([company.lat, company.lng])
                .addTo(map)
                .bindPopup(`
                    <div style="min-width:200px">
                        <b>${company.name}</b><br>
                        <small>${company.location}</small><br>
                        <div style="color:#FFD700;margin:5px 0;">
                            ${'★'.repeat(Math.floor(company.averageRating))}
                            ${'☆'.repeat(5 - Math.floor(company.averageRating))}
                        </div>
                        <small>${company.averageRating?.toFixed(1) || 0}/5 (${company.reviewCount || 0} avaliações)</small>
                    </div>
                `);
        }
    });
}

// ==================== UTILITÁRIOS ====================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const colors = {
        success: '#10b981',
        error: '#dc2626',
        info: '#3b82f6'
    };

    toast.textContent = message;
    toast.style.background = colors[type] || colors.info;
    toast.className = 'toast show';

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// ==================== INICIALIZAÇÃO ====================
async function initApp() {
    initHeaderScroll();
    initMap();
    await loadHomeCompanies();
}

document.addEventListener("DOMContentLoaded", initApp);

// ==================== EXPORT GLOBAL ====================
window.submitEvaluation = submitEvaluation;
window.loadHomeCompanies = loadHomeCompanies;
window.showToast = showToast;
