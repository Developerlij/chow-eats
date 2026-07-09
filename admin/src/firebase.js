import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

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
export const auth = getAuth(app);
export default app;
