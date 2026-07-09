import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { TrendingUp, Users, ShoppingBag, Store, Navigation, MapPin, Bike } from 'lucide-react';

export default function Overview() {
  const [metrics, setMetrics] = useState({
    profit: 0,
    ordersCount: 0,
    restaurantsCount: 0,
    usersCount: 5
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [liveDrivers, setLiveDrivers] = useState([]);

  useEffect(() => {
    // 1. Fetch Orders & Profit
    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
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

    // 2. Fetch Restaurants Count
    const restRef = ref(database, 'restaurants');
    const unsubscribeRest = onValue(restRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const count = Object.keys(data).length;
        setMetrics(prev => ({
          ...prev,
          restaurantsCount: count
        }));
      }
    });

    // 3. Fetch Live Drivers & Coordinates
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

  // Helper to map coordinates (latitude/longitude) to SVG canvas X/Y coordinates
  // Center is San Francisco-ish: lat 37.7749, lng -122.4194
  const mapCoordinates = (lat, lng) => {
    if (!lat || !lng) return { x: 150, y: 100 };
    
    // Scale mapping for visual canvas representation (300x200 area)
    const latCenter = 37.7749;
    const lngCenter = -122.4194;
    const latRange = 0.05;
    const lngRange = 0.05;

    const x = 150 + ((lng - lngCenter) / lngRange) * 120;
    const y = 100 - ((lat - latCenter) / latRange) * 80;

    // Boundary constraints
    return {
      x: Math.max(15, Math.min(285, x)),
      y: Math.max(15, Math.min(185, y))
    };
  };

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
          <div className="chart-container" style={{ height: '220px' }}>
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

        {/* COO God-View Live Dispatch Operations Map */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
            <span>Live Dispatch Map (God-View)</span>
            <span style={{ fontSize: '11px', color: '#06C167', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#06C167', borderRadius: '50%', display: 'inline-block', animation: 'spin 2s linear infinite' }} />
              Real-time Sync
            </span>
          </div>

          <div style={{ flex: 1, backgroundColor: '#1E1E1E', borderRadius: '8px', border: '1px solid #333', padding: '8px', position: 'relative', minHeight: '220px', overflow: 'hidden' }}>
            {/* SVG Grid representation of the city area */}
            <svg width="100%" height="100%" viewBox="0 0 300 200" style={{ backgroundColor: '#1E1E1E' }}>
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#2D2D2D" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Simulated Roads/Streets */}
              <line x1="10" y1="50" x2="290" y2="50" stroke="#333" strokeWidth="4" strokeLinecap="round" />
              <line x1="50" y1="10" x2="50" y2="190" stroke="#333" strokeWidth="4" strokeLinecap="round" />
              <line x1="150" y1="10" x2="150" y2="190" stroke="#333" strokeWidth="4" strokeLinecap="round" />
              <line x1="10" y1="150" x2="290" y2="150" stroke="#333" strokeWidth="4" strokeLinecap="round" />

              {/* Main Restaurant Hub Marker */}
              <g transform="translate(150, 100)">
                <circle r="8" fill="rgba(6, 193, 103, 0.2)" />
                <circle r="4" fill="#06C167" />
                <text y="-10" textAnchor="middle" fill="#06C167" fontSize="8" fontWeight="bold">Central Hub</text>
              </g>

              {/* Active Drivers Live Coordinate Pins */}
              {liveDrivers.filter(d => d.lat && d.lng).map((driver) => {
                const pos = mapCoordinates(driver.lat, driver.lng);
                const isTrip = driver.tripStatus === 'On Trip';
                return (
                  <g key={driver.id} transform={`translate(${pos.x}, ${pos.y})`}>
                    {/* Pulsing beacon if moving */}
                    {isTrip && (
                      <circle r="12" fill="rgba(2, 136, 209, 0.15)">
                        <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle r="6" fill={isTrip ? '#0288D1' : '#F57C00'} border="1px solid #FFF" />
                    <circle r="3" fill="#FFF" />
                    <text y="-8" textAnchor="middle" fill="#FFF" fontSize="7" style={{ backgroundColor: '#000', padding: '1px' }}>
                      {driver.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Quick Map Legend */}
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '6px 10px', borderRadius: '4px', display: 'flex', gap: '12px', fontSize: '10px', border: '1px solid #444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0288D1' }} />
                <span style={{ color: '#AAA' }}>On Trip</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F57C00' }} />
                <span style={{ color: '#AAA' }}>Idle</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06C167' }} />
                <span style={{ color: '#AAA' }}>Restaurant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card">
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
