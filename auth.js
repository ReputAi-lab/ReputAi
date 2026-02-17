/*************************************************
 * REPUTAÍ - AUTH.JS (PRODUÇÃO FINAL)
 * Autenticação integrada 100% ao Firestore
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
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= ESTADO GLOBAL ================= */

window.ReputaiState = {
  user: null,
  firestoreReady: true,
  termsAccepted: false
};

/* ================= CADASTRO ================= */

export async function registerUser(name, email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: "user",
      termsAccepted: false,
      createdAt: new Date()
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/* ================= LOGIN ================= */

export async function loginUser(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/* ================= LOGOUT ================= */

export async function logout() {
  await signOut(auth);
}

/* ================= OBSERVADOR ================= */

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();

      window.ReputaiState.user = {
        uid: user.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role
      };

      window.ReputaiState.termsAccepted = userData.termsAccepted || false;
    }

  } else {
    window.ReputaiState.user = null;
    window.ReputaiState.termsAccepted = false;
  }

  if (typeof updateUI === "function") {
    updateUI();
  }
});

/* ================= TERMOS ================= */

export async function acceptTerms() {
  if (!window.ReputaiState.user) return;

  const userRef = doc(db, "users", window.ReputaiState.user.uid);

  await updateDoc(userRef, {
    termsAccepted: true
  });

  window.ReputaiState.termsAccepted = true;
}
