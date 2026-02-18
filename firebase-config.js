// firebase-config.js
// Configuração Firebase v9 modular com Auth e Firestore

import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    onAuthStateChanged as onAuthStateChangedFirebase, 
    GoogleAuthProvider, 
    FacebookAuthProvider 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// CONFIGURAÇÕES DO SEU PROJETO FIREBASE (credenciais originais)
const firebaseConfig = {
    apiKey: "AIzaSyD-Exemplo1234567890abcdef",
    authDomain: "reputai-prod.firebaseapp.com",
    projectId: "reputai-prod",
    storageBucket: "reputai-prod.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Autenticação
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Firestore
const db = getFirestore(app);

// Função para monitorar estado do usuário
function onAuthStateChanged(callback) {
    return onAuthStateChangedFirebase(auth, callback);
}

// Exporta módulos
export { auth, db, onAuthStateChanged, googleProvider, facebookProvider };