import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDSUS_m0LSdLMz_lF-Is7l_e6xKrBuakKA",
  authDomain: "fashion-survey-32df9.firebaseapp.com",
  projectId: "fashion-survey-32df9",
  storageBucket: "fashion-survey-32df9.firebasestorage.app",
  messagingSenderId: "983978090161",
  appId: "1:983978090161:web:b893b6743c74b4fbb60c90",
  measurementId: "G-ZZ1YNPHGG1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics (optional)
const analytics = getAnalytics(app);

// Firestore
const db = getFirestore(app);

// Export Firestore
export { db };