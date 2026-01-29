/*************************************************
 * REPUTAÍ - SCRIPT.JS (PRODUÇÃO)
 * Empresas, avaliações e estatísticas
 *************************************************/

console.log("📦 [script] Inicializando sistema ReputAí...");

/* ================= FIREBASE ================= */

let db = null;

(async () => {
  try {
    const firebase = await import("./firebase-config.js");
    db = firebase.db;
    console.log("🔥 [script] Firestore conectado");
  } catch (e) {
    console.warn("⚠️ [script] Firestore indisponível, usando fallback local");
  }
})();

/* ================= FIRESTORE IMPORTS ================= */

async function firestore() {
  return await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
}

/* ================= HELPERS LOCAL ================= */

function getLocal(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function setLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ================= EMPRESAS ================= */

async function loadCompanies() {
  if (db) {
    try {
      const { collection, getDocs } = await firestore();
      const snap = await getDocs(collection(db, "companies"));
      const companies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLocal("reputai_companies", companies);
      return companies;
    } catch (e) {
      console.warn("⚠️ Erro Firestore empresas, fallback local");
    }
  }
  return getLocal("reputai_companies");
}

/* ================= AVALIAÇÕES ================= */

async function saveReview(review) {
  if (db) {
    try {
      const { collection, addDoc, serverTimestamp } = await firestore();
      await addDoc(collection(db, "reviews"), {
        ...review,
        createdAt: serverTimestamp()
      });
      console.log("⭐ Avaliação salva no Firestore");
      return;
    } catch (e) {
      console.warn("⚠️ Falha Firestore avaliação, salvando local");
    }
  }
  const reviews = getLocal("reputai_reviews");
  reviews.push(review);
  setLocal("reputai_reviews", reviews);
}

/* ================= ESTATÍSTICAS ================= */

async function updateCompanyStats(companyName, rating) {
  if (db) {
    try {
      const {
        collection,
        query,
        where,
        getDocs,
        addDoc,
        updateDoc,
        doc
      } = await firestore();

      const q = query(collection(db, "companies"), where("name", "==", companyName));
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

      const ref = doc(db, "companies", snap.docs[0].id);
      const data = snap.docs[0].data();

      const total = data.averageRating * data.reviewCount + rating;
      const count = data.reviewCount + 1;

      await updateDoc(ref, {
        reviewCount: count,
        averageRating: (total / count).toFixed(1)
      });

    } catch (e) {
      console.warn("⚠️ Erro estatística Firestore");
    }
  }
}

/* ================= UI ================= */

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

/* ================= EXPORT GLOBAL ================= */

window.Reputai = {
  loadCompanies,
  saveReview,
  updateCompanyStats
};

console.log("✅ [script] Sistema ReputAí carregado");
