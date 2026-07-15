import React, { useState, useEffect } from 'react';
import { database, storage } from './firebase';
import { ref, onValue, update, set, get, child } from 'firebase/database';
import { 
  MapPin, 
  Navigation, 
  ShoppingBag, 
  Bike, 
  CheckCircle2, 
  Play, 
  History, 
  Coins, 
  User, 
  Phone, 
  Info, 
  Upload, 
  LogOut,
  Lock,
  Mail,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  // Realtime orders & simulation state
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [customerCoords, setCustomerCoords] = useState(null);
  
  // Tab/Navigation view state: 'deliveries', 'earnings', or 'profile'
  const [viewMode, setViewMode] = useState('deliveries');

  // Database-Driven Auth Session State
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Auth Forms State
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Driver Profile State
  const [driverProfile, setDriverProfile] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Profile Onboarding Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formVehicle, setFormVehicle] = useState('Motorcycle');
  const [formPlate, setFormPlate] = useState('');
  const [formEngine, setFormEngine] = useState('');
  const [formGuarantorName, setFormGuarantorName] = useState('');
  const [formGuarantorPhone, setFormGuarantorPhone] = useState('');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  const [uploadProgress, setUploadProgress] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Load active account session from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem('chow_rider_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved session:", e);
      }
    }
    setSessionLoading(false);
  }, []);

  // 2. Load rider profile bio-data once session is active
  useEffect(() => {
    if (!session?.id) {
      setDriverProfile(null);
      return;
    }

    const profileRef = ref(database, `drivers/${session.id}`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDriverProfile(data);
      } else {
        setDriverProfile(null);
      }
    });

    return () => unsubscribe();
  }, [session]);

  // 3. Listen to all database orders
  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(list);

        // Keep active order reference synced
        if (activeOrder) {
          const updated = list.find(o => o.id === activeOrder.id);
          if (updated) setActiveOrder(updated);
        }
      }
    });

    return () => unsubscribe();
  }, [activeOrder]);

  // Listen to customer live coordinates from Firebase RTDB
  useEffect(() => {
    if (!activeOrder?.userId) {
      setCustomerCoords(null);
      return;
    }
    const customerLocRef = ref(database, `userLocations/${activeOrder.userId}`);
    const unsubscribe = onValue(customerLocRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.lat && data.lng) {
        setCustomerCoords({
          latitude: data.lat,
          longitude: data.lng,
          updatedAt: data.updatedAt
        });
      } else {
        setCustomerCoords(null);
      }
    });
    return () => unsubscribe();
  }, [activeOrder]);

  // Handle GPS location streaming
  useEffect(() => {
    if (!driverProfile || driverProfile.status !== 'Approved' || !activeOrder || activeOrder.status === 'Order Delivered' || isSimulating) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setGpsCoords({ latitude, longitude });

          try {
            const riderRef = ref(database, `orders/${activeOrder.id}/rider`);
            await update(riderRef, {
              lat: latitude,
              lng: longitude,
              name: driverProfile.name
            });
          } catch (err) {
            console.error("GPS stream DB update failed:", err);
          }
        },
        (error) => {
          console.warn("GPS tracking failed/denied, fallback to manual or simulation:", error);
        },
        { enableHighAccuracy: true, distanceFilter: 10 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [activeOrder, isSimulating, driverProfile]);

  // Database-Driven Auth Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError("Please fill in email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const dbRef = ref(database);
      const accountsSnapshot = await get(child(dbRef, 'driverAccounts'));
      const accounts = accountsSnapshot.val() || {};

      if (authMode === 'signup') {
        // Sign Up Flow
        const emailTaken = Object.values(accounts).some(acc => acc.email.toLowerCase() === authEmail.toLowerCase());
        if (emailTaken) {
          setAuthError("This email address is already registered.");
          setAuthLoading(false);
          return;
        }

        const newId = 'rider_' + Math.random().toString(36).substring(2, 9);
        const newAccount = {
          id: newId,
          email: authEmail.toLowerCase(),
          password: authPassword // Plain text for local database-driven compatibility
        };

        await set(ref(database, `driverAccounts/${newId}`), newAccount);
        
        // Log them into active session
        localStorage.setItem('chow_rider_session', JSON.stringify(newAccount));
        setSession(newAccount);
      } else {
        // Sign In Flow
        const matchedAccount = Object.values(accounts).find(
          acc => acc.email.toLowerCase() === authEmail.toLowerCase() && acc.password === authPassword
        );

        if (!matchedAccount) {
          setAuthError("Invalid email or password.");
          setAuthLoading(false);
          return;
        }

        // Log them into active session
        localStorage.setItem('chow_rider_session', JSON.stringify(matchedAccount));
        setSession(matchedAccount);
      }
    } catch (err) {
      setAuthError("Authentication failed: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSandboxBypass = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const testId = 'rider_sandbox';
      const testAccount = {
        id: testId,
        email: 'rider@chow.com',
        password: 'password123'
      };

      // 1. Write the test driver account to RTDB
      await set(ref(database, `driverAccounts/${testId}`), testAccount);

      // 2. Write pre-approved driver profile to skip verification pending screen
      const approvedProfile = {
        id: testId,
        email: 'rider@chow.com',
        name: 'Sarah Jenkins (Sandbox)',
        phone: '+2348011112222',
        vehicle: 'Motorcycle',
        plate: 'LAG-7829B',
        engine: 'ENG-4729103B',
        guarantorName: 'Chief Oba',
        guarantorPhone: '+2348033334444',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'Approved',
        joinedAt: new Date().toISOString()
      };
      await set(ref(database, `drivers/${testId}`), approvedProfile);

      // 3. Set local storage and React state session
      localStorage.setItem('chow_rider_session', JSON.stringify(testAccount));
      setSession(testAccount);
      setDriverProfile(approvedProfile);
    } catch (err) {
      setAuthError("Sandbox bypass failed: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress('Processing...');
    setFormError('');
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      setFormImage(reader.result);
      setUploadProgress('Ready (local)!');

      try {
        const { ref: sRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const fileRef = sRef(storage, `riders/${Date.now()}_${file.name}`);
        
        setUploadProgress('Uploading...');
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        setFormImage(downloadUrl);
        setUploadProgress('Cloud success!');
      } catch (err) {
        console.warn("Storage upload failed, keeping base64 fallback:", err);
        setUploadProgress('Ready (local)!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Profile Onboarding Form Submit
  const handleSignUpProfile = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone || !formPlate || !formEngine || !formGuarantorName || !formGuarantorPhone) {
      setFormError("Please fill in all details including Engine Number and Guarantor info.");
      return;
    }

    setIsRegistering(true);
    setFormError('');

    const profile = {
      id: session.id,
      email: session.email,
      name: formName,
      phone: formPhone,
      vehicle: formVehicle,
      plate: formPlate,
      engine: formEngine,
      guarantorName: formGuarantorName,
      guarantorPhone: formGuarantorPhone,
      image: formImage,
      status: 'Pending Approval',
      joinedAt: new Date().toISOString()
    };

    try {
      const riderRef = ref(database, `drivers/${session.id}`);
      await set(riderRef, profile);
      setDriverProfile(profile);
    } catch (err) {
      setFormError("Failed to register profile: " + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogOut = () => {
    if (window.confirm("Are you sure you want to go offline and log out?")) {
      localStorage.removeItem('chow_rider_session');
      setSession(null);
      setDriverProfile(null);
      setActiveOrder(null);
      setGpsCoords(null);
      setIsSimulating(false);
      setSimProgress(0);
      setViewMode('deliveries');
      // Reset input fields
      setFormName('');
      setFormPhone('');
      setFormPlate('');
      setFormEngine('');
      setFormGuarantorName('');
      setFormGuarantorPhone('');
      setFormImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
      setUploadProgress('');
      setAuthEmail('');
      setAuthPassword('');
    }
  };

  const handleClaimOrder = async (orderId) => {
    if (!driverProfile) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      const orderRef = ref(database, `orders/${orderId}`);
      await update(orderRef, {
        status: 'Preparing Order',
        rider: {
          name: driverProfile.name,
          lat: order.restaurant?.lat || 37.7882,
          lng: order.restaurant?.lng || -122.4324
        }
      });
      setActiveOrder(order);
    } catch (err) {
      console.error("Claiming order failed:", err);
    }
  };

  const handlePickup = async () => {
    if (!activeOrder) return;
    try {
      const orderRef = ref(database, `orders/${activeOrder.id}`);
      await update(orderRef, { status: 'Rider Picked Up Order' });
    } catch (err) {
      console.error("Pickup state update failed:", err);
    }
  };

  const handleComplete = async () => {
    if (!activeOrder) return;
    try {
      const orderRef = ref(database, `orders/${activeOrder.id}`);
      await update(orderRef, { status: 'Order Delivered' });
      setActiveOrder(null);
      setGpsCoords(null);
      setIsSimulating(false);
      setSimProgress(0);
    } catch (err) {
      console.error("Deliver state update failed:", err);
    }
  };

  const handleSimulateRoute = () => {
    if (!driverProfile || !activeOrder || isSimulating) return;

    setIsSimulating(true);
    const storeLat = activeOrder.restaurant?.lat || 37.7882;
    const storeLng = activeOrder.restaurant?.lng || -122.4324;
    
    // Spawn driver 1.2km away from the store initially
    const initialRiderLat = storeLat + 0.008;
    const initialRiderLng = storeLng - 0.008;

    const userLat = 37.7749;
    const userLng = -122.4194;

    let step = 0;
    const totalSteps = 25; // 10 steps to store, 12 steps to user, 3 steps nearby buffer

    const interval = setInterval(async () => {
      step += 1;
      setSimProgress(step);

      let currentLat, currentLng;
      
      if (step <= 10) {
        // Phase 1: Driver heading to store
        const fraction = step / 10;
        currentLat = initialRiderLat + (storeLat - initialRiderLat) * fraction;
        currentLng = initialRiderLng + (storeLng - initialRiderLng) * fraction;
        
        await update(ref(database, `orders/${activeOrder.id}`), { status: 'Preparing Order' });
      } else if (step <= 22) {
        // Phase 2: Driver heading to customer
        const fraction = (step - 10) / 12;
        currentLat = storeLat + (userLat - storeLat) * fraction;
        currentLng = storeLng + (userLng - storeLng) * fraction;
        
        await update(ref(database, `orders/${activeOrder.id}`), { status: 'Rider Picked Up Order' });
      } else {
        // Phase 3: Rider is nearby
        currentLat = userLat;
        currentLng = userLng;
        await update(ref(database, `orders/${activeOrder.id}`), { status: 'Rider is Nearby' });
      }

      setGpsCoords({ latitude: currentLat, longitude: currentLng });

      try {
        const riderRef = ref(database, `orders/${activeOrder.id}/rider`);
        await update(riderRef, {
          lat: currentLat,
          lng: currentLng,
          name: driverProfile.name
        });

        if (step === totalSteps) {
          await update(ref(database, `orders/${activeOrder.id}`), { status: 'Order Delivered' });
          clearInterval(interval);
          setIsSimulating(false);
          setActiveOrder(null);
          setGpsCoords(null);
        }
      } catch (err) {
        console.error("Simulation database update failed:", err);
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1500); // 1.5s intervals for smoother pacing
  };

  const getUnassignedOrders = () => {
    return orders.filter(o => o.status === 'Preparing' || o.status === 'Preparing Order');
  };

  const getCompletedDeliveries = () => {
    if (!driverProfile) return [];
    return orders.filter(o => o.rider?.name === driverProfile.name && o.status === 'Order Delivered');
  };

  const getTotalEarnings = () => {
    const completed = getCompletedDeliveries();
    return completed.reduce((sum, o) => sum + (o.total || 0), 0);
  };

  return (
    <div className="driver-app">
      {/* Header navbar */}
      <header className="navbar">
        <div className="nav-logo">
          <Bike size={24} />
          <span>Chow Rider</span>
        </div>
        <div className="driver-badge">{driverProfile && driverProfile.status === 'Approved' ? 'ONLINE' : 'OFFLINE'}</div>
      </header>

      {/* Main content viewport */}
      <div className="content">
        {sessionLoading ? (
          /* LOADING SESSION */
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
            <div className="geo-pulse" style={{ margin: '0 auto 16px auto' }} />
            <p>Verifying session...</p>
          </div>
        ) : !session ? (
          /* REGISTRATION / LOGIN AUTH VIEW (DATABASE-DRIVEN TO AVOID CONFIG ERROR BLOCKS) */
          <div className="card" style={{ borderColor: 'var(--primary)' }}>
            <div className="card-title" style={{ justifyContent: 'center', fontSize: '18px', color: 'var(--primary)' }}>
              <Mail size={20} />
              <span>{authMode === 'login' ? 'Rider Sign In Portal' : 'Rider Sign Up Portal'}</span>
            </div>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#AAA', marginBottom: '20px' }}>
              Create an account or login to access your Rider profile. Immediate access is granted upon sign up!
            </p>

            {authError && (
              <div style={{ padding: '12px', backgroundColor: '#FFEBEE', color: '#D32F2F', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <label>Email Address</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-light)' }}>
                  <Mail size={16} color="#666" />
                  <input 
                    type="email" 
                    className="form-control" 
                    value={authEmail} 
                    onChange={e => setAuthEmail(e.target.value)} 
                    placeholder="e.g. rider@gmail.com" 
                    style={{ border: 'none', paddingLeft: 0 }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Password</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-light)' }}>
                  <Lock size={16} color="#666" />
                  <input 
                    type="password" 
                    className="form-control" 
                    value={authPassword} 
                    onChange={e => setAuthPassword(e.target.value)} 
                    placeholder="••••••••" 
                    style={{ border: 'none', paddingLeft: 0 }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn" 
                style={{ width: '100%' }} 
                disabled={authLoading}
              >
                {authMode === 'login' ? 'Sign In as Rider' : 'Sign Up Rider Account'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                >
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>

              <div style={{ margin: '20px 0', borderTop: '1px solid #333' }}></div>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 'bold' }}
                onClick={handleSandboxBypass}
                disabled={authLoading}
              >
                ⚡ Quick Sandbox Sign-In
              </button>
            </form>
          </div>
        ) : !driverProfile ? (
          /* ONBOARDING REGISTRATION VIEW (COLLECT BIO DATA) */
          <div className="card" style={{ borderColor: 'var(--primary)' }}>
            <div className="card-title" style={{ justifyContent: 'center', fontSize: '18px', color: 'var(--primary)' }}>
              <User size={20} />
              <span>Complete Profile Bio-Data</span>
            </div>
            
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#AAA', marginBottom: '20px' }}>
              Your details will sync to the admin dashboard and you get immediate access.
            </p>

            {formError && (
              <div style={{ padding: '12px', backgroundColor: '#FFEBEE', color: '#D32F2F', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSignUpProfile}>
              {/* Profile Image File Input */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div className="profile-avatar-circle" style={{ width: '80px', height: '80px' }}>
                  <img src={formImage} alt="Preview" className="profile-avatar-img" />
                </div>
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Profile Photo</span>
                    {uploadProgress && <span style={{ fontSize: '11px', color: '#06C167' }}>{uploadProgress}</span>}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed #444', padding: '8px', borderRadius: '6px', backgroundColor: '#1E1E1E' }}>
                    <Upload size={14} color="#666" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ fontSize: '12px', cursor: 'pointer', color: '#AAA' }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  placeholder="e.g. Sarah Jenkins" 
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  value={formPhone} 
                  onChange={e => setFormPhone(e.target.value)} 
                  placeholder="e.g. +2348031234567" 
                />
              </div>

              <div className="form-group">
                <label>Vehicle Type</label>
                <select 
                  className="form-control" 
                  value={formVehicle} 
                  onChange={e => setFormVehicle(e.target.value)}
                >
                  <option value="Motorcycle">Motorcycle / Okada</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Car">Car</option>
                </select>
              </div>

              <div className="form-group">
                <label>License Plate Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formPlate} 
                  onChange={e => setFormPlate(e.target.value)} 
                  placeholder="e.g. LAG-5847B" 
                />
              </div>

              {/* Engine Number Input */}
              <div className="form-group">
                <label>Engine Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formEngine} 
                  onChange={e => setFormEngine(e.target.value)} 
                  placeholder="e.g. ENG-4859302A" 
                />
              </div>

              {/* Guarantor Name Input */}
              <div className="form-group">
                <label>Guarantor Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formGuarantorName} 
                  onChange={e => setFormGuarantorName(e.target.value)} 
                  placeholder="e.g. Chief John Okafor" 
                />
              </div>

              {/* Guarantor Phone Input */}
              <div className="form-group">
                <label>Guarantor Phone Number</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  value={formGuarantorPhone} 
                  onChange={e => setFormGuarantorPhone(e.target.value)} 
                  placeholder="e.g. +2347038884444" 
                />
              </div>

              <button 
                type="submit" 
                className="btn" 
                style={{ width: '100%', marginTop: '16px' }} 
                disabled={isRegistering}
              >
                <Bike size={18} style={{ marginRight: '6px' }} />
                {isRegistering ? 'Submitting...' : 'Submit Profile & Go Online'}
              </button>
            </form>
          </div>
        ) : driverProfile.status === 'Pending Approval' ? (
          /* AWAITING ADMIN APPROVAL SCREEN */
          <div className="card" style={{ borderColor: '#F57C00', textAlign: 'center', padding: '32px 20px' }}>
            <div className="profile-header" style={{ padding: '10px 0' }}>
              <div className="profile-avatar-circle" style={{ width: '90px', height: '90px', borderColor: '#F57C00' }}>
                <img src={driverProfile.image} alt={driverProfile.name} className="profile-avatar-img" />
              </div>
              <h2 className="profile-name" style={{ margin: '8px 0 2px 0' }}>{driverProfile.name}</h2>
              <span className="profile-status" style={{ backgroundColor: 'rgba(245, 124, 0, 0.15)', color: '#F57C00', borderColor: 'rgba(245, 124, 0, 0.3)' }}>
                Awaiting Approval
              </span>
            </div>
            
            <div className="card-divider" />

            <h3 style={{ color: '#FFF', fontSize: '16px', fontWeight: 'bold', margin: '16px 0 8px 0' }}>
              Verification Pending
            </h3>
            <p style={{ fontSize: '13px', color: '#AAA', lineHeight: '20px', marginBottom: '24px' }}>
              Thank you for signing up! Your rider registration details have been submitted to the Admin team for review. 
              Once your account is approved, this screen will automatically refresh to grant you access to deliveries.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#888', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid #333', textAlign: 'left', marginBottom: '24px' }}>
              <div><strong>Registered Phone:</strong> {driverProfile.phone}</div>
              <div><strong>Vehicle Type:</strong> {driverProfile.vehicle}</div>
              <div><strong>License Plate:</strong> {driverProfile.plate.toUpperCase()}</div>
              <div><strong>Engine Number:</strong> {driverProfile.engine ? driverProfile.engine.toUpperCase() : '—'}</div>
              <div><strong>Guarantor:</strong> {driverProfile.guarantorName} ({driverProfile.guarantorPhone})</div>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', borderColor: '#D32F2F', color: '#D32F2F', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={handleLogOut}
            >
              <LogOut size={16} />
              Cancel Application & Log Out
            </button>
          </div>
        ) : (
          /* AUTHENTICATED TABS SYSTEM */
          <>
            {viewMode === 'deliveries' && (
              /* DELIVERIES TABS VIEW */
              activeOrder ? (
                /* ACTIVE TRIP DETAILS PANEL */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="card" style={{ borderColor: 'var(--primary)' }}>
                    <div className="card-title" style={{ color: 'var(--primary)' }}>
                      <Navigation size={18} />
                      <span>Active Delivery Route</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="address-row">
                        <MapPin size={16} color="#06C167" />
                        <div>
                          <strong style={{ display: 'block', color: '#FFF' }}>Pickup From: {activeOrder.restaurant?.name}</strong>
                          <span style={{ fontSize: '13px' }}>{activeOrder.restaurant?.address}</span>
                        </div>
                      </div>

                      <div style={{ width: '2px', height: '12px', backgroundColor: '#444', marginLeft: '7px' }} />

                      <div className="address-row">
                        <MapPin size={16} color="#E53935" />
                        <div>
                          <strong style={{ display: 'block', color: '#FFF' }}>Dropoff Destination:</strong>
                          <span style={{ fontSize: '13px' }}>{activeOrder.deliveryAddress || 'No Dropoff Address Specified'}</span>
                        </div>
                      </div>

                      <div style={{ width: '2px', height: '12px', backgroundColor: '#444', marginLeft: '7px' }} />

                      <div className="address-row">
                        <MapPin size={16} color="#0288D1" />
                        <div>
                          <strong style={{ display: 'block', color: '#FFF' }}>Customer Live GPS Feed:</strong>
                          {customerCoords ? (
                            <span style={{ fontSize: '13px', color: '#0288D1', fontFamily: 'monospace' }}>
                              📍 {customerCoords.latitude.toFixed(5)}, {customerCoords.longitude.toFixed(5)} (Streaming live)
                            </span>
                          ) : (
                            <span style={{ fontSize: '13px', color: '#777' }}>
                              Awaiting customer GPS coordinates ping...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Food Items list available for pickup */}
                    <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid #333' }}>
                      <strong style={{ fontSize: '13px', color: '#06C167', display: 'block', marginBottom: '8px' }}>
                        📋 ITEMS TO PICK UP ({activeOrder.items ? activeOrder.items.reduce((sum, i) => sum + i.quantity, 0) : 0}):
                      </strong>
                      {activeOrder.items && activeOrder.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '13px', color: '#DDD', display: 'flex', justifyContent: 'space-between', marginVertical: '4px' }}>
                          <span>• {item.name}</span>
                          <strong style={{ color: '#06C167' }}>x{item.quantity}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="card-divider" />

                    {/* Payment Instruction Alert */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#AAA' }}>Payment Instruction:</span>
                      {activeOrder.paymentMethod === 'Transfer' ? (
                        <span className="badge badge-transfer">🏦 Bank Transfer Paid</span>
                      ) : (
                        <span className="badge badge-cash">💵 Collect Cash: ${(activeOrder.total || 0).toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* GPS streaming status */}
                  <div className="geo-box">
                    <div className="geo-pulse" />
                    <div>
                      {gpsCoords ? (
                        <span style={{ fontFamily: 'monospace' }}>
                          Streaming Coords: {gpsCoords.latitude.toFixed(5)}, {gpsCoords.longitude.toFixed(5)}
                        </span>
                      ) : (
                        <span>Waiting for GPS lock or Simulation...</span>
                      )}
                    </div>
                  </div>

                  {/* Driving controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeOrder.status === 'Preparing Order' || activeOrder.status === 'Preparing' ? (
                      <button className="btn" onClick={handlePickup}>
                        <ShoppingBag size={18} />
                        Confirm Picked Up
                      </button>
                    ) : null}

                    {activeOrder.status === 'Rider Picked Up Order' || activeOrder.status === 'Rider is Nearby' ? (
                      <button className="btn btn-success" onClick={handleComplete}>
                        <CheckCircle2 size={18} />
                        Mark as Delivered
                      </button>
                    ) : null}

                    {!isSimulating && (activeOrder.status === 'Rider Picked Up Order' || activeOrder.status === 'Preparing Order') ? (
                      <button className="btn btn-secondary" onClick={handleSimulateRoute}>
                        <Play size={18} />
                        Simulate Driving (20s)
                      </button>
                    ) : null}

                    {isSimulating && (
                      <div style={{ backgroundColor: '#222', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid #333' }}>
                        <p style={{ color: '#06C167', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Drive Simulation in Progress...</p>
                        <div style={{ height: '6px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${(simProgress / 20) * 100}%`, height: '100%', backgroundColor: '#06C167' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* AVAILABLE JOBS LIST */
                <div>
                  <div className="card-title" style={{ paddingLeft: '4px', marginBottom: '16px' }}>
                    <ShoppingBag size={18} color="#06C167" />
                    <span>Available Jobs List ({getUnassignedOrders().length})</span>
                  </div>

                  {getUnassignedOrders().length > 0 ? (
                    getUnassignedOrders().map((order) => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <span className="order-id">ID: {order.id.slice(0, 10)}...</span>
                          {order.paymentMethod === 'Transfer' ? (
                            <span className="badge badge-transfer">Transfer</span>
                          ) : (
                            <span className="badge badge-cash">Cash</span>
                          )}
                        </div>

                        <div>
                          <h3 className="restaurant-name">{order.restaurant?.name || 'Groceries Order'}</h3>
                          <p style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{order.items ? order.items.reduce((sum, i) => sum + i.quantity, 0) : 0} items</p>
                          
                          {/* List of food items available for pickup */}
                          <div style={{ margin: '8px 0', padding: '8px 10px', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid #333' }}>
                            <span style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Items for pickup:</span>
                            {order.items && order.items.map((item, idx) => (
                              <div key={idx} style={{ fontSize: '12px', color: '#CCC', display: 'flex', justifyContent: 'space-between' }}>
                                <span>• {item.name}</span>
                                <strong style={{ color: '#06C167' }}>x{item.quantity}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="address-row">
                          <MapPin size={14} color="#888" />
                          <span>Pickup: {order.restaurant?.name || 'Chow Groceries'}</span>
                        </div>

                        <div className="address-row">
                          <MapPin size={14} color="#888" />
                          <span>Dropoff: {order.deliveryAddress || 'No Address Specified'}</span>
                        </div>

                        <div className="card-divider" />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '11px', color: '#888' }}>Payout</span>
                            <span className="order-amount">${(order.total || 0).toFixed(2)}</span>
                          </div>
                          <button className="btn" style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }} onClick={() => handleClaimOrder(order.id)}>
                            Accept Job
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                      <Bike size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                      <h3>No available delivery jobs</h3>
                      <p style={{ fontSize: '13px', color: '#555', marginTop: '6px' }}>Incoming client order placements will appear here in real-time!</p>
                    </div>
                  )}
                </div>
              )
            )}

            {viewMode === 'earnings' && (
              /* EARNINGS & CUSTOMER HISTORY TAB VIEW */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Total Earnings Card Summary */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#1C2E24', borderColor: 'rgba(6, 193, 103, 0.3)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'rgba(6, 193, 103, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coins size={30} color="#06C167" />
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#AAA', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>My Total Earnings</span>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: '#FFF' }}>${getTotalEarnings().toFixed(2)}</span>
                    <span style={{ fontSize: '12px', color: '#06C167', display: 'block', marginTop: '2px', fontWeight: '500' }}>
                      Total Deliveries Completed: {getCompletedDeliveries().length}
                    </span>
                  </div>
                </div>

                {/* Past Customer History List */}
                <div className="card">
                  <div className="card-title">
                    <History size={16} color="#06C167" />
                    <span>Customer Delivery History</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {getCompletedDeliveries().length > 0 ? (
                      getCompletedDeliveries().map((order) => (
                        <div 
                          key={order.id} 
                          style={{ 
                            padding: '14px', 
                            borderRadius: '8px', 
                            backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                            border: '1px solid #333', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px' 
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#666' }}>ID: {order.id.slice(0, 10)}...</span>
                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#06C167' }}>+${(order.total || 0).toFixed(2)}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#DDD' }}>
                            <div>
                              <span style={{ color: '#888', marginRight: '4px' }}>Customer:</span>
                              <strong style={{ color: '#FFF' }}>{order.userEmail || 'Guest User'}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#888', marginRight: '4px' }}>Pickup From:</span>
                              <strong>{order.restaurant?.name || 'Chow Groceries'}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#888', marginRight: '4px' }}>Delivered To:</span>
                              <strong style={{ color: '#FFF' }}>{order.deliveryAddress || '123 Roman Way, Food Town'}</strong>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: '#555' }}>
                            <span>
                              Delivered: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <span style={{ padding: '2px 6px', backgroundColor: '#222', borderRadius: '4px', color: order.paymentMethod === 'Transfer' ? '#0288D1' : '#F57C00' }}>
                              {order.paymentMethod === 'Transfer' ? '🏦 Bank Transfer' : '💵 Collected Cash'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px 10px', color: '#666' }}>
                        <History size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <p style={{ fontSize: '13px' }}>No completed orders recorded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'profile' && (
              /* MY PROFILE TAB VIEW (BIOGRAPHY DATA) */
              <div style={{ display: 'flex', fontFamily: 'sans-serif', flexDirection: 'column', gap: '16px' }}>
                <div className="card">
                  <div className="profile-header">
                    <div className="profile-avatar-circle">
                      <img src={driverProfile.image} alt={driverProfile.name} className="profile-avatar-img" />
                    </div>
                    <h2 className="profile-name">{driverProfile.name}</h2>
                    <span className="profile-status">Status: {driverProfile.status}</span>
                  </div>

                  <div className="card-divider" />

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="bio-row">
                      <span className="bio-label">Rider Account Email</span>
                      <span className="bio-value" style={{ fontSize: '13px' }}>{driverProfile.email}</span>
                    </div>

                    <div className="bio-row">
                      <span className="bio-label">Phone Number</span>
                      <span className="bio-value">{driverProfile.phone}</span>
                    </div>

                    <div className="bio-row">
                      <span className="bio-label">Vehicle Selected</span>
                      <span className="bio-value">{driverProfile.vehicle}</span>
                    </div>

                    <div className="bio-row">
                      <span className="bio-label">License Plate</span>
                      <span className="bio-value" style={{ textTransform: 'uppercase' }}>{driverProfile.plate}</span>
                    </div>

                    {/* Engine Number Bio Row */}
                    <div className="bio-row">
                      <span className="bio-label">Engine Number</span>
                      <span className="bio-value" style={{ textTransform: 'uppercase' }}>{driverProfile.engine || '—'}</span>
                    </div>

                    {/* Guarantor Name Bio Row */}
                    <div className="bio-row">
                      <span className="bio-label">Guarantor Name</span>
                      <span className="bio-value">{driverProfile.guarantorName || '—'}</span>
                    </div>

                    {/* Guarantor Phone Bio Row */}
                    <div className="bio-row">
                      <span className="bio-label">Guarantor Phone</span>
                      <span className="bio-value">{driverProfile.guarantorPhone || '—'}</span>
                    </div>

                    <div className="bio-row">
                      <span className="bio-label">Joined On</span>
                      <span className="bio-value">{new Date(driverProfile.joinedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="card-divider" />

                  <button 
                    className="btn btn-secondary" 
                    style={{ width: '100%', borderColor: '#D32F2F', color: '#D32F2F', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={handleLogOut}
                  >
                    <LogOut size={16} />
                    Go Offline & Log Out
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Tab Bar (Visible only when registered, logged in, and approved) */}
      {driverProfile && driverProfile.status === 'Approved' && (
        <footer className="tab-bar">
          <button 
            className={`tab-item ${viewMode === 'deliveries' ? 'active' : ''}`}
            onClick={() => setViewMode('deliveries')}
          >
            <Bike size={20} />
            <span>Deliveries</span>
          </button>
          <button 
            className={`tab-item ${viewMode === 'earnings' ? 'active' : ''}`}
            onClick={() => setViewMode('earnings')}
          >
            <History size={20} />
            <span>History & Earnings</span>
          </button>
          <button 
            className={`tab-item ${viewMode === 'profile' ? 'active' : ''}`}
            onClick={() => setViewMode('profile')}
          >
            <User size={20} />
            <span>My Profile</span>
          </button>
        </footer>
      )}
    </div>
  );
}
