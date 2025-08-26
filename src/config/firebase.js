// src/config/firebase.js - Updated with better error handling
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Debug: Log environment variables (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Firebase Environment Check:', {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '❌ Missing',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '❌ Missing',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '❌ Missing',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '❌ Missing',
    appId: process.env.REACT_APP_FIREBASE_APP_ID || '❌ Missing',
  });
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error('❌ Missing Firebase configuration keys:', missingKeys);
  console.error('💡 Please check your .env.local file and ensure all REACT_APP_FIREBASE_* variables are set');
  console.error('📝 Your .env.local file should be in the root directory (same level as package.json)');
  throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
}

// Validate API key format
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIza')) {
  console.error('❌ Invalid Firebase API key format');
  console.error('💡 Firebase API keys should start with "AIza"');
  throw new Error('Invalid Firebase API key format');
}

let app;
try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

// Initialize services with error handling
let db, auth, storage, analytics;

try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized');
} catch (error) {
  console.error('❌ Firestore initialization failed:', error);
  throw error;
}

try {
  auth = getAuth(app);
  console.log('✅ Auth initialized');
} catch (error) {
  console.error('❌ Auth initialization failed:', error);
  throw error;
}

try {
  storage = getStorage(app);
  console.log('✅ Storage initialized');
} catch (error) {
  console.error('❌ Storage initialization failed:', error);
  throw error;
}

// Initialize Analytics only in production and if measurement ID is available
if (process.env.REACT_APP_FIREBASE_MEASUREMENT_ID && 
    process.env.NODE_ENV === 'production' && 
    typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
    console.log('📊 Analytics enabled');
  } catch (error) {
    console.warn('⚠️ Analytics initialization failed:', error);
    analytics = null;
  }
} else {
  analytics = null;
  console.log('📊 Analytics disabled (development mode)');
}

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Test Firebase connection in development
if (process.env.NODE_ENV === 'development') {
  // Simple connectivity test
  setTimeout(async () => {
    try {
      // Test auth connection
      await auth.authStateReady;
      console.log('🔐 Auth connection test: ✅ Success');
    } catch (error) {
      console.error('🔐 Auth connection test: ❌ Failed', error);
    }
  }, 1000);
}

export { db, auth, storage, analytics };
export default app;