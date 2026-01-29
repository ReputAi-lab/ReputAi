/*************************************************
 * REPUTAÍ - AUTH.JS (PRODUÇÃO)
 * Login, cadastro e admin real
 *************************************************/

import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= ESTADO ================= */

let currentUser = null;

/* ================= HELPERS ================= */

function saveUserLocal(user) {
  localStorage.setItem("reputai_user", JSON.stringify(user));
}

function loadUserLocal() {
  return JSON.parse(localStorage.getItem("reputai_user") || "null");
}

function clearUserLocal() {
  localStorage.removeItem("reputai_user");
}

/* ================= CADASTRO ================= */

async function register(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  const userData = {
    uid: cred.user.uid,
    name,
    email,
    role: "user",
    createdAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", cred.user.uid), userData);

  saveUserLocal(userData);
  currentUser = userData;

  return userData;
}

/* ================= LOGIN ================= */

async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  const snap = await getDoc(doc(db, "users", cred.user.uid));

  if (!snap.exists()) {
    throw new Error("Usuário não encontrado no banco");
  }

  const userData = { uid: cred.user.uid, ...snap.data() };

  saveUserLocal(userData);
  currentUser = userData;

  return userData;
}

/* ================= LOGOUT ================= */

async function logout() {
  await signOut(auth);
  clearUserLocal();
  currentUser = null;
}

/* ================= OBSERVADOR ================= */

function observeAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      currentUser = null;
      callback(null);
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
      currentUser = null;
      callback(null);
      return;
    }

    const userData = { uid: user.uid, ...snap.data() };

    saveUserLocal(userData);
    currentUser = userData;

    callback(userData);
  });
}

/* ================= EXPORTS ================= */

export {
  register,
  login,
  logout,
  observeAuth,
  currentUser
};
