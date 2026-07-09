import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { TrendingUp, Users, ShoppingBag, Store } from 'lucide-react';

export default function Overview() {
  const [metrics, setMetrics] = useState({
    profit: 0,
    ordersCount: 0,
    restaurantsCount: 0,
    usersCount: 5 // Default baseline mock users
  });

  const [recentOrders, setRecentOrders] = useState([]);

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
        
        // Sort by date newest first
        orderList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentOrders(orderList.slice(0, 5));

        // Calculate metrics
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
      } else {
        // Baseline if DB is empty but we have local mock fallbacks
        setMetrics(prev => ({
          ...prev,
          restaurantsCount: 4
        }));
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeRest();
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
            <h4>Registered Users</h4>
            <p>{metrics.usersCount + metrics.ordersCount}</p> {/* Dynamic growth mock */}
          </div>
        </div>
      </div>

      <div className="charts-row">
        {/* Sales Chart Card */}
        <div className="card">
          <div className="card-title">Weekly Revenue Breakdown</div>
          <div className="chart-container">
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

        {/* Popular Category Breakdown */}
        <div className="card">
          <div className="card-title">Popular Items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>🍕 Pizza Margherita</span>
              <span style={{ fontWeight: 'bold' }}>42%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>🍔 Craft Cheeseburger</span>
              <span style={{ fontWeight: 'bold' }}>28%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>🍣 Sushi Platter</span>
              <span style={{ fontWeight: 'bold' }}>20%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>🥗 Quinoa Power Bowl</span>
              <span style={{ fontWeight: 'bold' }}>10%</span>
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
