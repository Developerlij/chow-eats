import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { Platform } from "react-native";
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

// Conditionally initialize Auth to prevent "getReactNativePersistence is not a function" errors on Web target
let firebaseAuth;
if (Platform.OS === 'web') {
  firebaseAuth = getAuth(app); // Web browsers handle localstorage persistence automatically
} else {
  firebaseAuth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage) // Mobile native devices cache credentials via AsyncStorage
  });
}

export const auth = firebaseAuth;
export const isMockFirebase = false;

export default app;
