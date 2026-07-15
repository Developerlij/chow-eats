import React, { useState, useEffect, useRef } from 'react';
import { database } from '../firebase';
import { ref, onValue, update, remove } from 'firebase/database';
import { TrendingUp, ShoppingBag, Store, Users, Key, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Overview() {
  const [metrics, setMetrics] = useState({
    profit: 0,
    ordersCount: 0,
    restaurantsCount: 0,
    usersCount: 5
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [liveDrivers, setLiveDrivers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [userLocations, setUserLocations] = useState([]);

  // Mapbox GL JS States and Refs
  const [mapInstance, setMapInstance] = useState(null);
  const [mapStyleLoaded, setMapStyleLoaded] = useState(false);
  const markersRef = useRef([]);
  
  // Developer Access Token Storage (Saves to localStorage so the user can easily paste their Mapbox Token)
  const [mapboxToken, setMapboxToken] = useState(
    localStorage.getItem('mapbox_access_token') || 'pk.eyJ1IjoiZGV2ZWxvcGVybGlqIiwiYSI6ImNsd3k4eTR6MDBnbjcycW81MzdzamI4dzMifQ.YourDefaultMockTokenOrActual'
  );
  const [tokenInputOpen, setTokenInputOpen] = useState(false);
  const [tempTokenInput, setTempTokenInput] = useState('');

  // Store verification actions
  const verifyStore = async (storeId) => {
    try {
      await update(ref(database, `restaurants/${storeId}`), {
        verified: true,
        status: 'Active'
      });
    } catch (e) {
      alert("Failed to verify store: " + e.message);
    }
  };

  const rejectStore = async (storeId) => {
    if (window.confirm("Are you sure you want to reject and delete this merchant store request?")) {
      try {
        await remove(ref(database, `restaurants/${storeId}`));
      } catch (e) {
        alert("Failed to delete store: " + e.message);
      }
    }
  };

  // 1. Fetch live metrics and coordinates from Firebase Realtime Database
  useEffect(() => {
    // a. Fetch Orders & Profit
    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        setAllOrders(orderList);
        orderList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentOrders(orderList.slice(0, 5));

        const totalProfit = orderList.reduce((acc, order) => acc + (order.total || 0), 0);
        setMetrics(prev => ({
          ...prev,
          profit: totalProfit,
          ordersCount: orderList.length
        }));
      }
    });

    // b. Fetch Restaurants
    const restRef = ref(database, 'restaurants');
    const unsubscribeRest = onValue(restRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setRestaurants(list);
        setMetrics(prev => ({
          ...prev,
          restaurantsCount: list.length
        }));
      }
    });

    // c. Fetch Live Drivers & Coordinates
    const driversRef = ref(database, 'drivers');
    const unsubscribeDrivers = onValue(driversRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setLiveDrivers(list);
      }
    });

    // d. Fetch Live User Locations
    const userLocsRef = ref(database, 'userLocations');
    const unsubscribeUserLocs = onValue(userLocsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setUserLocations(list);
        setMetrics(prev => ({
          ...prev,
          usersCount: list.length
        }));
      } else {
        setUserLocations([]);
        setMetrics(prev => ({
          ...prev,
          usersCount: 0
        }));
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeRest();
      unsubscribeDrivers();
      unsubscribeUserLocs();
    };
  }, []);

  // 2. Initialize Mapbox Map when token changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof mapboxgl === 'undefined') return;

    // Set Mapbox token
    mapboxgl.accessToken = mapboxToken;

    const container = document.getElementById('live-dispatch-mapbox');
    if (!container) return;

    // Clear previous Mapbox canvas inside container to prevent WebGL context conflicts
    container.innerHTML = '';

    let map;
    try {
      map = new mapboxgl.Map({
        container: 'live-dispatch-mapbox',
        style: 'mapbox://styles/mapbox/dark-v11', // Dark Theme matching premium dashboard
        center: [-122.4194, 37.7749], // San Francisco [lng, lat]
        zoom: 12,
        attributionControl: false
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
      
      map.on('style.load', () => {
        setMapStyleLoaded(true);
      });
      
      setMapInstance(map);
    } catch (e) {
      console.error("Failed to initialize Mapbox GL JS map:", e);
      container.innerHTML = `
        <div style="color: #FF5252; padding: 24px; text-align: center; font-size: 13.5px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #1C1C1C;">
          <strong style="margin-bottom: 8px;">Mapbox Access Token Error</strong>
          <span style="color: #999; margin-bottom: 16px;">Please set a valid Mapbox API key in the credentials input overlay below.</span>
        </div>
      `;
    }

    return () => {
      if (map) map.remove();
      setMapStyleLoaded(false);
    };
  }, [mapboxToken]);

  // 3. Render and update Mapbox Pin markers and Route Polylines dynamically
  useEffect(() => {
    if (!mapInstance || typeof mapboxgl === 'undefined') return;

    // Helper to generate a custom colored pin marker element
    const createMarkerElement = (color, label) => {
      const el = document.createElement('div');
      el.className = 'custom-mapbox-marker-container';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.innerHTML = `
        <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 4px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
          <div style="background-color: #FFFFFF; width: 4px; height: 4px; border-radius: 50%;"></div>
        </div>
        <div style="background: rgba(26,26,26,0.95); border: 1px solid #444; color: #FFFFFF; font-size: 8.5px; font-weight: bold; padding: 2px 5px; border-radius: 3px; white-space: nowrap; margin-top: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
          ${label}
        </div>
      `;
      return el;
    };

    // Remove old pin markers from map
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasCoords = false;

    // a. Render Restaurants (Green pins)
    restaurants.forEach(rest => {
      if (rest.lat && rest.lng) {
        const lngLat = [parseFloat(rest.lng), parseFloat(rest.lat)];
        bounds.extend(lngLat);
        hasCoords = true;

        const marker = new mapboxgl.Marker({
          element: createMarkerElement('#06C167', rest.name)
        })
        .setLngLat(lngLat)
        .addTo(mapInstance);

        markersRef.current.push(marker);
      }
    });

    // b. Render Drivers (Idle: Orange / Active: Blue)
    liveDrivers.filter(d => d.lat && d.lng).forEach(driver => {
      const lngLat = [parseFloat(driver.lng), parseFloat(driver.lat)];
      bounds.extend(lngLat);
      hasCoords = true;

      const isTrip = driver.tripStatus === 'On Trip';
      const marker = new mapboxgl.Marker({
        element: createMarkerElement(isTrip ? '#0288D1' : '#F57C00', `Rider: ${driver.name.split(' ')[0]}`)
      })
      .setLngLat(lngLat)
      .addTo(mapInstance);

      markersRef.current.push(marker);
    });

    // c. Render Active Customers & Polylines
    const activeOrders = allOrders.filter(o => o.status && o.status !== 'Order Delivered' && o.status !== 'Refunded');
    
    // Construct route path lines
    const restToRiderLines = [];
    const riderToCustLines = [];
    const directLines = [];

    activeOrders.forEach(order => {
      const restLat = parseFloat(order.restaurant?.lat) || 37.7749;
      const restLng = parseFloat(order.restaurant?.lng) || -122.4194;
      const custLat = parseFloat(order.dropoffLat) || (restLat - 0.015);
      const custLng = parseFloat(order.dropoffLng) || (restLng + 0.015);

      const restLngLat = [restLng, restLat];
      const custLngLat = [custLng, custLat];

      bounds.extend(custLngLat);
      hasCoords = true;

      // Customer Pin
      const nameLabel = order.userEmail ? order.userEmail.split('@')[0] : 'Guest';
      const marker = new mapboxgl.Marker({
        element: createMarkerElement('#D32F2F', `Cust: ${nameLabel}`)
      })
      .setLngLat(custLngLat)
      .addTo(mapInstance);

      markersRef.current.push(marker);

      // Polyline Routing Coordinate Collections
      const assignedRider = liveDrivers.find(d => d.name === order.rider?.name);
      if (assignedRider && assignedRider.lat && assignedRider.lng) {
        const riderLngLat = [parseFloat(assignedRider.lng), parseFloat(assignedRider.lat)];
        
        restToRiderLines.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [restLngLat, riderLngLat]
          }
        });

        riderToCustLines.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [riderLngLat, custLngLat]
          }
        });
      } else {
        directLines.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [restLngLat, custLngLat]
          }
        });
      }
    });

    // d. Render Live App Installs (Purple pins)
    userLocations.forEach(userLoc => {
      if (userLoc.lat && userLoc.lng) {
        const lngLat = [parseFloat(userLoc.lng), parseFloat(userLoc.lat)];
        bounds.extend(lngLat);
        hasCoords = true;

        const name = userLoc.email ? userLoc.email.split('@')[0] : 'Guest';
        const marker = new mapboxgl.Marker({
          element: createMarkerElement('#9C27B0', `User: ${name}`)
        })
        .setLngLat(lngLat)
        .addTo(mapInstance);

        markersRef.current.push(marker);
      }
    });

    // Fit Map to coordinates
    if (hasCoords) {
      try {
        mapInstance.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 1500 });
      } catch (err) {}
    }

    // Function to render geoJSON route polylines safely in Mapbox style layers
    const updateMapboxPolylines = () => {
      if (!mapInstance.isStyleLoaded() || !mapStyleLoaded) return;

      const layers = [
        { id: 'route-rest-rider', data: restToRiderLines, color: '#06C167', dash: [3, 3] },
        { id: 'route-rider-cust', data: riderToCustLines, color: '#0288D1', dash: null },
        { id: 'route-direct', data: directLines, color: '#888888', dash: [1, 3] }
      ];

      layers.forEach(layer => {
        // Clear existing layer & source
        if (mapInstance.getLayer(layer.id)) mapInstance.removeLayer(layer.id);
        if (mapInstance.getSource(layer.id)) mapInstance.removeSource(layer.id);

        if (layer.data.length > 0) {
          mapInstance.addSource(layer.id, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: layer.data
            }
          });

          const paintStyle = {
            'line-color': layer.color,
            'line-width': 2.5,
            'line-opacity': 0.8
          };

          if (layer.dash) {
            paintStyle['line-dasharray'] = layer.dash;
          }

          mapInstance.addLayer({
            id: layer.id,
            type: 'line',
            source: layer.id,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: paintStyle
          });
        }
      });
    };

    if (mapStyleLoaded) {
      updateMapboxPolylines();
    } else {
      mapInstance.on('style.load', updateMapboxPolylines);
    }

  }, [mapInstance, mapStyleLoaded, liveDrivers, restaurants, allOrders, userLocations]);

  // Handlers for Custom Mapbox token updates
  const saveMapboxToken = () => {
    if (tempTokenInput.trim()) {
      localStorage.setItem('mapbox_access_token', tempTokenInput.trim());
      setMapboxToken(tempTokenInput.trim());
      setTokenInputOpen(false);
    }
  };

  const revenueData = [
    { label: 'Mon', value: metrics.profit * 0.12 },
    { label: 'Tue', value: metrics.profit * 0.15 },
    { label: 'Wed', value: metrics.profit * 0.18 },
    { label: 'Thu', value: metrics.profit * 0.10 },
    { label: 'Fri', value: metrics.profit * 0.22 },
    { label: 'Sat', value: metrics.profit * 0.28 },
    { label: 'Sun', value: metrics.profit * 0.35 }
  ];

  const maxVal = Math.max(...revenueData.map(d => d.value), 10);

  return (
    <div>
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: '#E8F5E9' }}>
            <TrendingUp size={24} color="#06C167" />
          </div>
          <div className="metric-details">
            <h4>Total Profit</h4>
            <p>${metrics.profit.toFixed(2)}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: '#FFF3E0' }}>
            <ShoppingBag size={24} color="#F57C00" />
          </div>
          <div className="metric-details">
            <h4>Total Orders</h4>
            <p>{metrics.ordersCount}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: '#E1F5FE' }}>
            <Store size={24} color="#0288D1" />
          </div>
          <div className="metric-details">
            <h4>Restaurants</h4>
            <p>{metrics.restaurantsCount}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: '#EDE7F6' }}>
            <Users size={24} color="#673AB7" />
          </div>
          <div className="metric-details">
            <h4>Active Fleet</h4>
            <p>{liveDrivers.filter(d => d.status === 'Approved').length} Riders</p>
          </div>
        </div>
      </div>

      <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Sales Chart Card */}
        <div className="card">
          <div className="card-title">Weekly Revenue Breakdown</div>
          <div className="chart-container" style={{ height: '260px' }}>
            {revenueData.map((day, idx) => {
              const heightPct = `${(day.value / maxVal) * 90}%`;
              return (
                <div key={idx} className="chart-bar-wrapper">
                  <div className="chart-bar" style={{ height: heightPct }}>
                    <div className="chart-bar-tooltip">${day.value.toFixed(2)}</div>
                  </div>
                  <span className="chart-label">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Mapbox Dispatch Map */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            <span>Live Dispatch Map (God-View)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => setTokenInputOpen(!tokenInputOpen)}
                style={{ 
                  background: '#2B2B2B', 
                  border: '1px solid #444', 
                  color: '#FFF', 
                  borderRadius: '4px', 
                  padding: '3px 8px', 
                  fontSize: '10.5px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Key size={12} color="#06C167" />
                Mapbox Token
              </button>
              <span style={{ fontSize: '11px', color: '#06C167', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#06C167', borderRadius: '50%', display: 'inline-block' }} />
                Mapbox Sync
              </span>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', minHeight: '260px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
            {/* Mapbox Canvas target */}
            <div id="live-dispatch-mapbox" style={{ width: '100%', height: '100%', minHeight: '260px', backgroundColor: '#1C1C1C' }} />

            {/* Token entry overlay */}
            {tokenInputOpen && (
              <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', backgroundColor: 'rgba(26,26,26,0.95)', border: '1px solid #444', padding: '10px', borderRadius: '6px', zIndex: 2000 }}>
                <div style={{ fontSize: '11px', color: '#FFF', fontWeight: 'bold', marginBottom: '6px' }}>Enter Mapbox Access Token:</div>
                <input 
                  type="text" 
                  placeholder="pk.eyJ1..."
                  value={tempTokenInput}
                  onChange={(e) => setTempTokenInput(e.target.value)}
                  style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #555', background: '#222', color: '#FFF', fontSize: '10px', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setTokenInputOpen(false)} style={{ background: 'transparent', border: 'none', color: '#AAA', fontSize: '10px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveMapboxToken} style={{ background: '#06C167', border: 'none', color: '#FFF', padding: '3px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Save Token</button>
                </div>
              </div>
            )}

            {/* Map Legend overlay */}
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: 'rgba(26,26,26,0.9)', padding: '6px 10px', borderRadius: '6px', display: 'flex', gap: '10px', fontSize: '9.5px', border: '1px solid #444', zIndex: 1000 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0288D1' }} />
                <span style={{ color: '#DDD' }}>Rider (Trip)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F57C00' }} />
                <span style={{ color: '#DDD' }}>Rider (Idle)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06C167' }} />
                <span style={{ color: '#DDD' }}>Restaurant</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#D32F2F' }} />
                <span style={{ color: '#DDD' }}>Dropoff</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#9C27B0' }} />
                <span style={{ color: '#DDD' }}>App Install</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title">Recent Order Placements</div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Restaurant</th>
                <th>Total Value</th>
                <th>Date Placed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><code style={{ fontSize: '12px' }}>{order.id.slice(0, 10)}...</code></td>
                    <td>{order.restaurant?.name || 'Chow Groceries'}</td>
                    <td style={{ fontWeight: 'bold' }}>${(order.total || 0).toFixed(2)}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${
                        order.status === 'Preparing' || order.status === 'Preparing Order' ? 'preparing' :
                        order.status === 'Order Delivered' ? 'delivered' : 'pickup'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Store Registrations Table */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="#FFB300" />
          <span>Pending Merchant Store Registrations ({restaurants.filter(r => !r.verified).length})</span>
        </div>
        <div className="table-responsive" style={{ marginTop: '16px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Cover</th>
                <th>Store Name</th>
                <th>Category</th>
                <th>Address</th>
                <th>Coordinates</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.filter(r => !r.verified).length > 0 ? (
                restaurants.filter(r => !r.verified).map((s) => (
                  <tr key={s.id}>
                    <td>
                      <img 
                        src={s.image} 
                        alt={s.name} 
                        style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', backgroundColor: '#333' }}
                      />
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#FFF' }}>🏪 {s.name}</td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: 'rgba(2, 136, 209, 0.15)', color: '#0288D1', fontSize: '10px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px' }}>
                        {s.category}
                      </span>
                    </td>
                    <td style={{ color: '#CCC' }}>{s.address || '—'}</td>
                    <td>
                      {s.lat && s.lng ? (
                        <code style={{ fontSize: '11px', color: '#06C167', fontFamily: 'monospace' }}>
                          {parseFloat(s.lat).toFixed(4)}, {parseFloat(s.lng).toFixed(4)}
                        </code>
                      ) : (
                        <span style={{ color: '#666', fontStyle: 'italic' }}>no coords</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn" 
                          style={{ width: 'auto', padding: '6px 12px', fontSize: '11.5px', textTransform: 'none', height: 'auto', backgroundColor: '#06C167', color: '#FFF' }}
                          onClick={() => verifyStore(s.id)}
                        >
                          <ShieldCheck size={12} style={{ marginRight: '4px' }} />
                          Verify Store
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ width: 'auto', padding: '6px 12px', fontSize: '11.5px', textTransform: 'none', height: 'auto', borderColor: '#D32F2F', color: '#D32F2F' }}
                          onClick={() => rejectStore(s.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#666', padding: '24px' }}>
                    No pending store registrations require action.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
