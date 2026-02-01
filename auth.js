import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export function observeAuth(callback) {
  onAuthStateChanged(auth, async firebaseUser => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    let role = "user";

    if (!snap.exists()) {
      await setDoc(userRef, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || "",
        role: "user",
        createdAt: serverTimestamp()
      });
    } else {
      role = snap.data().role || "user";
    }

    callback({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      role
    });
  });
}

export async function login() {
  await signInWithPopup(auth, provider);
}

export async function logout() {
  await signOut(auth);
  location.href = "index.html";
}
