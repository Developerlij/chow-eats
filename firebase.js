import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Make sure to replace this in Firebase Console!
  authDomain: "masi-6d02f.firebaseapp.com",
  databaseURL: "https://masi-6d02f-default-rtdb.firebaseio.com",
  projectId: "masi-6d02f",
  storageBucket: "masi-6d02f.appspot.com",
  messagingSenderId: "247441973109",
  appId: "YOUR_APP_ID" // Make sure to replace this in Firebase Console!
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const database = getDatabase(app);

// Initialize Firebase Auth with AsyncStorage persistence for caching login sessions
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const isMockFirebase = false;

export default app;
