import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
  });
}

const adminDb = getFirestore();

// En Next.js (por el HMR), este archivo se ejecuta en cada recarga.
// Firestore prohibe llamar a settings() más de una vez, así que lo "silenciamos" con un try/catch.
try {
  adminDb.settings({ preferRest: true });
} catch (error) {
  // Ya fue inicializado en un ciclo anterior de HMR, lo ignoramos.
}

const adminStorage = getStorage();
const adminAuth = getAuth();

export { adminDb, adminStorage, adminAuth };
