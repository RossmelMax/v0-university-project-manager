// lib/firebase/client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "udabol-project-manager",
  appId: "1:40531606088:web:a9b7fb1a51b57a8093767d",
  storageBucket: "udabol-project-manager.firebasestorage.app",
  apiKey: "AIzaSyCta5_FwQhVxH3KQZ_SjhW_qLVJu-93UOM",
  authDomain: "udabol-project-manager.firebaseapp.com",
  messagingSenderId: "40531606088",
};

// Inicializamos la app asegurando que no haya instancias previas (Singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportamos los servicios ya instanciados para usarlos en cualquier componente
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
