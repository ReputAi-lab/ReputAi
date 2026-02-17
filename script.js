/*************************************************
 * REPUTAÍ - SCRIPT.JS (PRODUÇÃO FINAL REAL)
 * Firestore como fonte única de dados
 *************************************************/

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= UTIL ================= */

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* ================= EMPRESAS ================= */

export async function loadCompanies() {
  const snapshot = await getDocs(collection(db, "companies"));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/* ================= AVALIAÇÕES ================= */

export async function submitEvaluation(event) {
  event.preventDefault();

  if (!window.ReputaiState.user) {
    showToast("Você precisa estar logado para avaliar.");
    return;
  }

  const companyName = document.getElementById("company-name").value.trim();
  const ratingInput = document.querySelector("input[name='rating']:checked");
  const reviewText = document.getElementById("review-text").value.trim();
  const anonimo = document.getElementById("anonimo").checked;

  if (!companyName || !ratingInput || reviewText.length < 50) {
    showToast("Preencha todos os campos corretamente.");
    return;
  }

  const rating = Number(ratingInput.value);

  await addDoc(collection(db, "reviews"), {
    companyName,
    rating,
    text: reviewText,
    anonymous: anonimo,
    userId: window.ReputaiState.user.uid,
    createdAt: serverTimestamp()
  });

  await updateCompanyStats(companyName, rating);

  showToast("Avaliação enviada com sucesso!");
  event.target.reset();
}

/* ================= ESTATÍSTICAS ================= */

async function updateCompanyStats(companyName, rating) {
  const q = query(
    collection(db, "companies"),
    where("name", "==", companyName)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    await addDoc(collection(db, "companies"), {
      name: companyName,
      sector: "Outros",
      averageRating: rating,
      reviewCount: 1
    });
    return;
  }

  const companyDoc = snap.docs[0];
  const data = companyDoc.data();

  const total = data.averageRating * data.reviewCount + rating;
  const newCount = data.reviewCount + 1;
  const newAverage = total / newCount;

  await updateDoc(doc(db, "companies", companyDoc.id), {
    reviewCount: newCount,
    averageRating: newAverage
  });
}

/* ================= PERFIL ================= */

export async function loadUserReviews() {
  if (!window.ReputaiState.user) return [];

  const q = query(
    collection(db, "reviews"),
    where("userId", "==", window.ReputaiState.user.uid)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => doc.data());
}

/* ================= MOBILE SCROLL ================= */

let lastScrollTop = 0;

window.addEventListener("scroll", () => {
  const header = document.getElementById("main-header");
  if (!header) return;

  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

  if (currentScroll > lastScrollTop && currentScroll > 50) {
    header.classList.add("hide");
  } else {
    header.classList.remove("hide");
  }

  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});

/* ================= EXPORT GLOBAL ================= */

window.Reputai = {
  loadCompanies,
  submitEvaluation,
  loadUserReviews
};
