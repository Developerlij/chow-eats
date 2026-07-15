import React, { useState, useEffect } from 'react';
import { database, storage, auth } from './firebase';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  Store, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  MapPin, 
  Layers, 
  UtensilsCrossed,
  PackageCheck,
  AlertTriangle,
  Activity,
  LogOut,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Info
} from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App state
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);

  // Form states for Registering a New Restaurant
  const [restName, setRestName] = useState('');
  const [restImage, setRestImage] = useState('');
  const [restAddress, setRestAddress] = useState('');
  const [restDesc, setRestDesc] = useState('');
  const [restCategory, setRestCategory] = useState('Pizza');
  const [restLat, setRestLat] = useState('37.7749');
  const [restLng, setRestLng] = useState('-122.4194');

  // Form states for Adding / Editing a Dish
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingDish, setEditingDish] = useState(null); // null if adding new
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishImage, setDishImage] = useState('');

  const categoriesList = ['Pizza', 'Burgers', 'Sushi', 'Healthy', 'Nigerian', 'Desserts', 'Beverages', 'Groceries'];

  const [restUploadProgress, setRestUploadProgress] = useState('');
  const [dishUploadProgress, setDishUploadProgress] = useState('');

  // 1. Listen to Authentication State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setSelectedRest(null);
        setRestaurants([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch restaurants from Firebase and filter for logged-in merchant's store
  useEffect(() => {
    if (!user) return;

    const restRef = ref(database, 'restaurants');
    const unsubscribe = onValue(restRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          _id: key,
          ...data[key],
          dishes: data[key].dishes ? Object.values(data[key].dishes) : []
        }));
        
        // Find the store belonging to this specific user (restricted to exactly ONE)
        const myStore = list.find(r => r.ownerId === user.uid);
        setSelectedRest(myStore || null);
        setRestaurants(list);
      } else {
        setSelectedRest(null);
        setRestaurants([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Listen to active orders placed for this restaurant
  useEffect(() => {
    if (!selectedRest) {
      setActiveOrders([]);
      return;
    }
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(o => o.restaurant && o.restaurant._id === selectedRest._id);
        
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setActiveOrders(list);
      } else {
        setActiveOrders([]);
      }
    });
    return () => unsubscribe();
  }, [selectedRest]);

  // Handle Auth submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick Sandbox Merchant Account login
  const handleSandboxBypass = async () => {
    setAuthError('');
    setAuthLoading(true);
    const sandboxEmail = 'sandbox_merchant@chow.com';
    const sandboxPassword = 'chowmerchant123';

    try {
      await signInWithEmailAndPassword(auth, sandboxEmail, sandboxPassword);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, sandboxEmail, sandboxPassword);
        } catch (regErr) {
          setAuthError("Failed to register sandbox account: " + regErr.message);
        }
      } else {
        setAuthError(err.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      alert("Sign out failed: " + err.message);
    }
  };

  const handleAutoDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRestLat(position.coords.latitude.toString());
          setRestLng(position.coords.longitude.toString());
        },
        (error) => {
          alert("Could not access browser location. Please enter coordinates manually.");
        }
      );
    } else {
      alert("Browser geolocation not supported. Please enter coordinates manually.");
    }
  };

  // Handle uploading store banner image
  const handleStoreImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRestUploadProgress('Processing...');
    const reader = new FileReader();
    reader.onloadend = async () => {
      setRestImage(reader.result);
      setRestUploadProgress('Local preview ready!');

      try {
        const { ref: sRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const fileRef = sRef(storage, `restaurants/${Date.now()}_${file.name}`);
        setRestUploadProgress('Uploading to cloud...');
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        setRestImage(downloadUrl);
        setRestUploadProgress('Cloud upload successful!');
      } catch (err) {
        console.warn("Storage upload failed, keeping base64 preview:", err);
        setRestUploadProgress('Ready (preview fallback)');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle uploading food/dish product image
  const handleDishImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDishUploadProgress('Processing...');
    const reader = new FileReader();
    reader.onloadend = async () => {
      setDishImage(reader.result);
      setDishUploadProgress('Local preview ready!');

      try {
        const { ref: sRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const fileRef = sRef(storage, `dishes/${Date.now()}_${file.name}`);
        setDishUploadProgress('Uploading to cloud...');
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        setDishImage(downloadUrl);
        setDishUploadProgress('Cloud upload successful!');
      } catch (err) {
        console.warn("Storage upload failed, keeping base64 preview:", err);
        setDishUploadProgress('Ready (preview fallback)');
      }
    };
    reader.readAsDataURL(file);
  };

  // Create Merchant Restaurant Profile (Only 1 allowed, links to ownerId: user.uid)
  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    if (!restName || !restAddress || !restImage) {
      alert("Please fill in Name, Address, and Image.");
      return;
    }

    if (!user) return;

    const newId = 'rest_' + Date.now();
    const newRestaurant = {
      _id: newId,
      name: restName,
      image: restImage,
      address: restAddress,
      description: restDesc || 'Fresh local items delivered straight to your door.',
      category: restCategory,
      rating: 5.0,
      reviews: '1 review',
      lat: parseFloat(restLat) || 37.7749,
      lng: parseFloat(restLng) || -122.4194,
      verified: false,
      status: 'Pending Verification',
      ownerId: user.uid // Bound exclusively to this merchant account!
    };

    try {
      await set(ref(database, `restaurants/${newId}`), newRestaurant);
      // Reset fields
      setRestName('');
      setRestImage('');
      setRestAddress('');
      setRestDesc('');
      setRestCategory('Pizza');
      setRestLat('37.7749');
      setRestLng('-122.4194');
    } catch (e) {
      alert("Failed to create store: " + e.message);
    }
  };

  // Add / Edit Dish/Good Item
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!dishName || !dishPrice || !dishImage) {
      alert("Please fill in Name, Price, and Image.");
      return;
    }

    if (!selectedRest) return;

    const dishId = editingDish ? editingDish._id : 'dish_' + Date.now();
    const newDish = {
      _id: dishId,
      name: dishName,
      description: dishDesc || 'Freshly prepared item.',
      price: parseFloat(dishPrice),
      image: dishImage
    };

    try {
      await set(ref(database, `restaurants/${selectedRest._id}/dishes/${dishId}`), newDish);
      setShowDishModal(false);
      setEditingDish(null);
      // Reset fields
      setDishName('');
      setDishDesc('');
      setDishPrice('');
      setDishImage('');
    } catch (e) {
      alert("Failed to save item: " + e.message);
    }
  };

  // Delete Dish/Good Item
  const handleDeleteDish = async (dishId) => {
    if (!selectedRest) return;
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await remove(ref(database, `restaurants/${selectedRest._id}/dishes/${dishId}`));
      } catch (e) {
        alert("Delete failed: " + e.message);
      }
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await update(ref(database, `orders/${orderId}`), { status: newStatus });
    } catch (e) {
      alert("Failed to update status: " + e.message);
    }
  };

  // ----------------------------------------------------
  // RENDER AUTHENTICATION PORTAL (IF NOT LOGGED IN)
  // ----------------------------------------------------
  if (!user) {
    return (
      <div className="vendor-app" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '32px', borderRadius: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'rgba(6, 193, 103, 0.1)', padding: '14px', borderRadius: '12px', marginBottom: '12px' }}>
              <Store size={36} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#FFF' }}>Chow Merchant Portal</h2>
            <p style={{ color: 'var(--text-gray)', fontSize: '13px', marginTop: '4px', textAlign: 'center' }}>
              Manage your food menu, upload grocery items, and fulfill live delivery orders.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {authError && (
              <div style={{ backgroundColor: 'rgba(229, 57, 53, 0.1)', border: '1px solid var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '12.5px', color: '#FF7043' }}>
                {authError}
              </div>
            )}

            <div className="form-group">
              <label>Merchant Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input 
                  type="email" 
                  className="form-control" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="name@restaurant.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input 
                  type="password" 
                  className="form-control" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontWeight: 'bold' }}>
              {authLoading ? 'Verifying Account...' : (isRegistering ? 'Register & Begin Setup' : 'Log In to Store')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-gray)' }}>
              {isRegistering ? 'Already have a store account?' : 'Want to register a new restaurant?'}
            </span>{' '}
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              {isRegistering ? 'Log In here' : 'Register Store here'}
            </button>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '20px 0' }} />

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleSandboxBypass}
            style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 'bold', gap: '8px' }}
          >
            ⚡ Quick Sandbox Sign-In
          </button>
          
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LOGGED IN VIEWPORT
  // ----------------------------------------------------
  return (
    <div className="vendor-app">
      {/* Header bar */}
      <header className="navbar">
        <div className="nav-logo">
          <Store size={22} />
          <span>Chow Merchant Portal</span>
        </div>
        
        {/* User Account controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {selectedRest && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#BBB' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedRest.verified ? 'var(--primary)' : 'var(--warning)' }} />
              <strong style={{ color: '#FFF' }}>{selectedRest.name}</strong>
              <span>({selectedRest.category})</span>
            </div>
          )}
          
          <button 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '6px', height: 'auto', borderColor: '#444' }}
            onClick={handleLogout}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Main layout viewport */}
      <main className="content">
        {selectedRest ? (
          /* DASHBOARD VIEWPORT (If store is registered) */
          <div className="vendor-grid">
            
            {/* Left side: Restaurant Profile & Food Menu / Goods Manager */}
            <div className="main-panel">
              
              {/* Verification Warning banner */}
              {!selectedRest.verified && (
                <div style={{ backgroundColor: 'rgba(245, 124, 0, 0.12)', border: '1px solid #FFB300', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <AlertTriangle color="#FFB300" size={24} />
                  <div>
                    <strong style={{ color: '#FFB300', display: 'block', fontSize: '14px' }}>Store Verification Pending</strong>
                    <span style={{ fontSize: '13px', color: '#DDD' }}>
                      Your store registration request is currently unverified. Only Admins and Operators can verify this profile. It will not be shown on the Customer App until it is approved.
                    </span>
                  </div>
                </div>
              )}

              {/* Restaurant info card */}
              <div className="card profile-card" style={{ backgroundImage: `linear-gradient(to bottom, rgba(18,18,18,0.7), rgba(18,18,18,0.95)), url(${selectedRest.image})` }}>
                <div style={{ padding: '20px' }}>
                  <span className="badge badge-category">{selectedRest.category}</span>
                  <h1 className="merchant-title">{selectedRest.name}</h1>
                  <p className="merchant-desc">{selectedRest.description}</p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', fontSize: '13px', color: '#BBB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--primary)" />
                      <span>{selectedRest.address}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={14} color="var(--primary)" />
                      <span>Rating: ⭐ {selectedRest.rating} ({selectedRest.reviews})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Inventory Manager */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UtensilsCrossed size={18} color="var(--primary)" />
                    <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {selectedRest.category === 'Groceries' ? 'Goods & Products Inventory' : 'Foods & Dishes Menu'} ({selectedRest.dishes.length})
                    </h2>
                  </div>
                  
                  <button 
                    className="btn btn-primary"
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
                    onClick={() => {
                      setEditingDish(null);
                      setDishName('');
                      setDishDesc('');
                      setDishPrice('');
                      setDishImage('');
                      setShowDishModal(true);
                    }}
                  >
                    <PlusCircle size={16} /> Add Item
                  </button>
                </div>

                {/* Items Grid */}
                <div className="items-grid">
                  {selectedRest.dishes.map((dish) => (
                    <div key={dish._id} className="item-card">
                      <img src={dish.image} alt={dish.name} className="item-img" />
                      <div className="item-details">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <h4 className="item-name">{dish.name}</h4>
                          <span className="item-price">${dish.price.toFixed(2)}</span>
                        </div>
                        <p className="item-desc">{dish.description}</p>
                        
                        <div className="item-actions">
                          <button 
                            className="action-icon-btn" 
                            style={{ color: '#FFB300' }}
                            onClick={() => {
                              setEditingDish(dish);
                              setDishName(dish.name);
                              setDishDesc(dish.description);
                              setDishPrice(dish.price.toString());
                              setDishImage(dish.image);
                              setShowDishModal(true);
                            }}
                          >
                            <Edit3 size={15} /> Edit
                          </button>
                          <button 
                            className="action-icon-btn" 
                            style={{ color: '#D32F2F' }}
                            onClick={() => handleDeleteDish(dish._id)}
                          >
                            <Trash2 size={15} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedRest.dishes.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                      <AlertTriangle size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                      <p>No items uploaded yet. Click "Add Item" to start uploading to the user app!</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right side: Real-time orders feed for this merchant */}
            <div className="sidebar-panel">
              <div className="card">
                <div className="card-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} />
                  <span>Real-time Orders Feed ({activeOrders.length})</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {activeOrders.map((order) => (
                    <div key={order.id} className="vendor-order-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#888' }}>ID: {order.id.slice(0, 10)}...</span>
                        <span className={`status-badge status-${order.status.replace(/\s+/g, '-').toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>

                      <div style={{ margin: '8px 0', fontSize: '13px' }}>
                        <strong style={{ color: '#FFF', display: 'block', marginBottom: '4px' }}>Items:</strong>
                        {order.items && order.items.map((i, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#AAA', marginVertical: '2px' }}>
                            <span>• {i.name}</span>
                            <span>x{i.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #333', paddingTop: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#888' }}>Payout: <strong>${(order.total || 0).toFixed(2)}</strong></span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {order.status === 'Preparing' || order.status === 'Preparing Order' ? (
                            <button 
                              className="btn btn-primary" 
                              style={{ width: 'auto', padding: '4px 10px', fontSize: '11px' }}
                              onClick={() => handleUpdateOrderStatus(order.id, 'Rider Picked Up Order')}
                            >
                              Ready for Pickup
                            </button>
                          ) : null}
                          {order.status === 'Rider Picked Up Order' || order.status === 'Rider is Nearby' ? (
                            <button 
                              className="btn btn-secondary" 
                              style={{ width: 'auto', padding: '4px 10px', fontSize: '11px', borderColor: '#06C167', color: '#06C167' }}
                              onClick={() => handleUpdateOrderStatus(order.id, 'Order Delivered')}
                            >
                              Deliver
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeOrders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: '#555' }}>
                      <PackageCheck size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                      <p style={{ fontSize: '12px' }}>No active customer orders placed for this vendor profile yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* REGISTRATION DESK SCREEN (If no store is registered to UID) */
          <div style={{ maxWidth: '640px', margin: '40px auto' }}>
            <div className="card" style={{ padding: '32px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: 'rgba(6, 193, 103, 0.1)', padding: '10px', borderRadius: '8px' }}>
                  <Store size={28} color="var(--primary)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFF' }}>Register Your Store / Restaurant</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '2px' }}>
                    Create your merchant profile. You can register exactly one store under this account.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateRestaurant}>
                <div className="form-group">
                  <label>Store Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={restName}
                    onChange={(e) => setRestName(e.target.value)}
                    placeholder="e.g. Nonna's Pizzeria"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Store Cover Image</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleStoreImageUpload} 
                      style={{ fontSize: '12px', color: '#888' }}
                    />
                    {restUploadProgress && (
                      <span style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 'bold' }}>
                        {restUploadProgress}
                      </span>
                    )}
                    <input 
                      type="url" 
                      className="form-control" 
                      value={restImage}
                      onChange={(e) => setRestImage(e.target.value)}
                      placeholder="Or paste an image URL directly..."
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address Details</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={restAddress}
                    onChange={(e) => setRestAddress(e.target.value)}
                    placeholder="e.g. 123 Roman Way, Food Town"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description Bio</label>
                  <textarea 
                    className="form-control" 
                    value={restDesc}
                    onChange={(e) => setRestDesc(e.target.value)}
                    placeholder="e.g. Authentic stone-baked Italian pizza..."
                    rows={3}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Store Location Coords</label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '11px', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 'bold' }}
                    onClick={handleAutoDetectLocation}
                  >
                    📍 Use Live Location
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label>Latitude</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={restLat}
                      onChange={(e) => setRestLat(e.target.value)}
                      placeholder="37.7749"
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={restLng}
                      onChange={(e) => setRestLng(e.target.value)}
                      placeholder="-122.4194"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Category Group</label>
                  <select 
                    className="form-control"
                    value={restCategory}
                    onChange={(e) => setRestCategory(e.target.value)}
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', padding: '14px', fontSize: '15px' }}>
                  Submit Store for Verification
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* NEW/EDIT INVENTORY ITEM MODAL */}
      {showDishModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--primary)', fontWeight: 'bold' }}>
              {editingDish ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h3>
            <form onSubmit={handleSaveDish}>
              <div className="form-group">
                <label>Item Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Garlic Herb Fries"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description Details</label>
                <textarea 
                  className="form-control" 
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  placeholder="e.g. Golden hand-cut potato fries tossed in garlic butter..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Item Price ($ USD)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  value={dishPrice}
                  onChange={(e) => setDishPrice(e.target.value)}
                  placeholder="e.g. 5.99"
                  required
                />
              </div>

              <div className="form-group">
                <label>Product Image</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleDishImageUpload} 
                    style={{ fontSize: '12px', color: '#888' }}
                  />
                  {dishUploadProgress && (
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold' }}>
                      {dishUploadProgress}
                    </span>
                  )}
                  <input 
                    type="url" 
                    className="form-control" 
                    value={dishImage}
                    onChange={(e) => setDishImage(e.target.value)}
                    placeholder="Or paste a product image URL directly..."
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setShowDishModal(false); setEditingDish(null); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDish ? 'Save Changes' : 'Upload to Customer App'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
