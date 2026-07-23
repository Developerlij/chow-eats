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

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Sync React user state with Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
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
      setLoading(false);
      return mockUser;
    }
    try {
      try {
        const response = await signInWithEmailAndPassword(auth, email, password);
        // On successful auth sign-in, fetch their profile from RTDB to make sure we have their address, name, etc.
        const userSnapshot = await get(ref(database, `users/${response.user.uid}`));
        const profileData = userSnapshot.val() || {};
        const mergedUser = {
          uid: response.user.uid,
          email: response.user.email,
          displayName: profileData.name || response.user.displayName || response.user.email.split('@')[0],
          phoneNumber: profileData.phoneNumber || '',
          address: profileData.address || ''
        };
        setUser(mergedUser);
        return mergedUser;
      } catch (authErr) {
        // Fall back to database accounts for ALL auth errors (e.g. user-not-found, invalid-credential, wrong-password),
        // not just configuration-not-found. This guarantees database-created users can sign in!
        const accountsSnapshot = await get(child(ref(database), 'userAccounts'));
        const accounts = accountsSnapshot.val() || {};
        
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

          // 1. Write to RTDB for compatibility with existing dashboard panels
          const userRef = ref(database, `users/${response.user.uid}`);
          await set(userRef, userData);

          // 2. Write to Cloud Firestore
          const userDoc = doc(firestore, 'users', response.user.uid);
          await setDoc(userDoc, userData);

          // Save account credentials in DB as a backup search pool
          const accountRef = ref(database, `userAccounts/${response.user.uid}`);
          await set(accountRef, {
            id: response.user.uid,
            email: email.toLowerCase(),
            password: password,
            name: fullName || email.split('@')[0],
            phoneNumber: phoneNumber || '',
            address: address || ''
          });
        } catch (dbErr) {
          console.warn("Writing registered user to Firestore/DB failed:", dbErr);
        }

        mockUser = response.user;
      } catch (authErr) {
        // Fallback to database accounts if Auth is unconfigured
        if (authErr.code === "auth/configuration-not-found" || authErr.code === "auth/operation-not-allowed") {
          const accountsSnapshot = await get(child(ref(database), 'userAccounts'));
          const accounts = accountsSnapshot.val() || {};
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
          await set(ref(database, `userAccounts/${mockUid}`), newAccount);

          // 2. Write profiles entry in RTDB
          const userData = {
            uid: mockUid,
            email: email.toLowerCase(),
            name: fullName || email.split('@')[0],
            phoneNumber: phoneNumber || '',
            address: address || '',
            joinedAt: new Date().toISOString()
          };
          await set(ref(database, `users/${mockUid}`), userData);

          // 3. Write profiles entry in Firestore
          const userDoc = doc(firestore, 'users', mockUid);
          await setDoc(userDoc, userData);

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
      let friendlyMessage = "Failed to send OTP verification SMS.";
      if (err.code === "auth/invalid-phone-number") {
        friendlyMessage = "Please enter a valid phone number with country code (e.g. +2348011112222).";
      } else if (err.code === "auth/too-many-requests") {
        friendlyMessage = "Too many SMS requests. Please try again later.";
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

        // 1. Write to RTDB for compatibility with dashboards
        const userRef = ref(database, `users/${response.user.uid}`);
        await set(userRef, userData);

        // 2. Write to Cloud Firestore
        const userDoc = doc(firestore, 'users', response.user.uid);
        await setDoc(userDoc, userData);
      } catch (dbErr) {
        console.warn("Writing phone user to Firestore/DB failed:", dbErr);
      }
      setUser(response.user);
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

        // 1. Write to RTDB for compatibility with dashboards
        const userRef = ref(database, `users/${guestUid}`);
        await set(userRef, userData);

        // 2. Write to Cloud Firestore
        const userDoc = doc(firestore, 'users', guestUid);
        await setDoc(userDoc, userData);
      } catch (dbErr) {
        console.warn("Writing guest user to Firestore/DB failed:", dbErr);
      }
    }

    setUser(guestUser);
    setLoading(false);
    return guestUser;
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
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
