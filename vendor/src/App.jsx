import React, { useState, useEffect } from 'react';
import { database, storage } from './firebase';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { 
  Store, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  MapPin, 
  Tag, 
  Layers, 
  Image as ImageIcon,
  DollarSign, 
  ChevronRight,
  UtensilsCrossed,
  PackageCheck,
  AlertTriangle,
  User,
  Activity
} from 'lucide-react';

export default function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestId, setSelectedRestId] = useState('');
  const [selectedRest, setSelectedRest] = useState(null);
  
  // Real-time active orders for this restaurant
  const [activeOrders, setActiveOrders] = useState([]);

  // Form states for Registering a New Restaurant
  const [showNewRestModal, setShowNewRestModal] = useState(false);
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

  // Handle uploading store banner image
  const handleStoreImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRestUploadProgress('Processing...');
    
    // 1. Instant local preview fallback
    const reader = new FileReader();
    reader.onloadend = async () => {
      setRestImage(reader.result);
      setRestUploadProgress('Local preview ready!');

      // 2. Perform background Firebase Storage upload
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
    
    // 1. Instant local preview fallback
    const reader = new FileReader();
    reader.onloadend = async () => {
      setDishImage(reader.result);
      setDishUploadProgress('Local preview ready!');

      // 2. Perform background Firebase Storage upload
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

  // 1. Fetch all restaurants from Firebase database
  useEffect(() => {
    const restRef = ref(database, 'restaurants');
    const unsubscribe = onValue(restRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          _id: key,
          ...data[key],
          dishes: data[key].dishes ? Object.values(data[key].dishes) : []
        }));
        setRestaurants(list);
        
        // Auto-select first restaurant if none selected
        if (!selectedRestId && list.length > 0) {
          setSelectedRestId(list[0]._id);
        }
      } else {
        setRestaurants([]);
      }
    });
    return () => unsubscribe();
  }, [selectedRestId]);

  // 2. Sync selected restaurant data
  useEffect(() => {
    if (selectedRestId) {
      const current = restaurants.find(r => r._id === selectedRestId);
      setSelectedRest(current || null);
    } else {
      setSelectedRest(null);
    }
  }, [selectedRestId, restaurants]);

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

  // 4. Create New Restaurant Profile
  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    if (!restName || !restAddress || !restImage) {
      alert("Please fill in Name, Address, and Image URL.");
      return;
    }

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
      status: 'Pending Verification'
    };

    try {
      await set(ref(database, `restaurants/${newId}`), newRestaurant);
      setSelectedRestId(newId);
      setShowNewRestModal(false);
      // Reset fields
      setRestName('');
      setRestImage('');
      setRestAddress('');
      setRestDesc('');
      setRestCategory('Pizza');
      setRestLat('37.7749');
      setRestLng('-122.4194');
    } catch (e) {
      alert("Failed to create vendor: " + e.message);
    }
  };

  // 5. Add / Edit Dish/Good Item
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!dishName || !dishPrice || !dishImage) {
      alert("Please fill in Name, Price, and Image URL.");
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

  // 6. Delete Dish/Good Item
  const handleDeleteDish = async (dishId) => {
    if (!selectedRest) return;
    if (window.confirm("Are you sure you want to delete this food item/good?")) {
      try {
        await remove(ref(database, `restaurants/${selectedRest._id}/dishes/${dishId}`));
      } catch (e) {
        alert("Delete failed: " + e.message);
      }
    }
  };

  // 7. Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await update(ref(database, `orders/${orderId}`), { status: newStatus });
    } catch (e) {
      alert("Failed to update status: " + e.message);
    }
  };

  return (
    <div className="vendor-app">
      {/* Header bar */}
      <header className="navbar">
        <div className="nav-logo">
          <Store size={24} />
          <span>Chow Merchant Portal</span>
        </div>
        
        {/* Restaurant selector dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select 
            className="rest-select"
            value={selectedRestId}
            onChange={(e) => setSelectedRestId(e.target.value)}
          >
            {restaurants.map(r => (
              <option key={r._id} value={r._id}>
                {r.name} ({r.category}) {r.verified ? '✓' : '[Pending Verification]'}
              </option>
            ))}
          </select>
          
          <button 
            className="btn btn-primary" 
            style={{ width: 'auto', padding: '8px 14px', fontSize: '13px' }}
            onClick={() => setShowNewRestModal(true)}
          >
            <PlusCircle size={16} /> Register Store
          </button>
        </div>
      </header>

      {/* Main layout viewport */}
      <main className="content">
        {selectedRest ? (
          <div className="vendor-grid">
            
            {/* Left side: Restaurant Profile & Food Menu / Goods Manager */}
            <div className="main-panel">
              
              {/* Verification Warning banner */}
              {selectedRest && !selectedRest.verified && (
                <div style={{ backgroundColor: 'rgba(245, 124, 0, 0.15)', border: '1px solid #FFB300', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <AlertTriangle color="#FFB300" size={24} />
                  <div>
                    <strong style={{ color: '#FFB300', display: 'block', fontSize: '14px' }}>Store Verification Pending</strong>
                    <span style={{ fontSize: '13px', color: '#DDD' }}>
                      This store is currently unverified. Only Admins and Operators can verify this store. It will not be shown on the Customer App until it is approved.
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
                <div className="card-title" style={{ color: 'var(--primary)' }}>
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
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#888' }}>
            <Store size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <h2>No Merchant Stores Registered</h2>
            <p style={{ marginTop: '8px' }}>Register a store profile using the button above to begin uploading menus and products.</p>
          </div>
        )}
      </main>

      {/* NEW RESTAURANT REGISTRATION MODAL */}
      {showNewRestModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--primary)', fontWeight: 'bold' }}>Register New Merchant Store</h3>
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
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold' }}>
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
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowNewRestModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
