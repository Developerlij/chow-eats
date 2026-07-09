import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, update } from 'firebase/database';
import { MapPin, Navigation, ShoppingBag, DollarSign, Bike, CheckCircle2, Play } from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [driverName, setDriverName] = useState('Sarah Jenkins');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

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
    if (!activeOrder || activeOrder.status === 'Order Delivered' || isSimulating) return;

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
              name: driverName
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
  }, [activeOrder, isSimulating]);

  const handleClaimOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      const orderRef = ref(database, `orders/${orderId}`);
      await update(orderRef, {
        status: 'Preparing Order',
        rider: {
          name: driverName,
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
    if (!activeOrder || isSimulating) return;

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
          name: driverName
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

  return (
    <div className="driver-app">
      {/* Header navbar */}
      <header className="navbar">
        <div className="nav-logo">
          <Bike size={24} />
          <span>Chow Rider</span>
        </div>
        <div className="driver-badge">GPS ACTIVE</div>
      </header>

      <div className="content">
        {/* Active Trip Dashboard */}
        {activeOrder ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ borderColor: 'var(--primary)' }}>
              <div className="card-title" style={{ color: 'var(--primary)' }}>
                <Navigation size={18} />
                <span>Active Delivery Route</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="address-row">
                  <MapPin size={16} color="#FF5722" />
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
                  <p style={{ color: '#FF5722', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Drive Simulation in Progress...</p>
                  <div style={{ height: '6px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(simProgress / 20) * 100}%`, height: '100%', backgroundColor: '#FF5722' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Available Jobs List View */
          <div>
            <div className="card-title" style={{ paddingLeft: '4px', marginBottom: '16px' }}>
              <ShoppingBag size={18} color="#FF5722" />
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
        )}
      </div>
    </div>
  );
}
