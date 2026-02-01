import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { app } from "./firebase-config.js";

const db = getFirestore(app);
let companiesCache = [];

/* ================= EMPRESAS ================= */
export async function loadCompanies() {
  const snap = await getDocs(collection(db, "companies"));

  companiesCache = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  localStorage.setItem(
    "reputai_companies_cache",
    JSON.stringify(companiesCache)
  );

  renderCompaniesIfNeeded();
  return companiesCache;
}

export function getCompaniesForMap() {
  return companiesCache;
}

function renderCompaniesIfNeeded() {
  const grid = document.getElementById("companies-grid");
  if (!grid) return;

  const noCompanies = document.getElementById("no-companies");
  grid.innerHTML = "";

  if (companiesCache.length === 0) {
    if (noCompanies) noCompanies.style.display = "block";
    return;
  }

  if (noCompanies) noCompanies.style.display = "none";

  companiesCache.forEach(c => {
    const card = document.createElement("div");
    card.className = "company-card";
    card.innerHTML = `
      <h3>${c.name}</h3>
      <p><i class="fas fa-industry"></i> ${c.sector || "—"}</p>
      <p><i class="fas fa-star"></i> ${c.averageRating?.toFixed(1) || "0.0"} (${c.totalReviews || 0})</p>
    `;
    grid.appendChild(card);
  });
}

/* ================= AVALIAÇÕES ================= */
export async function saveEvaluation(data) {
  const q = query(
    collection(db, "reviews"),
    where("companyId", "==", data.companyId),
    where("userId", "==", data.userId)
  );

  const existing = await getDocs(q);
  if (!existing.empty) {
    alert("Você já avaliou esta empresa.");
    return;
  }

  await addDoc(collection(db, "reviews"), {
    ...data,
    createdAt: serverTimestamp(),
    status: "approved"
  });

  const companyRef = doc(db, "companies", data.companyId);
  const snap = await getDoc(companyRef);

  const total = snap.data().totalReviews || 0;
  const avg = snap.data().averageRating || 0;

  const newTotal = total + 1;
  const newAvg = (avg * total + data.rating) / newTotal;

  await updateDoc(companyRef, {
    totalReviews: newTotal,
    averageRating: Number(newAvg.toFixed(2))
  });

  alert("Avaliação enviada com sucesso!");
}

/* ================= BOOT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  const cached = localStorage.getItem("reputai_companies_cache");
  if (cached) {
    companiesCache = JSON.parse(cached);
    renderCompaniesIfNeeded();
  }
  await loadCompanies();
});
