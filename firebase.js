import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAAwFo1aEusnYReB5z8LSo-njv49rTpl6U",
  authDomain: "ziniatinklio-programa.firebaseapp.com",
  projectId: "ziniatinklio-programa",
  storageBucket: "ziniatinklio-programa.firebasestorage.app",
  messagingSenderId: "372436377955",
  appId: "1:372436377955:web:26188f48f3829babd27356",
  measurementId: "G-K9Y05PNCK6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);