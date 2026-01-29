/*************************************************
 * REPUTAÍ - SCRIPT.JS (PRODUÇÃO FINAL)
 * Blindado contra erro de carregamento
 *************************************************/

(async () => {
  console.log("📦 [script] Inicializando ReputAí...");

  let db = null;

  /* ================= FIREBASE ================= */
  try {
    const firebase = await import("./firebase-config.js");
    db = firebase.db;
    console.log("🔥 [script] Firestore conectado");
  } catch (e) {
    console.warn("⚠️ [script] Firestore indisponível, usando localStorage");
  }

  /* ================= FIRESTORE SDK ================= */
  async function fs() {
    return await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
  }

  /* ================= LOCAL STORAGE ================= */
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
        const { collection, getDocs } = await fs();
        const snap = await getDocs(collection(db, "companies"));
        const companies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLocal("reputai_companies", companies);
        return companies;
      } catch (e) {
        console.warn("⚠️ Firestore falhou, fallback local");
      }
    }
    return getLocal("reputai_companies");
  }

  /* ================= AVALIAÇÕES ================= */
  async function saveReview(review) {
    if (db) {
      try {
        const { collection, addDoc, serverTimestamp } = await fs();
        await addDoc(collection(db, "reviews"), {
          ...review,
          createdAt: serverTimestamp()
        });
        console.log("⭐ Avaliação salva no Firestore");
        return true;
      } catch (e) {
        console.warn("⚠️ Falha Firestore, salvando local");
      }
    }

    const reviews = getLocal("reputai_reviews");
    reviews.push(review);
    setLocal("reputai_reviews", reviews);
    return true;
  }

  /* ================= ESTATÍSTICAS ================= */
  async function updateCompanyStats(companyName, rating) {
    if (!db) return;

    try {
      const {
        collection,
        query,
        where,
        getDocs,
        addDoc,
        updateDoc,
        doc
      } = await fs();

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
      console.warn("⚠️ Erro ao atualizar estatísticas");
    }
  }

  /* ================= EXPORT GLOBAL ================= */
  window.Reputai = {
    loadCompanies,
    saveReview,
    updateCompanyStats
  };

  console.log("✅ [script] ReputAí carregado com sucesso");
})();
