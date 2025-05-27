
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
// import { getFirestore, type Firestore } from 'firebase/firestore'; // Will be used later for database

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project configuration values!
// You can find these in your Firebase project settings:
// Project settings > General > Your apps > Web app > Firebase SDK snippet > Config
// Store these in a .env.local file (see .env.example for structure)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
let auth: Auth;
// let db: Firestore; // Will be used later

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
// db = getFirestore(app); // Initialize Firestore later when needed

export { app, auth /*, db */ };
