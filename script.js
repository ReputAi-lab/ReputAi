/*************************************************
 * REPUTAÍ - SCRIPT PRINCIPAL
 * Firestore-first | Layout preservado
 *************************************************/

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const db = getFirestore();

let companies = [];
let userLocation = null;

/* ================= TOAST ================= */
export function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ================= CACHE ================= */
function saveCompaniesCache(data) {
  localStorage.setItem('reputai_companies', JSON.stringify(data));
}

function loadCompaniesCache() {
  return JSON.parse(localStorage.getItem('reputai_companies') || '[]');
}

/* ================= EMPRESAS ================= */
export async function loadCompanies() {
  try {
    const snapshot = await getDocs(collection(db, 'companies'));

    companies = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    saveCompaniesCache(companies);
    console.log('🔥 Empresas carregadas do Firestore');

  } catch (err) {
    console.warn('⚠️ Firestore indisponível, usando cache local');
    companies = loadCompaniesCache();
  }

  displayCompanies();
}

function displayCompanies() {
  const grid = document.getElementById('companies-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (!companies.length) {
    document.getElementById('no-companies')?.style.display = 'block';
    return;
  }

  companies.forEach(c => {
    const card = document.createElement('div');
    card.className = 'company-card';

    card.innerHTML = `
      <h3>${c.name}</h3>
      <p>${c.sector || 'Setor não informado'}</p>
      <p>⭐ ${c.averageRating || 0} (${c.totalReviews || 0})</p>
      <a href="avaliacao.html?companyId=${c.id}" class="btn btn-primary">
        Avaliar
      </a>
    `;

    grid.appendChild(card);
  });
}

/* ================= AVALIAÇÕES ================= */
export async function saveEvaluation(evaluation) {
  try {
    // 1️⃣ Salva avaliação
    await addDoc(collection(db, 'reviews'), {
      companyId: evaluation.companyId,
      rating: evaluation.rating,
      environment: evaluation.environment,
      benefits: evaluation.benefits || [],
      createdAt: serverTimestamp()
    });

    // 2️⃣ Atualiza estatísticas da empresa
    const companyRef = doc(db, 'companies', evaluation.companyId);

    await updateDoc(companyRef, {
      totalReviews: increment(1),
      ratingSum: increment(evaluation.rating)
    });

    showToast('Avaliação enviada com sucesso!', 'success');
    setTimeout(() => location.href = 'empresas.html', 1500);

  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar avaliação', 'error');
  }
}

/* ================= ESTATÍSTICAS ================= */
export async function updateStats() {
  try {
    const companiesSnap = await getDocs(collection(db, 'companies'));
    const reviewsSnap = await getDocs(collection(db, 'reviews'));

    const companiesData = companiesSnap.docs.map(d => d.data());
    const reviewsData = reviewsSnap.docs.map(d => d.data());

    const sectors = [...new Set(companiesData.map(c => c.sector).filter(Boolean))];
    const totalRating = reviewsData.reduce((s, r) => s + (r.rating || 0), 0);
    const avgRating = reviewsData.length ? (totalRating / reviewsData.length).toFixed(1) : '0.0';

    document.getElementById('total-empresas')?.textContent = companiesData.length;
    document.getElementById('total-avaliacoes')?.textContent = reviewsData.length;
    document.getElementById('media-geral')?.textContent = avgRating;
    document.getElementById('total-setores')?.textContent = sectors.length;

  } catch (e) {
    console.warn('⚠️ Estatísticas via cache');
    const cached = loadCompaniesCache();
    document.getElementById('total-empresas')?.textContent = cached.length;
  }
}

/* ================= MAPA ================= */
export function getCompaniesForMap() {
  return companies.filter(c => c.lat && c.lng);
}

/* ================= GEO ================= */
export function requestLocationPermission() {
  if (!navigator.geolocation) {
    showToast('Geolocalização não suportada', 'error');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
      showToast('Localização obtida!', 'success');
    },
    () => showToast('Permissão negada', 'warning')
  );
}

/* ================= INIT ================= */
document.addEventListener('DOMContentLoaded', () => {
  loadCompanies();
  updateStats();
});
