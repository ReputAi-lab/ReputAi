/*************************************************
 * REPUTAÍ - FIREBASE CONFIG (PRODUÇÃO)
 * Credenciais reais do projeto reputai143
 * Firestore como base principal
 *************************************************/

/* ================= IMPORTAÇÕES ================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

/* ================= CONFIGURAÇÃO ================= */

const firebaseConfig = {
  apiKey: "AIzaSyCikJ1Cf_AS8tfKgythZdUqeyUAc96z7Eg",
  authDomain: "reputai143.firebaseapp.com",
  projectId: "reputai143",
  storageBucket: "reputai143.firebasestorage.app",
  messagingSenderId: "127119539085",
  appId: "1:127119539085:web:325373bf1da5a16b5c9bc4",
  measurementId: "G-YSDPPXKD8C"
};

/* ================= INICIALIZAÇÃO ================= */

const app = initializeApp(firebaseConfig);

/* ================= SERVIÇOS ================= */

const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

/* ================= EXPORTAÇÃO ================= */

export { auth, db, analytics };
