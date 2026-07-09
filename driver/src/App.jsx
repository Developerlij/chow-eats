import React, { useState, useEffect } from 'react';
import { database, storage } from './firebase';
import { ref, onValue, update, set } from 'firebase/database';
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
  LogOut 
} from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  
  // Tab/Navigation view state: 'deliveries', 'earnings', or 'profile'
  const [viewMode, setViewMode] = useState('deliveries');

  // Driver Profile State
  const [driverProfile, setDriverProfile] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Sign Up Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formVehicle, setFormVehicle] = useState('Motorcycle');
  const [formPlate, setFormPlate] = useState('');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  const [uploadProgress, setUploadProgress] = useState('');
  const [formError, setFormError] = useState('');

  // Load existing profile from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chow_rider_profile');
    if (saved) {
      try {
        setDriverProfile(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved profile:", e);
      }
    }
  }, []);

  useEffect(() => {
    // Listen to all database orders
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

  // Handle GPS location streaming
  useEffect(() => {
    if (!driverProfile || !activeOrder || activeOrder.status === 'Order Delivered' || isSimulating) return;

    // Use browser GPS watcher to stream coordinates if active
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setGpsCoords({ latitude, longitude });

          // Stream coordinates directly to this order's rider details in Firebase Realtime Database
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress('Processing...');
    setFormError('');
    
    // 1. Instantly convert to base64 for instant client visual preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      setFormImage(reader.result);
      setUploadProgress('Ready (local fallback)!');

      // 2. Perform Firebase storage upload in background
      try {
        const { ref: sRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const fileRef = sRef(storage, `riders/${Date.now()}_${file.name}`);
        
        setUploadProgress('Uploading to cloud...');
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        setFormImage(downloadUrl);
        setUploadProgress('Cloud upload success!');
      } catch (err) {
        console.warn("Storage upload failed, keeping base64 fallback:", err);
        setUploadProgress('Ready (local fallback)!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone || !formPlate) {
      setFormError("Please fill in Name, Phone, and License Plate.");
      return;
    }

    setIsRegistering(true);
    setFormError('');

    const riderId = 'rider_' + Math.random().toString(36).substring(2, 9);
    const profile = {
      id: riderId,
      name: formName,
      phone: formPhone,
      vehicle: formVehicle,
      plate: formPlate,
      image: formImage,
      status: 'Approved',
      joinedAt: new Date().toISOString()
    };

    try {
      // Save rider bio data to Firebase Realtime Database
      const riderRef = ref(database, `drivers/${riderId}`);
      await set(riderRef, profile);

      // Save locally to browser
      localStorage.setItem('chow_rider_profile', JSON.stringify(profile));
      setDriverProfile(profile);
    } catch (err) {
      setFormError("Failed to register as rider: " + err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogOut = () => {
    if (window.confirm("Are you sure you want to go offline and log out?")) {
      localStorage.removeItem('chow_rider_profile');
      setDriverProfile(null);
      setActiveOrder(null);
      setGpsCoords(null);
      setIsSimulating(false);
      setViewMode('deliveries');
      // Reset form fields
      setFormName('');
      setFormPhone('');
      setFormPlate('');
      setFormImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
      setUploadProgress('');
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

  // Simulate rider driving from restaurant to destination
  const handleSimulateRoute = () => {
    if (!driverProfile || !activeOrder || isSimulating) return;

    setIsSimulating(true);
    const startLat = activeOrder.restaurant?.lat || 37.7882;
    const startLng = activeOrder.restaurant?.lng || -122.4324;
    const endLat = 37.7749; // Simulated user home coords
    const endLng = -122.4194;

    let step = 0;
    const totalSteps = 20;

    const interval = setInterval(async () => {
      step += 1;
      setSimProgress(step);
      const fraction = step / totalSteps;
      const currentLat = startLat + (endLat - startLat) * fraction;
      const currentLng = startLng + (endLng - startLng) * fraction;

      setGpsCoords({ latitude: currentLat, longitude: currentLng });

      try {
        const riderRef = ref(database, `orders/${activeOrder.id}/rider`);
        await update(riderRef, {
          lat: currentLat,
          lng: currentLng,
          name: driverProfile.name
        });

        // Automatically advance statuses during simulation
        if (step === 8) {
          await update(ref(database, `orders/${activeOrder.id}`), { status: 'Rider is Nearby' });
        } else if (step === totalSteps) {
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
    }, 1000);
  };

  const getUnassignedOrders = () => {
    return orders.filter(o => o.status === 'Preparing' || o.status === 'Preparing Order');
  };

  // Filter completed deliveries matching this driver's name
  const getCompletedDeliveries = () => {
    if (!driverProfile) return [];
    return orders.filter(o => o.rider?.name === driverProfile.name && o.status === 'Order Delivered');
  };

  // Calculate sum total payout of completed orders
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
        <div className="driver-badge">{driverProfile ? 'ONLINE' : 'OFFLINE'}</div>
      </header>

      {/* Main tab screens content */}
      <div className="content">
        {!driverProfile ? (
          /* ONBOARDING REGISTRATION VIEW */
          <div className="card" style={{ borderColor: 'var(--primary)' }}>
            <div className="card-title" style={{ justifyContent: 'center', fontSize: '18px', color: 'var(--primary)' }}>
              <User size={20} />
              <span>Rider Registration Onboarding</span>
            </div>
            
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#AAA', marginBottom: '20px' }}>
              Register below to sign up as a delivery rider and start accepting available food delivery jobs.
            </p>

            {formError && (
              <div style={{ padding: '12px', backgroundColor: '#FFEBEE', color: '#D32F2F', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSignUp}>
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

              <button 
                type="submit" 
                className="btn" 
                style={{ width: '100%', marginTop: '16px' }} 
                disabled={isRegistering}
              >
                <Bike size={18} style={{ marginRight: '6px' }} />
                {isRegistering ? 'Registering...' : 'Register & Go Online'}
              </button>
            </form>
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
                          <strong style={{ display: 'block', color: '#FFF' }}>Pickup: {activeOrder.restaurant?.name}</strong>
                          <span style={{ fontSize: '13px' }}>{activeOrder.restaurant?.address}</span>
                        </div>
                      </div>

                      <div style={{ width: '2px', height: '16px', backgroundColor: '#444', marginLeft: '7px' }} />

                      <div className="address-row">
                        <MapPin size={16} color="#06C167" />
                        <div>
                          <strong style={{ display: 'block', color: '#FFF' }}>Dropoff: Your Home</strong>
                          <span style={{ fontSize: '13px' }}>123 Roman Way, Food Town</span>
                        </div>
                      </div>
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
                        </div>

                        <div className="address-row">
                          <MapPin size={14} color="#888" />
                          <span>Pickup: {order.restaurant?.name || 'Chow Groceries'}</span>
                        </div>

                        <div className="address-row">
                          <MapPin size={14} color="#888" />
                          <span>Dropoff: 123 Roman Way, Food Town</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                      <span className="bio-label">Rider Account ID</span>
                      <span className="bio-value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{driverProfile.id}</span>
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

      {/* Bottom Tab Bar (Visible only when registered/logged in) */}
      {driverProfile && (
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
