
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
// Auth is no longer initialized or exported from here for local auth
// import { getAuth, type Auth } from 'firebase/auth'; 
// import { getFirestore, type Firestore } from 'firebase/firestore'; // Will be used later for database

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project configuration values if using other Firebase services!
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
// let auth: Auth; // Not used for local auth
// let db: Firestore; // Will be used later

if (getApps().length === 0) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) { // Only initialize if config is present
    app = initializeApp(firebaseConfig);
  } else {
    console.warn("Firebase config missing. Firebase app not initialized. This is expected if only using local auth.");
    // Create a dummy app object if needed by other parts of the code, or handle appropriately
    app = {} as FirebaseApp; 
  }
} else {
  app = getApps()[0];
}

// auth = getAuth(app); // Not used for local auth
// db = getFirestore(app); // Initialize Firestore later when needed

export { app /*, auth , db */ }; // auth is no longer exported
