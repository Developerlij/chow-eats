import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { TrendingUp, ShoppingBag, Store, Users } from 'lucide-react';

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

  // Leaflet Map States
  const [mapInstance, setMapInstance] = useState(null);
  const [markerLayer, setMarkerLayer] = useState(null);

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

    return () => {
      unsubscribeOrders();
      unsubscribeRest();
      unsubscribeDrivers();
    };
  }, []);

  // 2. Initialize Leaflet Map once
  useEffect(() => {
    if (typeof window === 'undefined' || typeof L === 'undefined') return;

    // Check if map element already initialized to prevent errors
    const container = L.DomUtil.get('live-dispatch-leaflet-map');
    if (container && container._leaflet_id) {
      return;
    }

    // Centered in a default coordinate (e.g. San Francisco Bay Area coords or dynamic average)
    const map = L.map('live-dispatch-leaflet-map', {
      zoomControl: true,
      attributionControl: false
    }).setView([37.7749, -122.4194], 13);

    // Premium Dark Theme maps layers matching admin aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    
    setMapInstance(map);
    setMarkerLayer(layerGroup);

    return () => {
      map.remove();
    };
  }, []);

  // 3. Update markers and paths on the live Leaflet map
  useEffect(() => {
    if (!mapInstance || !markerLayer || typeof L === 'undefined') return;

    // Clear previous markers & polylines
    markerLayer.clearLayers();

    // Helper to build a premium HTML marker pin representation
    const createMarkerIcon = (color, title, iconName) => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #FFF; box-shadow: 0 2px 4px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
              <div style="background-color: #FFF; width: 4px; height: 4px; border-radius: 50%;"></div>
            </div>
            <div style="background: rgba(26,26,26,0.9); border: 1px solid #444; color: #FFF; font-size: 8.5px; font-weight: bold; padding: 2px 5px; border-radius: 3px; white-space: nowrap; margin-top: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
              ${title}
            </div>
          </div>
        `,
        iconSize: [60, 40],
        iconAnchor: [30, 7]
      });
    };

    // Keep bounds to fit all elements dynamically
    const bounds = [];

    // a. Render Restaurants (Green pins)
    restaurants.forEach(rest => {
      if (rest.lat && rest.lng) {
        const latLng = [parseFloat(rest.lat), parseFloat(rest.lng)];
        bounds.push(latLng);
        L.marker(latLng, {
          icon: createMarkerIcon('#06C167', rest.name)
        }).addTo(markerLayer);
      }
    });

    // b. Render Drivers (Idle: Orange / Active: Blue)
    liveDrivers.filter(d => d.lat && d.lng).forEach(driver => {
      const latLng = [parseFloat(driver.lat), parseFloat(driver.lng)];
      bounds.push(latLng);
      const isTrip = driver.tripStatus === 'On Trip';
      L.marker(latLng, {
        icon: createMarkerIcon(isTrip ? '#0288D1' : '#F57C00', `Rider: ${driver.name.split(' ')[0]}`)
      }).addTo(markerLayer);
    });

    // c. Render Active Customers & Routing Lines
    const activeOrders = allOrders.filter(o => o.status && o.status !== 'Order Delivered' && o.status !== 'Refunded');
    activeOrders.forEach(order => {
      const restLat = parseFloat(order.restaurant?.lat) || 37.7749;
      const restLng = parseFloat(order.restaurant?.lng) || -122.4194;
      const custLat = parseFloat(order.dropoffLat) || (restLat - 0.015);
      const custLng = parseFloat(order.dropoffLng) || (restLng + 0.015);
      const custLatLng = [custLat, custLng];
      const restLatLng = [restLat, restLng];

      bounds.push(custLatLng);

      // Customer Pin
      const nameLabel = order.userEmail ? order.userEmail.split('@')[0] : 'Guest';
      L.marker(custLatLng, {
        icon: createMarkerIcon('#D32F2F', `Cust: ${nameLabel}`)
      }).addTo(markerLayer);

      // Routing Paths
      const assignedRider = liveDrivers.find(d => d.name === order.rider?.name);
      if (assignedRider && assignedRider.lat && assignedRider.lng) {
        const riderLatLng = [parseFloat(assignedRider.lat), parseFloat(assignedRider.lng)];
        
        // Restaurant to Rider (Green dotted)
        L.polyline([restLatLng, riderLatLng], {
          color: '#06C167',
          weight: 2,
          dashArray: '4, 4',
          opacity: 0.6
        }).addTo(markerLayer);

        // Rider to Customer (Blue solid line)
        L.polyline([riderLatLng, custLatLng], {
          color: '#0288D1',
          weight: 2.5,
          opacity: 0.8
        }).addTo(markerLayer);
      } else {
        // Direct default path
        L.polyline([restLatLng, custLatLng], {
          color: '#888888',
          weight: 1.5,
          dashArray: '2, 5',
          opacity: 0.5
        }).addTo(markerLayer);
      }
    });

    // Auto zoom map to fit all markers if present
    if (bounds.length > 0) {
      try {
        mapInstance.fitBounds(bounds, { padding: [30, 30] });
      } catch (err) {
        console.warn("Fitbounds error:", err);
      }
    }

  }, [mapInstance, markerLayer, liveDrivers, restaurants, allOrders]);

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

        {/* Live Leaflet Dispatch Map */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            <span>Live Dispatch Map (God-View)</span>
            <span style={{ fontSize: '11px', color: '#06C167', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#06C167', borderRadius: '50%', display: 'inline-block' }} />
              Live Map Sync
            </span>
          </div>

          <div style={{ flex: 1, position: 'relative', minHeight: '260px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
            {/* Target Leaflet container */}
            <div id="live-dispatch-leaflet-map" style={{ width: '100%', height: '100%', minHeight: '260px', backgroundColor: '#1E1E1E' }} />

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
                <span style={{ color: '#DDD' }}>User</span>
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
    </div>
  );
}
