import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function LoginScreen() {
  const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup specific state variables
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('+234');
  const [signUpAddress, setSignUpAddress] = useState('');

  useEffect(() => {
    const autoFillAddress = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (loc && loc.coords) {
            let addressObj = null;
            if (Platform.OS === 'web') {
              try {
                // Try BigDataCloud Client API first (CORS & browser friendly)
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}&localityLanguage=en`
                );
                const data = await response.json();
                if (data) {
                  addressObj = {
                    city: data.city || data.locality || data.principalSubdivision || "",
                    street: data.localityInfo?.informative?.[0]?.name || data.locality || ""
                  };
                }
              } catch (webGeocodeErr) {
                console.warn("Web reverse geocoding via BigDataCloud failed on Signup, trying Nominatim:", webGeocodeErr);
                try {
                  // Nominatim fallback geocoding
                  const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&zoom=18&addressdetails=1`
                  );
                  const data = await response.json();
                  if (data && data.address) {
                    addressObj = {
                      city: data.address.city || data.address.town || data.address.village || data.address.suburb || "",
                      street: data.address.road || data.address.pedestrian || data.address.suburb || ""
                    };
                  }
                } catch (nominatimErr) {
                  console.warn("Web reverse geocoding via Nominatim fallback failed on Signup:", nominatimErr);
                }
              }
            }

            if (!addressObj) {
              try {
                const [geoResult] = await Location.reverseGeocodeAsync({
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude
                });
                addressObj = geoResult;
              } catch (nativeGeocodeErr) {
                console.warn("Native reverse geocoding failed on Signup:", nativeGeocodeErr);
              }
            }

            if (addressObj) {
              const city = addressObj.city || addressObj.subregion || "";
              const street = addressObj.street || addressObj.name || "";
              
              if (street && city) {
                setSignUpAddress(`${street}, ${city}`);
              } else if (city) {
                setSignUpAddress(city);
              }
            }
          }
        }
      } catch (e) {
        console.warn("Failed to autofill location on signup:", e);
      }
    };
    autoFillAddress();
  }, []);
  
  // Phone OTP specific state variables
  const [phoneNumber, setPhoneNumber] = useState('+234');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [authError, setAuthError] = useState('');
  
  const { login, register, signInWithPhone, verifyPhoneOtp, loginAsGuest, loading } = useContext(AuthContext);

  const handleSubmit = async () => {
    setAuthError('');
    
    if (isLogin) {
      if (!email || !password) {
        setAuthError("Please fill in all fields.");
        return;
      }
      try {
        await login(email, password);
      } catch (err) {
        setAuthError(err.message || "An authentication error occurred.");
      }
    } else {
      if (!fullName.trim() || !email.trim() || !signUpPhone.trim() || !signUpAddress.trim() || !password || !confirmPassword) {
        setAuthError("Please fill in all fields to create your account.");
        return;
      }
      if (password !== confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }
      try {
        await register(email, password, fullName.trim(), signUpPhone.trim(), signUpAddress.trim());
      } catch (err) {
        setAuthError(err.message || "An authentication error occurred.");
      }
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      setAuthError("Please enter your phone number with country code (e.g. +23480XXXXXXXX).");
      return;
    }
    setAuthError('');
    try {
      let appVerifier = null;
      if (Platform.OS === 'web') {
        const { RecaptchaVerifier } = require('firebase/auth');
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible'
          });
        }
        appVerifier = window.recaptchaVerifier;
      }
      
      const confirmation = await signInWithPhone(phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err) {
      // In mobile developer mode / sandbox fallback, allow simulator code input
      setAuthError("Sending SMS failed. Entering developer bypass sandbox mode...");
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setAuthError("Please enter the 6-digit verification code.");
      return;
    }
    setAuthError('');
    try {
      if (confirmationResult) {
        await verifyPhoneOtp(confirmationResult, verificationCode);
      } else {
        // Sandbox fallback for local developer checks
        if (verificationCode === '123456') {
          await login("test@chow.com", "password123");
        } else {
          setAuthError("Incorrect code. Input '123456' for sandbox verification.");
        }
      }
    } catch (err) {
      setAuthError(err.message || "Incorrect verification code.");
    }
  };

  const handleGuestLogin = () => {
    setAuthError('');
    try {
      loginAsGuest();
    } catch (err) {
      setAuthError("Guest sign-in failed.");
    }
  };

  const handleBypass = async () => {
    setAuthError('');
    try {
      await login("test@chow.com", "password123");
    } catch (err) {
      setAuthError("Bypass failed, trying automatic registration...");
      try {
        await register("test@chow.com", "password123");
      } catch (regErr) {
        setAuthError(regErr.message || "Bypass registration failed.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.innerContainer}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="fast-food" size={50} color="#06C167" />
            </View>
            <Text style={styles.title}>ChowEats</Text>
            <Text style={styles.subtitle}>Uber Food & Delivery Clone</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {authMethod === 'email' ? (isLogin ? 'Sign In' : 'Create Account') : 'Verify Phone Number'}
            </Text>

            {/* Tab Selector */}
            {!otpSent && (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, authMethod === 'email' && styles.tabButtonActive]}
                  onPress={() => {
                    setAuthMethod('email');
                    setAuthError('');
                  }}
                >
                  <Text style={[styles.tabButtonText, authMethod === 'email' && styles.tabButtonTextActive]}>
                    Email & Pass
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.tabButton, authMethod === 'phone' && styles.tabButtonActive]}
                  onPress={() => {
                    setAuthMethod('phone');
                    setAuthError('');
                  }}
                >
                  <Text style={[styles.tabButtonText, authMethod === 'phone' && styles.tabButtonTextActive]}>
                    Phone SMS OTP
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            {authError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color="#D32F2F" />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            {authMethod === 'email' ? (
              /* EMAIL & PASSWORD LOGIN/SIGNUP INPUTS */
              <>
                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#999"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {!isLogin && (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number (e.g. +234...)"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        value={signUpPhone}
                        onChangeText={setSignUpPhone}
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Ionicons name="pin-outline" size={20} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Delivery Address"
                        placeholderTextColor="#999"
                        value={signUpAddress}
                        onChangeText={setSignUpAddress}
                      />
                    </View>
                  </>
                )}

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#999"
                      secureTextEntry
                      autoCapitalize="none"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.submitBtn} 
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
                  )}
                </TouchableOpacity>

                {/* Email Toggle Switch */}
                <TouchableOpacity 
                  style={styles.toggleBtn}
                  onPress={() => {
                    setIsLogin(!isLogin);
                    setAuthError('');
                  }}
                >
                  <Text style={styles.toggleBtnText}>
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* PHONE SMS OTP INPUTS */
              <>
                {!otpSent ? (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number (e.g. +23480...)"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                      />
                    </View>

                    <TouchableOpacity 
                      style={styles.submitBtn} 
                      onPress={handleSendOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.submitBtnText}>Send OTP SMS</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.otpHeaderBox}>
                      <Text style={styles.otpHeaderTitle}>Verification Code Sent</Text>
                      <Text style={styles.otpHeaderSub}>Enter the 6-digit code sent to {phoneNumber}</Text>
                    </View>

                    <View style={styles.inputContainer}>
                      <Ionicons name="keypad-outline" size={20} color="#888" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="6-Digit OTP Code"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                      />
                    </View>

                    <TouchableOpacity 
                      style={styles.submitBtn} 
                      onPress={handleVerifyOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.submitBtnText}>Verify & Sign In</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.toggleBtn}
                      onPress={() => {
                        setOtpSent(false);
                        setVerificationCode('');
                        setAuthError('');
                      }}
                    >
                      <Text style={styles.toggleBtnText}>Change Phone Number</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* Hidden DOM element for Web reCAPTCHA verifiers */}
            {Platform.OS === 'web' && (
              <View id="recaptcha-container" style={{ display: 'none' }} />
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Bypass/Demo Button */}
            <TouchableOpacity 
              style={styles.bypassBtn} 
              onPress={handleBypass}
              disabled={loading}
            >
              <Ionicons name="flash" size={18} color="#06C167" style={{ marginRight: 6 }} />
              <Text style={styles.bypassBtnText}>Quick Sandbox Sign-In</Text>
            </TouchableOpacity>

            {/* Guest Login Button */}
            <TouchableOpacity 
              style={[styles.bypassBtn, { marginTop: 12, borderColor: '#666' }]} 
              onPress={handleGuestLogin}
              disabled={loading}
            >
              <Ionicons name="person-outline" size={18} color="#666" style={{ marginRight: 6 }} />
              <Text style={[styles.bypassBtnText, { color: '#666' }]}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0FAF4',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
      }
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  tabButtonTextActive: {
    color: '#06C167',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 52,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#1A1A1A',
    fontSize: 16,
  },
  otpHeaderBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  otpHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  otpHeaderSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#06C167',
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#06C167',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  toggleBtnText: {
    color: '#666',
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  dividerText: {
    color: '#999',
    fontSize: 12,
    marginHorizontal: 12,
  },
  bypassBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#06C167',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  bypassBtnText: {
    color: '#06C167',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
