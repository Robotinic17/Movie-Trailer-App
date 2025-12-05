import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // ADD THIS IMPORT

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCk2lKUEF52ejqgJaiJ26_XXRf9291N3m4",
  authDomain: "movieverse-26dc4.firebaseapp.com",
  projectId: "movieverse-26dc4",
  storageBucket: "movieverse-26dc4.firebasestorage.app",
  messagingSenderId: "353761777045",
  appId: "1:353761777045:web:8c745f416210237154929c",
  measurementId: "G-XCZ9X0YMMJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app); // For database
export const auth = getAuth(app); // For authentication
export const storage = getStorage(app); // ADD THIS EXPORT

export default app;
