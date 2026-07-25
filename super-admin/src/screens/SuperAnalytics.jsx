import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Settings, 
  Users, 
  MapPin, 
  Cpu, 
  ShieldAlert,
  Zap,
  CheckCircle,
  Clock,
  ShoppingBag,
  Percent,
  Layers,
  Utensils,
  FileSpreadsheet
} from 'lucide-react';
import { exportToCSV } from '../utils/CSVExporter';

export default function SuperAnalytics() {
  const [activeSubTab, setActiveSubTab] = useState('ceo'); // 'ceo', 'data', 'fraud', 'pos', 'woo'
  const [orders, setOrders] = useState([]);
  const [vouchers, setVouchers] = useState([]);

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setOrders(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      }
    });

    const vouchersRef = ref(database, 'vouchers');
    const unsubscribeVouchers = onValue(vouchersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVouchers(Object.keys(data).map(key => ({ id: key, ...data[key] })));
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeVouchers();
    };
  }, []);

  const deliveredOrders = orders.filter(o => o.status === 'Order Delivered');
  const grossSales = deliveredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const totalSubtotal = deliveredOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0);
  const netRevenue = totalSubtotal * 0.15 + deliveredOrders.reduce((acc, o) => acc + (o.serviceFee || 0), 0);
  const couponDiscount = deliveredOrders.reduce((acc, o) => acc + (o.discount || 0), 0);
  const totalShipping = deliveredOrders.reduce((acc, o) => acc + (o.deliveryFee || 0), 0);

  const getTopSellingDishes = () => {
    const dishCount = {};
    deliveredOrders.forEach(o => {
      if (o.dishes) {
        const list = Array.isArray(o.dishes) ? o.dishes : Object.values(o.dishes);
        list.forEach(d => {
          if (!d) return;
          const key = d.name || d.title || 'Unknown Dish';
          if (!dishCount[key]) {
            dishCount[key] = {
              name: key,
              quantity: 0,
              revenue: 0,
              image: d.image || d.imgUrl || ''
            };
          }
          const qty = parseInt(d.quantity || d.qty || 1);
          dishCount[key].quantity += qty;
          dishCount[key].revenue += (parseFloat(d.price) || 0) * qty;
        });
      }
    });
    return Object.values(dishCount).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  };
  const topSellingDishes = getTopSellingDishes();

  const getCategoryPerformance = () => {
    const categorySales = {};
    deliveredOrders.forEach(o => {
      const cat = o.restaurantCategory || 'Food';
      if (!categorySales[cat]) {
        categorySales[cat] = {
          category: cat,
          sales: 0,
          ordersCount: 0
        };
      }
      categorySales[cat].sales += o.total || 0;
      categorySales[cat].ordersCount += 1;
    });
    return Object.values(categorySales).sort((a, b) => b.sales - a.sales);
  };
  const categoryPerformance = getCategoryPerformance();

  const getCouponPerformance = () => {
    const coupons = {};
    deliveredOrders.forEach(o => {
      if (o.voucherCode || o.promoCode) {
        const code = o.voucherCode || o.promoCode;
        if (!coupons[code]) {
          coupons[code] = {
            code: code,
            redemptions: 0,
            discountApplied: 0,
            revenueGenerated: 0
          };
        }
        coupons[code].redemptions += 1;
        coupons[code].discountApplied += o.discount || 0;
        coupons[code].revenueGenerated += o.total || 0;
      }
    });
    return Object.values(coupons).sort((a, b) => b.redemptions - a.redemptions);
  };
  const couponPerformance = getCouponPerformance();

  const handleExportTopProducts = () => {
    const headers = ["Product Name", "Quantity Sold", "Total Revenue Generated"];
    const rows = topSellingDishes.map(d => [d.name, d.quantity, `#${d.revenue.toFixed(2)}`]);
    exportToCSV("chow_top_selling_products.csv", headers, rows);
  };

  const handleExportCategorySales = () => {
    const headers = ["Category Name", "Total Orders", "Gross Sales Contribution"];
    const rows = categoryPerformance.map(c => [c.category, c.ordersCount, `#${c.sales.toFixed(2)}`]);
    exportToCSV("chow_category_sales.csv", headers, rows);
  };

  const handleExportCoupons = () => {
    const headers = ["Promo Code", "Total Redemptions", "Total Discount Value", "Total Sales Volume Generated"];
    const rows = couponPerformance.map(c => [c.code, c.redemptions, `#${c.discountApplied.toFixed(2)}`, `#${c.revenueGenerated.toFixed(2)}`]);
    exportToCSV("chow_coupons_performance.csv", headers, rows);
  };
  
  // Mock data for POS configuration
  const [posConfig, setPosConfig] = useState({
    toast: { connected: true, apiKey: 'pk_toast_live_948f2h83f' },
    clover: { connected: false, apiKey: '' },
    square: { connected: true, apiKey: 'pk_sq_live_038f2923h8' }
  });

  const togglePosConnection = (platform) => {
    setPosConfig(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        connected: !prev[platform].connected,
        apiKey: !prev[platform].connected ? `pk_${platform}_live_${Math.random().toString(36).substring(7)}` : ''
      }
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub-panel navigation buttons */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <button 
          className={`action-btn-small ${activeSubTab === 'ceo' ? 'action-btn-primary' : ''}`}
          style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
          onClick={() => setActiveSubTab('ceo')}
        >
          👑 CEO Economics
        </button>
        <button 
          className={`action-btn-small ${activeSubTab === 'data' ? 'action-btn-primary' : ''}`}
          style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
          onClick={() => setActiveSubTab('data')}
        >
          📊 Logistics Telemetry (DA)
        </button>
        <button 
          className={`action-btn-small ${activeSubTab === 'fraud' ? 'action-btn-primary' : ''}`}
          style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
          onClick={() => setActiveSubTab('fraud')}
        >
          🚨 Anti-Fraud Desk (BA)
        </button>
        <button 
          className={`action-btn-small ${activeSubTab === 'pos' ? 'action-btn-primary' : ''}`}
          style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
          onClick={() => setActiveSubTab('pos')}
        >
          🤝 POS & B2B (BizDev)
        </button>
        <button 
          className={`action-btn-small ${activeSubTab === 'woo' ? 'action-btn-primary' : ''}`}
          style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
          onClick={() => setActiveSubTab('woo')}
        >
          🛍️ WooCommerce Analytics
        </button>
      </div>

      {/* 1. CEO UNIT ECONOMICS SUB-PANEL */}
      {activeSubTab === 'ceo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Metrics grid */}
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="metric-card" style={{ borderLeft: '4px solid #06C167' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#E8F5E9' }}>
                <TrendingUp size={20} color="#06C167" />
              </div>
              <div className="metric-details">
                <h4>GMV Run Rate</h4>
                <p>$1.24M / yr</p>
                <span style={{ fontSize: '11px', color: '#06C167' }}>+18.4% MoM growth</span>
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #0288D1' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#E1F5FE' }}>
                <Users size={20} color="#0288D1" />
              </div>
              <div className="metric-details">
                <h4>LTV / CAC Ratio</h4>
                <p>9.9x Yield</p>
                <span style={{ fontSize: '11px', color: '#0288D1' }}>LTV: $148.50 | CAC: $15.00</span>
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #F57C00' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#FFF3E0' }}>
                <DollarSign size={20} color="#F57C00" />
              </div>
              <div className="metric-details">
                <h4>Delivery Arbitrage</h4>
                <p>+12.4% Margin</p>
                <span style={{ fontSize: '11px', color: '#F57C00' }}>Cust Fees &gt; Driver Payouts</span>
              </div>
            </div>
          </div>

          {/* Economics breakdown chart */}
          <div className="card">
            <div className="card-title">Chow Pass Subscription Funnel & Retention</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Chow Pass conversion rate (registered users to premium)</span>
                  <span style={{ fontWeight: 'bold' }}>28.5%</span>
                </div>
                <div style={{ background: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#06C167', width: '28.5%', height: '100%' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Month 3 Cohort Retention (Monthly subscribers)</span>
                  <span style={{ fontWeight: 'bold' }}>82.1%</span>
                </div>
                <div style={{ background: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#0288D1', width: '82.1%', height: '100%' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>Yearly Pass Autorenewal rate</span>
                  <span style={{ fontWeight: 'bold' }}>94.7%</span>
                </div>
                <div style={{ background: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#9C27B0', width: '94.7%', height: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DATA ANALYST LOGISTICS SUB-PANEL */}
      {activeSubTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* SLA Delays Heatmap table */}
            <div className="card">
              <div className="card-title">Delivery SLA Delay Heatmap (Avg Min)</div>
              <div className="table-responsive" style={{ marginTop: '10px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Delivery Zone</th>
                      <th>Avg Transit Delay</th>
                      <th>Heat Indicator</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>📍 Mission District</td>
                      <td>12.4 mins</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#FFEBEE', color: '#D32F2F', borderColor: 'transparent' }}>Critical Delay</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>📍 Financial District</td>
                      <td>3.2 mins</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#E8F5E9', color: '#388E3C', borderColor: 'transparent' }}>Optimal</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>📍 SoMa</td>
                      <td>5.8 mins</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#FFF3E0', color: '#F57C00', borderColor: 'transparent' }}>Warning</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>📍 Sunset District</td>
                      <td>8.4 mins</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#FFF3E0', color: '#F57C00', borderColor: 'transparent' }}>Warning</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Predictive Demand Forecasting */}
            <div className="card">
              <div className="card-title">Projected Regional Demand Surge Forecast</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={20} color="#F57C00" />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF' }}>Rain Storm Surge projected (Friday 6 PM)</h4>
                    <p style={{ fontSize: '11.5px', color: '#999' }}>Riders needed: +35% over baseline. Surge factor: 1.5x</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={20} color="#0288D1" />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF' }}>Sunday Brunch surge projected (11 AM)</h4>
                    <p style={{ fontSize: '11.5px', color: '#999' }}>Riders needed: +20% over baseline. Surge factor: 1.2x</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={20} color="#06C167" />
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF' }}>Holiday Season baseline shift</h4>
                    <p style={{ fontSize: '11.5px', color: '#999' }}>Sustained order volume rise of 18.2% across grocery segments.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 3. BUSINESS ANALYST ANTI-FRAUD SUB-PANEL */}
      {activeSubTab === 'fraud' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card">
            <div className="card-title">Anti-Fraud fingerprint desk flags</div>
            <div className="table-responsive" style={{ marginTop: '10px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Flagged Account</th>
                    <th>Audit Reason</th>
                    <th>Anomaly Code</th>
                    <th>Risk Score</th>
                    <th>Security Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>👤 user_401@example.com</td>
                    <td>Duplicate IP/Device fingerprint requesting checkout refund</td>
                    <td><code style={{ fontSize: '12px' }}>ANOM_REFUND_IP</code></td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: '#FFEBEE', color: '#D32F2F', borderColor: 'transparent', fontWeight: 'bold' }}>94% High</span>
                    </td>
                    <td>
                      <button className="action-btn-small" style={{ backgroundColor: '#D32F2F', borderColor: '#D32F2F', color: '#FFF' }}>Suspend User</button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>👤 user_891@example.com</td>
                    <td>Refund success frequency anomalous (4 claims past 7 days)</td>
                    <td><code style={{ fontSize: '12px' }}>ANOM_REFUND_FREQ</code></td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: '#FFF3E0', color: '#F57C00', borderColor: 'transparent', fontWeight: 'bold' }}>76% Med</span>
                    </td>
                    <td>
                      <button className="action-btn-small" style={{ backgroundColor: '#F57C00', borderColor: '#F57C00', color: '#FFF' }}>Flag Profile</button>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>👤 guest_661</td>
                    <td>Anomalous credit card bank switch matching blacklisted patterns</td>
                    <td><code style={{ fontSize: '12px' }}>ANOM_CARD_BIN</code></td>
                    <td>
                      <span className="status-badge" style={{ backgroundColor: '#FFEBEE', color: '#D32F2F', borderColor: 'transparent', fontWeight: 'bold' }}>88% High</span>
                    </td>
                    <td>
                      <button className="action-btn-small" style={{ backgroundColor: '#D32F2F', borderColor: '#D32F2F', color: '#FFF' }}>Suspend User</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 4. BUSINESS DEVELOPER POS & B2B SUB-PANEL */}
      {activeSubTab === 'pos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="charts-row" style={{ gridTemplateColumns: '1fr 1.2fr' }}>
            {/* POS Integration Sandbox */}
            <div className="card">
              <div className="card-title">Merchant POS Integration Gateway</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                {Object.keys(posConfig).map((platform) => {
                  const plat = posConfig[platform];
                  return (
                    <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#252525', borderRadius: '6px', border: '1px solid #333' }}>
                      <div>
                        <h4 style={{ textTransform: 'capitalize', fontSize: '13px', fontWeight: 'bold', color: '#FFF' }}>{platform} Integrator</h4>
                        {plat.connected ? (
                          <code style={{ fontSize: '11px', color: '#06C167' }}>Active: {plat.apiKey.slice(0, 15)}...</code>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#888' }}>Not connected</span>
                        )}
                      </div>
                      <button 
                        className={`action-btn-small ${plat.connected ? 'action-btn-primary' : ''}`}
                        onClick={() => togglePosConnection(platform)}
                        style={{
                          backgroundColor: plat.connected ? '#D32F2F' : '#06C167',
                          borderColor: plat.connected ? '#D32F2F' : '#06C167',
                          color: '#FFF'
                        }}
                      >
                        {plat.connected ? 'Disconnect' : 'Connect API'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Corporate B2B Account Listing */}
            <div className="card">
              <div className="card-title">Corporate B2B Invoicing Accounts</div>
              <div className="table-responsive" style={{ marginTop: '10px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Company Client</th>
                      <th>Credit Limit</th>
                      <th>Weekly Spend</th>
                      <th>Invoicing Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>🏢 Google Inc. SF</td>
                      <td>$10,000.00</td>
                      <td>$3,842.10</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#E8F5E9', color: '#388E3C', borderColor: 'transparent' }}>Invoiced & Paid</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>🏢 Salesforce Tower</td>
                      <td>$15,000.00</td>
                      <td>$7,124.90</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#FFF3E0', color: '#F57C00', borderColor: 'transparent' }}>Invoice Pending</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>🏢 Uber HQ SF</td>
                      <td>$5,000.00</td>
                      <td>$4,120.00</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#E8F5E9', color: '#388E3C', borderColor: 'transparent' }}>Invoiced & Paid</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 5. WOOCOMMERCE ANALYTICS SUB-PANEL */}
      {activeSubTab === 'woo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Revenue KPI Summary */}
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="metric-card" style={{ borderLeft: '4px solid #06C167' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#E8F5E9' }}>
                <TrendingUp size={20} color="#06C167" />
              </div>
              <div className="metric-details">
                <h4>Gross Sales (GMV)</h4>
                <p>#{grossSales.toFixed(2)}</p>
                <span style={{ fontSize: '11px', color: '#888' }}>Total delivered value</span>
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #0288D1' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#E1F5FE' }}>
                <ShoppingBag size={20} color="#0288D1" />
              </div>
              <div className="metric-details">
                <h4>Net Revenue</h4>
                <p>#{netRevenue.toFixed(2)}</p>
                <span style={{ fontSize: '11px', color: '#0288D1' }}>Platform Cut (15%) + Service Fees</span>
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #E91E63' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#FCE4EC' }}>
                <Percent size={20} color="#E91E63" />
              </div>
              <div className="metric-details">
                <h4>Coupons Discounted</h4>
                <p>-#{couponDiscount.toFixed(2)}</p>
                <span style={{ fontSize: '11px', color: '#E91E63' }}>Subtracted from Gross Sales</span>
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #9C27B0' }}>
              <div className="metric-icon-box" style={{ backgroundColor: '#F3E5F5' }}>
                <DollarSign size={20} color="#9C27B0" />
              </div>
              <div className="metric-details">
                <h4>Delivery Fees Volume</h4>
                <p>#{totalShipping.toFixed(2)}</p>
                <span style={{ fontSize: '11px', color: '#9C27B0' }}>Paid out to active riders</span>
              </div>
            </div>
          </div>

          <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Top Products Leaderboard */}
            <div className="card">
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Top Selling Dishes</span>
                <button 
                  className="action-btn-small" 
                  style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleExportTopProducts}
                >
                  <FileSpreadsheet size={12} />
                  Export
                </button>
              </div>
              <div className="table-responsive" style={{ marginTop: '10px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Dish Name</th>
                      <th>Quantity Sold</th>
                      <th>Total Sales Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellingDishes.length > 0 ? (
                      topSellingDishes.map((dish, index) => (
                        <tr key={index}>
                          <td style={{ fontWeight: 'bold', color: '#FFF' }}>
                            🍳 {dish.name}
                          </td>
                          <td>{dish.quantity} units</td>
                          <td style={{ fontWeight: 'bold', color: '#06C167' }}>#{dish.revenue.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: '#999', padding: '16px' }}>
                          No sales data recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Performance */}
            <div className="card">
              <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Category Performance</span>
                <button 
                  className="action-btn-small" 
                  style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleExportCategorySales}
                >
                  <FileSpreadsheet size={12} />
                  Export
                </button>
              </div>
              <div className="table-responsive" style={{ marginTop: '10px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Total Orders</th>
                      <th>Total Gross Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryPerformance.length > 0 ? (
                      categoryPerformance.map((cat, index) => (
                        <tr key={index}>
                          <td style={{ fontWeight: 'bold', color: '#FFF' }}>
                            📂 {cat.category}
                          </td>
                          <td>{cat.ordersCount} orders</td>
                          <td style={{ fontWeight: 'bold', color: '#06C167' }}>#{cat.sales.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: '#999', padding: '16px' }}>
                          No category orders recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Coupon Performance Dashboard */}
          <div className="card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Coupon & Voucher Redemptions</span>
              <button 
                className="action-btn-small" 
                style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleExportCoupons}
              >
                <FileSpreadsheet size={12} />
                Export
              </button>
            </div>
            <div className="table-responsive" style={{ marginTop: '10px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Promo Voucher Code</th>
                    <th>Voucher Redemptions</th>
                    <th>Total Disbursed Discount Value</th>
                    <th>Total Gross Sales Volume Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {couponPerformance.length > 0 ? (
                    couponPerformance.map((coupon, index) => (
                      <tr key={index}>
                        <td><code style={{ fontSize: '13px', fontWeight: 'bold', color: '#0288D1' }}>{coupon.code}</code></td>
                        <td>{coupon.redemptions} redemptions</td>
                        <td style={{ color: '#E91E63', fontWeight: '500' }}>-#{coupon.discountApplied.toFixed(2)}</td>
                        <td style={{ color: '#06C167', fontWeight: 'bold' }}>#{coupon.revenueGenerated.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                        No coupon discounts redeemed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
