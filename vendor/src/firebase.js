import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDA2IiOFwQEJojWqLFo9vqUAhAUQWzSFvM",
  authDomain: "masi-6d02f.firebaseapp.com",
  databaseURL: "https://masi-6d02f-default-rtdb.firebaseio.com",
  projectId: "masi-6d02f",
  storageBucket: "masi-6d02f.firebasestorage.app",
  messagingSenderId: "247441973109",
  appId: "1:247441973109:android:67700abcc1a288c69c3d3c"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const database = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
