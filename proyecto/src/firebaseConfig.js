import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA1eG3D8D781FwpV7sudi8OAb94kHs9XtM",
  authDomain: "firelogic-42b00.firebaseapp.com",
  projectId: "firelogic-42b00",
  storageBucket: "firelogic-42b00.firebasestorage.app",
  messagingSenderId: "239897027605",
  appId: "1:239897027605:web:a69601b7fb2f01a29ada1c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { auth, db };