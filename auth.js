/*************************************************
 * REPUTAÍ - AUTH.JS (PRODUÇÃO FINAL)
 * Funciona com ou sem <script type="module">
 *************************************************/

(async () => {
  console.log("🔐 [auth] Carregando interface de autenticação...");

  const { auth, db } = await import("./firebase-config.js");

  const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
  } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");

  const {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
  } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

  let currentUser = null;

  function saveUserLocal(user) {
    localStorage.setItem("reputai_user", JSON.stringify(user));
  }

  function clearUserLocal() {
    localStorage.removeItem("reputai_user");
  }

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

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));

    if (!snap.exists()) throw new Error("Usuário não encontrado");

    const userData = { uid: cred.user.uid, ...snap.data() };
    saveUserLocal(userData);
    currentUser = userData;

    return userData;
  }

  async function logout() {
    await signOut(auth);
    clearUserLocal();
    currentUser = null;
  }

  function observeAuth(callback) {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        currentUser = null;
        callback(null);
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        callback(null);
        return;
      }

      currentUser = { uid: user.uid, ...snap.data() };
      saveUserLocal(currentUser);
      callback(currentUser);
    });
  }

  // 🔥 EXPOSIÇÃO GLOBAL (CORREÇÃO CRÍTICA)
  window.authService = {
    register,
    login,
    logout,
    observeAuth,
    getCurrentUser: () => currentUser
  };

  console.log("✅ [auth] Interface de autenticação carregada");
})();
