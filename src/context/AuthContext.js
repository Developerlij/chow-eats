import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
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
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      setUser(response.user);
      return response.user;
    } catch (err) {
      let friendlyMessage = "Failed to sign in. Please check your credentials.";
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

  const register = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      setUser(response.user);
      return response.user;
    } catch (err) {
      let friendlyMessage = "Failed to create account. Please try again.";
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
    <AuthContext.Provider value={{ user, loading, error, login, register, signInWithPhone, verifyPhoneOtp, logout, isMock: false }}>
      {children}
    </AuthContext.Provider>
  );
};
