import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { TrendingUp, Users, ShoppingBag, DollarSign, Calendar, RefreshCw, FileSpreadsheet, Percent, CreditCard } from 'lucide-react';
import { exportToCSV } from '../utils/CSVExporter';

export default function FinanceManager() {
  const [orders, setOrders] = useState([]);
  const [filterRange, setFilterRange] = useState('7days'); // '7days', '30days', 'all'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'payouts'
  const [restaurants, setRestaurants] = useState([]);
  const [payouts, setPayouts] = useState({});

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setOrders(list);
      }
    });

    const restRef = ref(database, 'restaurants');
    const unsubscribeRest = onValue(restRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setRestaurants(list);
      }
    });

    const payoutsRef = ref(database, 'payouts');
    const unsubscribePayouts = onValue(payoutsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPayouts(data);
      } else {
        setPayouts({});
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeRest();
      unsubscribePayouts();
    };
  }, []);

  const getFilteredOrders = () => {
    const now = new Date();
    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (filterRange === '7days') return diffDays <= 7;
      if (filterRange === '30days') return diffDays <= 30;
      return true;
    });
  };

  const filteredOrders = getFilteredOrders();

  const totalSales = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalDriverCommission = filteredOrders.reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
  const totalRestaurantShare = filteredOrders.reduce((acc, o) => acc + ((o.subtotal || 0) * 0.85), 0);
  const totalPlatformCut = filteredOrders.reduce((acc, o) => acc + ((o.subtotal || 0) * 0.15), 0);

  const getRestaurantLedger = () => {
    const ledger = {};
    restaurants.forEach(r => {
      ledger[r.id] = {
        id: r.id,
        name: r.name,
        category: r.category || 'Food',
        grossSales: 0,
        platformCommission: 0,
        netEarnings: 0,
        disbursed: payouts[r.id]?.disbursedAmount || 0,
        lastPayoutDate: payouts[r.id]?.lastPayoutDate 
          ? new Date(payouts[r.id].lastPayoutDate).toLocaleDateString() 
          : 'Never'
      };
    });

    orders.forEach(order => {
      if (order.status !== 'Order Delivered' || !order.restaurantId) return;
      const restId = order.restaurantId;
      
      if (!ledger[restId]) {
        ledger[restId] = {
          id: restId,
          name: order.restaurantName || 'Unknown Restaurant',
          category: 'Food',
          grossSales: 0,
          platformCommission: 0,
          netEarnings: 0,
          disbursed: payouts[restId]?.disbursedAmount || 0,
          lastPayoutDate: payouts[restId]?.lastPayoutDate 
            ? new Date(payouts[restId].lastPayoutDate).toLocaleDateString() 
            : 'Never'
        };
      }

      const subtotal = order.subtotal || 0;
      ledger[restId].grossSales += subtotal;
      ledger[restId].platformCommission += subtotal * 0.15;
      ledger[restId].netEarnings += subtotal * 0.85;
    });

    return Object.values(ledger).map(entry => {
      const outstanding = entry.netEarnings - entry.disbursed;
      return {
        ...entry,
        outstanding: outstanding > 0 ? outstanding : 0
      };
    });
  };

  const restaurantLedger = getRestaurantLedger();

  const handleExportTransactions = () => {
    const headers = ["Order ID", "Date", "Gross Total", "Restaurant Share (85%)", "Driver Payout (100%)", "Platform Profit (15%)", "Status"];
    const rows = filteredOrders.map(order => {
      const restShare = (order.subtotal || 0) * 0.85;
      const platformCut = (order.subtotal || 0) * 0.15;
      return [
        order.id,
        new Date(order.createdAt || Date.now()).toLocaleDateString(),
        `#${(order.total || 0).toFixed(2)}`,
        `#${restShare.toFixed(2)}`,
        `#${(order.deliveryFee || 0).toFixed(2)}`,
        `#${platformCut.toFixed(2)}`,
        order.status
      ];
    });
    exportToCSV(`chow_transactions_${filterRange}.csv`, headers, rows);
  };

  const handleExportPayouts = () => {
    const headers = ["Merchant ID", "Restaurant Name", "Category", "Total Sales", "Platform Commission (15%)", "Total Net Earnings (85%)", "Total Disbursed", "Outstanding Balance", "Last Payout Date"];
    const rows = restaurantLedger.map(r => [
      r.id,
      r.name,
      r.category,
      `#${r.grossSales.toFixed(2)}`,
      `#${r.platformCommission.toFixed(2)}`,
      `#${r.netEarnings.toFixed(2)}`,
      `#${r.disbursed.toFixed(2)}`,
      `#${r.outstanding.toFixed(2)}`,
      r.lastPayoutDate
    ]);
    exportToCSV(`chow_payouts_ledger.csv`, headers, rows);
  };

  const handleDisbursePayout = async (restId, amount) => {
    if (window.confirm(`Are you sure you want to mark #${amount.toFixed(2)} as disbursed to this restaurant?`)) {
      try {
        const payoutRef = ref(database, `payouts/${restId}`);
        await set(payoutRef, {
          disbursedAmount: (payouts[restId]?.disbursedAmount || 0) + amount,
          lastPayoutDate: new Date().toISOString(),
          status: 'Disbursed'
        });
        alert("Payout processed successfully!");
      } catch (err) {
        alert("Failed to process payout: " + err.message);
      }
    }
  };

  // Group financial metrics by date for the graph representation
  const getDailyMetrics = () => {
    const dailyMap = {};
    
    filteredOrders.forEach(order => {
      if (!order.createdAt) return;
      const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          date: dateStr,
          sales: 0,
          driver: 0,
          restaurant: 0,
          platform: 0,
          count: 0
        };
      }
      
      dailyMap[dateStr].sales += order.total || 0;
      dailyMap[dateStr].driver += order.deliveryFee || 0;
      dailyMap[dateStr].restaurant += (order.subtotal || 0) * 0.85;
      dailyMap[dateStr].platform += (order.subtotal || 0) * 0.15;
      dailyMap[dateStr].count += 1;
    });

    const result = Object.values(dailyMap);
    
    // If empty fallback data to show empty state graph grid cleanly
    if (result.length === 0) {
      return Array.from({ length: 7 }).map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - idx));
        return {
          date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          sales: 0,
          driver: 0,
          restaurant: 0,
          platform: 0,
          count: 0
        };
      });
    }
    
    return result;
  };

  const dailyMetrics = getDailyMetrics();

  // SVG dimensions & padding configurations
  const width = 600;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute maximum value for scaling coordinate offsets
  const maxVal = Math.max(...dailyMetrics.map(d => d.sales), 50);

  // Generate SVG coordinates for each series
  const points = dailyMetrics.map((day, idx) => {
    const x = paddingLeft + (idx / Math.max(1, dailyMetrics.length - 1)) * chartWidth;
    const ySales = paddingTop + chartHeight - (day.sales / maxVal) * chartHeight;
    const yDriver = paddingTop + chartHeight - (day.driver / maxVal) * chartHeight;
    const yRest = paddingTop + chartHeight - (day.restaurant / maxVal) * chartHeight;
    const yPlatform = paddingTop + chartHeight - (day.platform / maxVal) * chartHeight;
    
    return {
      x,
      ySales,
      yDriver,
      yRest,
      yPlatform,
      data: day
    };
  });

  // Polyline generator helper
  const getPolylinePath = (yProp) => {
    return points.map(p => `${p.x},${p[yProp]}`).join(' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Tab Switcher */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <button 
          className={`action-btn-small ${activeTab === 'analytics' ? 'action-btn-primary' : ''}`}
          style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} />
          Financial Analytics
        </button>
        <button 
          className={`action-btn-small ${activeTab === 'payouts' ? 'action-btn-primary' : ''}`}
          style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setActiveTab('payouts')}
        >
          <CreditCard size={16} />
          Merchant Payout Split Ledger
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <>
          {/* Filters and Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#888' }}>Real-time platform fee split and delivery margins analytics</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`action-btn-small ${filterRange === '7days' ? 'action-btn-primary' : ''}`}
                style={{ padding: '6px 12px' }}
                onClick={() => setFilterRange('7days')}
              >
                Past 7 Days
              </button>
              <button 
                className={`action-btn-small ${filterRange === '30days' ? 'action-btn-primary' : ''}`}
                style={{ padding: '6px 12px' }}
                onClick={() => setFilterRange('30days')}
              >
                Past 30 Days
              </button>
              <button 
                className={`action-btn-small ${filterRange === 'all' ? 'action-btn-primary' : ''}`}
                style={{ padding: '6px 12px' }}
                onClick={() => setFilterRange('all')}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Financial Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card" style={{ borderLeft: '4px solid #06C167' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#E8F5E9' }}>
                <DollarSign size={24} color="#06C167" />
              </div>
              <div className="metric-details">
                <h4>Total Gross Sales</h4>
                <p>#{totalSales.toFixed(2)}</p>
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #F57C00' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#FFF3E0' }}>
                <DollarSign size={24} color="#F57C00" />
              </div>
              <div className="metric-details">
                <h4>Restaurant Payouts (85%)</h4>
                <p>#{totalRestaurantShare.toFixed(2)}</p>
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #0288D1' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#E1F5FE' }}>
                <DollarSign size={24} color="#0288D1" />
              </div>
              <div className="metric-details">
                <h4>Driver Commissions</h4>
                <p>#{totalDriverCommission.toFixed(2)}</p>
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #9C27B0' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#F3E5F5' }}>
                <DollarSign size={24} color="#9C27B0" />
              </div>
              <div className="metric-details">
                <h4>Platform Cut (15%)</h4>
                <p>#{totalPlatformCut.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Main Graph Card */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Financial Outflow Trends</span>
              <div style={{ display: 'flex', gap: '15px', fontSize: '11px', fontWeight: 'bold' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#06C167' }} />
                  Gross Sales
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F57C00' }} />
                  Restaurant share
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0288D1' }} />
                  Driver Commission
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#9C27B0' }} />
                  Platform Cut
                </span>
              </div>
            </div>

            {/* SVG Finance Chart Container */}
            <div style={{ position: 'relative', width: '100%', height: `${height}px`, marginTop: '15px' }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                
                {/* Grid Line Guides */}
                {Array.from({ length: 5 }).map((_, idx) => {
                  const yVal = paddingTop + (idx / 4) * chartHeight;
                  const gridLabel = (maxVal - (idx / 4) * maxVal).toFixed(0);
                  return (
                    <g key={idx}>
                      <line x1={paddingLeft} y1={yVal} x2={width - paddingRight} y2={yVal} stroke="#2D2D2D" strokeWidth="0.5" strokeDasharray="3,3" />
                      <text x={paddingLeft - 8} y={yVal + 3} textAnchor="end" fill="#888" fontSize="9" fontWeight="bold">#{gridLabel}</text>
                    </g>
                  );
                })}

                {/* X Axis Date labels */}
                {points.map((p, idx) => {
                  const skip = Math.max(1, Math.round(points.length / 7));
                  if (idx % skip !== 0 && idx !== points.length - 1) return null;
                  return (
                    <text key={idx} x={p.x} y={height - 8} textAnchor="middle" fill="#888" fontSize="9" fontWeight="bold">
                      {p.data.date}
                    </text>
                  );
                })}

                {/* Draw Line Series */}
                <polyline fill="none" stroke="#06C167" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={getPolylinePath('ySales')} />
                <polyline fill="none" stroke="#F57C00" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" points={getPolylinePath('yRest')} />
                <polyline fill="none" stroke="#0288D1" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" points={getPolylinePath('yDriver')} />
                <polyline fill="none" stroke="#9C27B0" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" points={getPolylinePath('yPlatform')} />

                {/* Draw Interactive Hover Circles */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle 
                      cx={p.x} 
                      cy={p.ySales} 
                      r={hoveredPoint === idx ? 6 : 3.5} 
                      fill="#06C167" 
                      stroke="#1E1E1E" 
                      strokeWidth="1.5"
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    />
                  </g>
                ))}
              </svg>

              {/* Interactive Tooltip Overlay */}
              {hoveredPoint !== null && points[hoveredPoint] && (
                <div style={{
                  position: 'absolute',
                  top: `${points[hoveredPoint].ySales - 90 < 10 ? 10 : points[hoveredPoint].ySales - 90}px`,
                  left: `${points[hoveredPoint].x + 10}px`,
                  backgroundColor: 'rgba(26, 26, 26, 0.95)',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '11px',
                  color: '#FFF',
                  zIndex: 100,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                  minWidth: '150px'
                }}>
                  <div style={{ fontWeight: 'bold', borderBottom: '1px solid #444', paddingBottom: '4px', marginBottom: '6px', color: '#06C167' }}>
                    {points[hoveredPoint].data.date}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span style={{ color: '#aaa' }}>Gross Sales:</span>
                    <span style={{ fontWeight: 'bold' }}>#{points[hoveredPoint].data.sales.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span style={{ color: '#aaa' }}>Restaurant Share:</span>
                    <span style={{ fontWeight: 'bold', color: '#F57C00' }}>#{points[hoveredPoint].data.restaurant.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span style={{ color: '#aaa' }}>Driver Comm:</span>
                    <span style={{ fontWeight: 'bold', color: '#0288D1' }}>#{points[hoveredPoint].data.driver.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                    <span style={{ color: '#aaa' }}>Platform Cut:</span>
                    <span style={{ fontWeight: 'bold', color: '#9C27B0' }}>#{points[hoveredPoint].data.platform.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transactional Details list */}
          <div className="card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Order Payout Transaction Log</span>
              <button 
                className="action-btn-small" 
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={handleExportTransactions}
              >
                <FileSpreadsheet size={14} />
                Export CSV Report
              </button>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Gross Total</th>
                    <th>Restaurant Share (85%)</th>
                    <th>Driver Payout (100%)</th>
                    <th>Platform Profit (15%)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                      const restShare = (order.subtotal || 0) * 0.85;
                      const platformCut = (order.subtotal || 0) * 0.15;
                      return (
                        <tr key={order.id}>
                          <td><code style={{ fontSize: '12px' }}>{order.id.slice(0, 10)}...</code></td>
                          <td>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 'bold', color: '#06C167' }}>#{(order.total || 0).toFixed(2)}</td>
                          <td style={{ color: '#F57C00', fontWeight: '500' }}>#{restShare.toFixed(2)}</td>
                          <td style={{ color: '#0288D1', fontWeight: '500' }}>#{(order.deliveryFee || 0).toFixed(2)}</td>
                          <td style={{ color: '#9C27B0', fontWeight: '500' }}>#{platformCut.toFixed(2)}</td>
                          <td>
                            <span className={`status-badge ${order.status === 'Order Delivered' ? 'delivered' : 'preparing'}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                        No transactions captured in this timeframe.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* MERCHANT PAYOUTS TAB (WOOCOMMERCE SPLIT LEDGER) */
        <div className="card" style={{ padding: '20px' }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <span>Multi-Vendor Split Ledger & Commissions</span>
            <button 
              className="action-btn-small" 
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleExportPayouts}
            >
              <FileSpreadsheet size={14} />
              Export Ledger CSV
            </button>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Restaurant Name</th>
                  <th>Category</th>
                  <th>Total Sales</th>
                  <th>Platform Cut (15%)</th>
                  <th>Net Earnings (85%)</th>
                  <th>Total Disbursed</th>
                  <th>Outstanding Balance</th>
                  <th>Last Payout</th>
                  <th>Payout Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurantLedger.length > 0 ? (
                  restaurantLedger.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 'bold', color: '#FFF' }}>{r.name}</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#333', color: '#FFF', borderColor: 'transparent' }}>
                          {r.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: '500' }}>#{r.grossSales.toFixed(2)}</td>
                      <td style={{ color: '#9C27B0' }}>#{r.platformCommission.toFixed(2)}</td>
                      <td style={{ color: '#06C167', fontWeight: 'bold' }}>#{r.netEarnings.toFixed(2)}</td>
                      <td style={{ color: '#888' }}>#{r.disbursed.toFixed(2)}</td>
                      <td style={{ color: r.outstanding > 0 ? '#F57C00' : '#888', fontWeight: 'bold' }}>
                        #{r.outstanding.toFixed(2)}
                      </td>
                      <td style={{ fontSize: '11px', color: '#aaa' }}>{r.lastPayoutDate}</td>
                      <td>
                        {r.outstanding > 0 ? (
                          <button 
                            className="action-btn-small action-btn-primary" 
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px' }}
                            onClick={() => handleDisbursePayout(r.id, r.outstanding)}
                          >
                            Disburse Payout
                          </button>
                        ) : (
                          <span style={{ color: '#06C167', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            Settled ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                      No active store records to display in the ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
