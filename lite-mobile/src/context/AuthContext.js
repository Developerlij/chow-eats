import React, { createContext, useState, useEffect } from 'react';
import { auth, database, firestore, isMockFirebase } from '../services/firebase';
import { ref, set, get, child } from 'firebase/database';
import { doc, setDoc } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPhoneNumber
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

// Helper to wrap promises with a timeout
const withTimeout = (promise, timeoutMs = 3000, defaultValue = null) => {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => {
      console.warn(`Database/Firestore operation timed out after ${timeoutMs}ms. Proceeding...`);
      resolve(defaultValue);
    }, timeoutMs))
  ]);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load locally persisted user session on startup
    const loadPersistedUser = async () => {
      try {
        const savedUserStr = await AsyncStorage.getItem('@chow_user_session');
        if (savedUserStr) {
          const savedUser = JSON.parse(savedUserStr);
          setUser(savedUser);
        }
      } catch (err) {
        console.warn("Failed to load persisted user session on startup:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPersistedUser();

    // Also sync with Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userSnapshot = await withTimeout(
            get(ref(database, `users/${currentUser.uid}`)),
            3000,
            null
          );
          const profileData = (userSnapshot && typeof userSnapshot.val === 'function') ? (userSnapshot.val() || {}) : {};
          const mergedUser = {
            uid: currentUser.uid,
            email: currentUser.email || profileData.email || '',
            displayName: profileData.name || currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
            phoneNumber: profileData.phoneNumber || currentUser.phoneNumber || '',
            address: profileData.address || '',
            isAnonymous: currentUser.isAnonymous
          };
          setUser(mergedUser);
          await AsyncStorage.setItem('@chow_user_session', JSON.stringify(mergedUser));
        } catch (err) {
          console.warn("Failed to sync profile onAuthStateChanged:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    if (isMockFirebase) {
      const mockUser = {
        uid: 'mock_user_123',
        email: email,
        displayName: email.split('@')[0]
      };
      setUser(mockUser);
      await AsyncStorage.setItem('@chow_user_session', JSON.stringify(mockUser));
      setLoading(false);
      return mockUser;
    }
    try {
      try {
        const response = await signInWithEmailAndPassword(auth, email, password);
        // On successful auth sign-in, fetch their profile from RTDB to make sure we have their address, name, etc.
        const userSnapshot = await withTimeout(
          get(ref(database, `users/${response.user.uid}`)),
          3000,
          null
        );
        const profileData = (userSnapshot && typeof userSnapshot.val === 'function') ? (userSnapshot.val() || {}) : {};
        const mergedUser = {
          uid: response.user.uid,
          email: response.user.email,
          displayName: profileData.name || response.user.displayName || response.user.email.split('@')[0],
          phoneNumber: profileData.phoneNumber || '',
          address: profileData.address || ''
        };
        setUser(mergedUser);
        await AsyncStorage.setItem('@chow_user_session', JSON.stringify(mergedUser));
        return mergedUser;
      } catch (authErr) {
        // Fall back to database accounts for ALL auth errors (e.g. user-not-found, invalid-credential, wrong-password)
        const accountsSnapshot = await withTimeout(
          get(child(ref(database), 'userAccounts')),
          3000,
          null
        );
        const accounts = (accountsSnapshot && typeof accountsSnapshot.val === 'function') ? (accountsSnapshot.val() || {}) : {};
        
        const matched = Object.values(accounts).find(
          acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
        );

        if (!matched) {
          throw new Error("Invalid email or password.");
        }

        const mockUser = {
          uid: matched.id,
          email: matched.email,
          displayName: matched.name || matched.email.split('@')[0],
          phoneNumber: matched.phoneNumber || '',
          address: matched.address || ''
        };
        setUser(mockUser);
        await AsyncStorage.setItem('@chow_user_session', JSON.stringify(mockUser));
        return mockUser;
      }
    } catch (err) {
      let friendlyMessage = err.message || "Failed to sign in. Please check your credentials.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        friendlyMessage = "Invalid email or password.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/too-many-requests") {
        friendlyMessage = "Too many login attempts. Access temporarily locked.";
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName = '', phoneNumber = '', address = '') => {
    setLoading(true);
    setError(null);
    if (isMockFirebase) {
      const mockUser = {
        uid: 'mock_user_' + Math.random().toString(36).substring(2, 9),
        email: email,
        displayName: fullName || email.split('@')[0],
        address: address
      };
      setUser(mockUser);
      await AsyncStorage.setItem('@chow_user_session', JSON.stringify(mockUser));
      setLoading(false);
      return mockUser;
    }
    try {
      let mockUser;
      try {
        const response = await createUserWithEmailAndPassword(auth, email, password);
        
        // Write profile to database (Realtime Database & Cloud Firestore)
        try {
          const userData = {
            uid: response.user.uid,
            email: response.user.email || email,
            name: fullName || email.split('@')[0],
            phoneNumber: phoneNumber || '',
            address: address || '',
            joinedAt: new Date().toISOString()
          };

          const userRef = ref(database, `users/${response.user.uid}`);
          const userDoc = doc(firestore, 'users', response.user.uid);
          const accountRef = ref(database, `userAccounts/${response.user.uid}`);

          // Run writes concurrently with a timeout
          await Promise.race([
            Promise.all([
              set(userRef, userData),
              setDoc(userDoc, userData),
              set(accountRef, {
                id: response.user.uid,
                email: email.toLowerCase(),
                password: password,
                name: fullName || email.split('@')[0],
                phoneNumber: phoneNumber || '',
                address: address || ''
              })
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Database writes timed out")), 2500))
          ]);
        } catch (dbErr) {
          console.warn("Writing registered user to Firestore/DB failed or timed out:", dbErr);
        }

        mockUser = {
          uid: response.user.uid,
          email: response.user.email || email,
          displayName: fullName || response.user.displayName || email.split('@')[0],
          phoneNumber: phoneNumber || '',
          address: address || ''
        };
      } catch (authErr) {
        // Fallback to database accounts if Auth is unconfigured
        if (authErr.code === "auth/configuration-not-found" || authErr.code === "auth/operation-not-allowed") {
          const accountsSnapshot = await withTimeout(
            get(child(ref(database), 'userAccounts')),
            3000,
            null
          );
          const accounts = (accountsSnapshot && typeof accountsSnapshot.val === 'function') ? (accountsSnapshot.val() || {}) : {};
          const emailTaken = Object.values(accounts).some(
            acc => acc.email.toLowerCase() === email.toLowerCase()
          );
          if (emailTaken) {
            throw new Error("This email is already registered.");
          }

          const mockUid = 'user_' + Math.random().toString(36).substring(2, 9);
          const newAccount = {
            id: mockUid,
            email: email.toLowerCase(),
            password: password,
            name: fullName || email.split('@')[0],
            phoneNumber: phoneNumber || '',
            address: address || ''
          };

          // 1. Write accounts entry
          const userData = {
            uid: mockUid,
            email: email.toLowerCase(),
            name: fullName || email.split('@')[0],
            phoneNumber: phoneNumber || '',
            address: address || '',
            joinedAt: new Date().toISOString()
          };
          const userDoc = doc(firestore, 'users', mockUid);

          await Promise.race([
            Promise.all([
              set(ref(database, `userAccounts/${mockUid}`), newAccount),
              set(ref(database, `users/${mockUid}`), userData),
              setDoc(userDoc, userData)
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Fallback database writes timed out")), 2500))
          ]);

          mockUser = {
            uid: mockUid,
            email: email.toLowerCase(),
            displayName: fullName || email.split('@')[0],
            address: address
          };
        } else {
          throw authErr;
        }
      }

      setUser(mockUser);
      await AsyncStorage.setItem('@chow_user_session', JSON.stringify(mockUser));
      return mockUser;
    } catch (err) {
      let friendlyMessage = err.message || "Failed to create account. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already registered.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber, recaptchaVerifier) => {
    setLoading(true);
    setError(null);
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmation;
    } catch (err) {
      let friendlyMessage = "Failed to send OTP SMS.";
      if (err.code === "auth/invalid-phone-number") {
        friendlyMessage = "Please enter a valid phone number.";
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async (confirmationResult, code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await confirmationResult.confirm(code);
      
      // Write profile to database (Realtime Database & Cloud Firestore)
      try {
        const userData = {
          uid: response.user.uid,
          email: response.user.email || 'Phone User',
          phoneNumber: response.user.phoneNumber || 'None',
          joinedAt: new Date().toISOString()
        };

        // 1. Write to RTDB and Firestore concurrently with a timeout
        const userRef = ref(database, `users/${response.user.uid}`);
        const userDoc = doc(firestore, 'users', response.user.uid);
        
        await Promise.race([
          Promise.all([
            set(userRef, userData),
            setDoc(userDoc, userData)
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Phone registration writes timed out")), 2500))
        ]);
      } catch (dbErr) {
        console.warn("Writing phone user to Firestore/DB failed or timed out:", dbErr);
      }
      const userObj = {
        uid: response.user.uid,
        email: response.user.email || 'Phone User',
        displayName: 'Phone User'
      };
      setUser(userObj);
      await AsyncStorage.setItem('@chow_user_session', JSON.stringify(userObj));
      return response.user;
    } catch (err) {
      let friendlyMessage = "Incorrect verification code. Please check and try again.";
      if (err.code === "auth/invalid-verification-code") {
        friendlyMessage = "The 6-digit code you entered is invalid.";
      } else if (err.code === "auth/code-expired") {
        friendlyMessage = "The verification code has expired. Please request a new one.";
      }
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = async () => {
    setLoading(true);
    setError(null);
    const guestUid = 'guest_' + Math.random().toString(36).substring(2, 9);
    const guestUser = {
      uid: guestUid,
      email: 'guest@chow.com',
      displayName: 'Guest User',
      isAnonymous: true
    };
    
    if (!isMockFirebase) {
      // Write profile to database (Realtime Database & Cloud Firestore)
      try {
        const userData = {
          uid: guestUid,
          email: 'guest@chow.com',
          joinedAt: new Date().toISOString()
        };

        const userRef = ref(database, `users/${guestUid}`);
        const userDoc = doc(firestore, 'users', guestUid);
        
        await Promise.race([
          Promise.all([
            set(userRef, userData),
            setDoc(userDoc, userData)
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Guest database writes timed out")), 2500))
        ]);
      } catch (dbErr) {
        console.warn("Writing guest user to Firestore/DB failed or timed out:", dbErr);
      }
    }

    setUser(guestUser);
    await AsyncStorage.setItem('@chow_user_session', JSON.stringify(guestUser));
    setLoading(false);
    return guestUser;
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('@chow_user_session');
      setUser(null);
    } catch (err) {
      console.error("Error signing out from Firebase:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, signInWithPhone, verifyPhoneOtp, loginAsGuest, logout, isMock: false }}>
      {children}
    </AuthContext.Provider>
  );
};
