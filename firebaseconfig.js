console.log('🔥 [firebase-config] Inicializando Firebase...');

// Configuração do Firebase - USE ENV VARS EM PROD
const firebaseConfig = {
    apiKey: "{YOUR_API_KEY}",
    authDomain: "{YOUR_AUTH_DOMAIN}",
    projectId: "{YOUR_PROJECT_ID}",
    storageBucket: "{YOUR_STORAGE_BUCKET}",
    messagingSenderId: "{YOUR_SENDER_ID}",
    appId: "{YOUR_APP_ID}"
};

// ... resto como original, com init e fallbacks