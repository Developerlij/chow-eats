import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, push } from 'firebase/database';
import { 
  Building2, 
  DollarSign, 
  ShoppingBag, 
  Truck, 
  Users, 
  ShieldCheck, 
  Terminal, 
  Plus, 
  AlertTriangle, 
  Calendar,
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react';

export default function ERPConsole() {
  const [activeTab, setActiveTab] = useState('fico'); // fico, mm, sd, hcm, grc
  const [tCode, setTCode] = useState('');
  
  // Database States
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [operators, setOperators] = useState([]);

  // FICO Tax States
  const [taxRate, setTaxRate] = useState(7.5);
  
  // MM Purchase Orders Form
  const [poProduct, setPoProduct] = useState('');
  const [poQty, setPoQty] = useState(100);
  const [purchaseOrders, setPurchaseOrders] = useState([
    { id: 'PO-2026-001', date: '2026-07-23', product: 'Biodegradable Takeout Boxes', qty: 500, price: 150.00, status: 'Received ✓' },
    { id: 'PO-2026-002', date: '2026-07-24', product: 'Chow Eats Branded Paper Bags', qty: 1000, price: 220.00, status: 'In Transit 🚚' },
    { id: 'PO-2026-003', date: '2026-07-25', product: 'Thermal Rider Delivery Bags', qty: 50, price: 750.00, status: 'Pending Approval' }
  ]);

  // SD Surge Rules
  const [surgeRules, setSurgeRules] = useState([
    { id: 'RULE-1', time: '11:30 - 13:30 (Lunch Peak)', multiplier: 1.2, condition: 'Lunch Surge' },
    { id: 'RULE-2', time: '18:00 - 21:00 (Dinner Peak)', multiplier: 1.3, condition: 'Dinner Surge' },
    { id: 'RULE-3', time: 'Anytime (Heavy Rain)', multiplier: 1.5, condition: 'Weather Surge' }
  ]);
  const [newRuleTime, setNewRuleTime] = useState('');
  const [newRuleMult, setNewRuleMult] = useState(1.1);
  const [newRuleCond, setNewRuleCond] = useState('');

  // HCM Shift Scheduler
  const [roster, setRoster] = useState({
    op_01: { name: 'Alex Rivera', Mon: 'Morning Shift', Tue: 'Morning Shift', Wed: 'Off', Thu: 'Evening Shift', Fri: 'Evening Shift', Sat: 'Off', Sun: 'Off' },
    op_02: { name: 'Clara Oswald', Mon: 'Off', Tue: 'Evening Shift', Wed: 'Evening Shift', Thu: 'Off', Fri: 'Morning Shift', Sat: 'Morning Shift', Sun: 'Off' },
    op_03: { name: 'Marcus Brody', Mon: 'Morning Shift', Tue: 'Off', Wed: 'Morning Shift', Thu: 'Morning Shift', Fri: 'Off', Sat: 'Evening Shift', Sun: 'Off' }
  });

  // GRC Audit & Document States
  const [complianceDocs, setComplianceDocs] = useState([
    { id: 'DOC-9428', entity: 'Mama Put Local Food', docType: 'Health Permit', expiry: '2026-08-15', status: 'Warning (Expires Soon)', color: '#F57C00' },
    { id: 'DOC-0382', entity: 'Rider: John Doe', docType: 'Driver License', expiry: '2026-07-30', status: 'Critical (Expiring)', color: '#D32F2F' },
    { id: 'DOC-5932', entity: 'Burger Hub HQ', docType: 'Liquor License', expiry: '2027-02-18', status: 'Valid ✓', color: '#388E3C' }
  ]);

  // T-Code Command Parser (FICO, MM, SD, HCM, GRC)
  const handleTCodeSubmit = (e) => {
    e.preventDefault();
    const command = tCode.trim().toUpperCase();
    if (command === '/FICO' || command === 'FB50') {
      setActiveTab('fico');
      alert("SAP T-Code Resolved: FB50 General Ledger (FICO Financials)");
    } else if (command === '/MM' || command === 'MM03') {
      setActiveTab('mm');
      alert("SAP T-Code Resolved: MM03 Materials Management (MM Inventory)");
    } else if (command === '/SD' || command === 'VA01') {
      setActiveTab('sd');
      alert("SAP T-Code Resolved: VA01 Sales & Distribution (SD SLA Dispatch)");
    } else if (command === '/HCM' || command === 'PA30') {
      setActiveTab('hcm');
      alert("SAP T-Code Resolved: PA30 HR Shift Roster (HCM Human Capital)");
    } else if (command === '/GRC' || command === 'SU01') {
      setActiveTab('grc');
      alert("SAP T-Code Resolved: SU01 Security & Governance (GRC Desk)");
    } else {
      alert(`Unknown SAP T-Code: "${command}". Try '/FICO', '/MM', '/SD', '/HCM', or '/GRC'.`);
    }
    setTCode('');
  };

  useEffect(() => {
    onValue(ref(database, 'orders'), (snapshot) => {
      if (snapshot.val()) {
        setOrders(Object.keys(snapshot.val()).map(k => ({ id: k, ...snapshot.val()[k] })));
      }
    });
    onValue(ref(database, 'restaurants'), (snapshot) => {
      if (snapshot.val()) {
        setRestaurants(Object.keys(snapshot.val()).map(k => ({ id: k, ...snapshot.val()[k] })));
      }
    });
    onValue(ref(database, 'drivers'), (snapshot) => {
      if (snapshot.val()) {
        setDrivers(Object.keys(snapshot.val()).map(k => ({ id: k, ...snapshot.val()[k] })));
      }
    });
    onValue(ref(database, 'operators'), (snapshot) => {
      if (snapshot.val()) {
        setOperators(Object.keys(snapshot.val()).map(k => ({ id: k, ...snapshot.val()[k] })));
      }
    });
  }, []);

  // FICO calculations
  const deliveredOrders = orders.filter(o => o.status === 'Order Delivered');
  const grossSales = deliveredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const vatCollected = grossSales * (taxRate / 100);

  // MM purchase order creator
  const createPurchaseOrder = (e) => {
    e.preventDefault();
    if (!poProduct) return;
    const newPO = {
      id: `PO-2026-00${purchaseOrders.length + 1}`,
      date: new Date().toLocaleDateString(),
      product: poProduct,
      qty: poQty,
      price: poQty * 0.45,
      status: 'Pending Approval'
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    setPoProduct('');
  };

  // SD surge rules creator
  const createSurgeRule = (e) => {
    e.preventDefault();
    if (!newRuleTime || !newRuleCond) return;
    const newRule = {
      id: `RULE-${surgeRules.length + 1}`,
      time: newRuleTime,
      multiplier: parseFloat(newRuleMult),
      condition: newRuleCond
    };
    setSurgeRules(prev => [...prev, newRule]);
    setNewRuleTime('');
    setNewRuleCond('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* SAP ERP Command Line Header */}
      <div className="card" style={{ padding: '12px 20px', background: '#1A1A1A', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={18} color="#06C167" />
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#aaa' }}>SAP Command Center:</span>
        </div>
        <form onSubmit={handleTCodeSubmit} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '500px' }}>
          <input 
            type="text" 
            value={tCode}
            onChange={(e) => setTCode(e.target.value)}
            placeholder="Type T-Code (e.g. /FICO, /MM, /SD, /HCM, /GRC)"
            style={{ flex: 1, background: '#121212', border: '1px solid #444', color: '#06C167', borderRadius: '4px', padding: '6px 12px', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }}
          />
          <button 
            type="submit" 
            className="action-btn-small action-btn-primary" 
            style={{ padding: '6px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}
          >
            EXECUTE
          </button>
        </form>
        <div style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace' }}>SYSTEM: S4HANA_CHOW_PROD</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        
        {/* Sidebar ERP Navigation */}
        <div className="card" style={{ padding: '12px', height: 'fit-content', background: '#1A1A1A', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
            SAP Core Modules
          </div>
          
          <button 
            onClick={() => setActiveTab('fico')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: activeTab === 'fico' ? '#06C167' : 'transparent',
              color: activeTab === 'fico' ? '#FFF' : '#ccc',
              fontWeight: activeTab === 'fico' ? 'bold' : 'normal',
              textAlign: 'left'
            }}
          >
            <DollarSign size={16} />
            <span>FICO (Financials)</span>
          </button>

          <button 
            onClick={() => setActiveTab('mm')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: activeTab === 'mm' ? '#06C167' : 'transparent',
              color: activeTab === 'mm' ? '#FFF' : '#ccc',
              fontWeight: activeTab === 'mm' ? 'bold' : 'normal',
              textAlign: 'left'
            }}
          >
            <ShoppingBag size={16} />
            <span>MM (Materials)</span>
          </button>

          <button 
            onClick={() => setActiveTab('sd')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: activeTab === 'sd' ? '#06C167' : 'transparent',
              color: activeTab === 'sd' ? '#FFF' : '#ccc',
              fontWeight: activeTab === 'sd' ? 'bold' : 'normal',
              textAlign: 'left'
            }}
          >
            <Truck size={16} />
            <span>SD (Distribution)</span>
          </button>

          <button 
            onClick={() => setActiveTab('hcm')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: activeTab === 'hcm' ? '#06C167' : 'transparent',
              color: activeTab === 'hcm' ? '#FFF' : '#ccc',
              fontWeight: activeTab === 'hcm' ? 'bold' : 'normal',
              textAlign: 'left'
            }}
          >
            <Users size={16} />
            <span>HCM (Human Capital)</span>
          </button>

          <button 
            onClick={() => setActiveTab('grc')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: activeTab === 'grc' ? '#06C167' : 'transparent',
              color: activeTab === 'grc' ? '#FFF' : '#ccc',
              fontWeight: activeTab === 'grc' ? 'bold' : 'normal',
              textAlign: 'left'
            }}
          >
            <ShieldCheck size={16} />
            <span>GRC (Governance)</span>
          </button>
        </div>

        {/* Workspace Display Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 1. FICO SUB-PANEL */}
          {activeTab === 'fico' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="card-title">FICO General Ledger & Tax Engine</h3>
                
                <div className="metrics-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: '15px' }}>
                  <div className="metric-card" style={{ borderLeft: '4px solid #06C167' }}>
                    <div className="metric-details">
                      <h4>Total Gross Value (GMV)</h4>
                      <p>#{grossSales.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="metric-card" style={{ borderLeft: '4px solid #0288D1' }}>
                    <div className="metric-details">
                      <h4>Platform VAT Cut ({taxRate}%)</h4>
                      <p>#{vatCollected.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="metric-card" style={{ borderLeft: '4px solid #9C27B0' }}>
                    <div className="metric-details">
                      <h4>Corporate Cost Centers</h4>
                      <p>3 Regions Active</p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', color: '#aaa', display: 'block', marginBottom: '6px' }}>Configure Regional Tax Factor (%)</label>
                    <input 
                      type="number" 
                      value={taxRate} 
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', background: '#121212', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '8px 12px', outline: 'none' }}
                      step="0.1"
                    />
                  </div>
                  <div style={{ flex: 2, padding: '12px', background: '#222', borderRadius: '6px', border: '1px solid #333', fontSize: '12px', color: '#ccc', lineHeight: '18px' }}>
                    <strong>💡 SAP FICO Directive:</strong> The configured tax factor is dynamically applied to all checkout invoices. Commission disbursements are settled net of this percentage to the General Ledger cost nodes.
                  </div>
                </div>
              </div>

              {/* Zone Profitability Splits */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="card-title">Profitability Analysis by Cost Center Zone</h3>
                <div className="table-responsive" style={{ marginTop: '12px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Operational Zone</th>
                        <th>Gross Order Sales</th>
                        <th>Zone Levy Fees</th>
                        <th>Delivery Payouts</th>
                        <th>Net Area Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>📍 Mission District (Zone A)</td>
                        <td>#{(grossSales * 0.45).toFixed(2)}</td>
                        <td>#{(grossSales * 0.45 * 0.15).toFixed(2)}</td>
                        <td>#{(grossSales * 0.45 * 0.10).toFixed(2)}</td>
                        <td style={{ color: '#06C167', fontWeight: 'bold' }}>#{(grossSales * 0.45 * 0.05).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>📍 SoMa (Zone B)</td>
                        <td>#{(grossSales * 0.35).toFixed(2)}</td>
                        <td>#{(grossSales * 0.35 * 0.15).toFixed(2)}</td>
                        <td>#{(grossSales * 0.35 * 0.10).toFixed(2)}</td>
                        <td style={{ color: '#06C167', fontWeight: 'bold' }}>#{(grossSales * 0.35 * 0.05).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>📍 Financial District (Zone C)</td>
                        <td>#{(grossSales * 0.20).toFixed(2)}</td>
                        <td>#{(grossSales * 0.20 * 0.15).toFixed(2)}</td>
                        <td>#{(grossSales * 0.20 * 0.10).toFixed(2)}</td>
                        <td style={{ color: '#06C167', fontWeight: 'bold' }}>#{(grossSales * 0.20 * 0.05).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. MM SUB-PANEL */}
          {activeTab === 'mm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="card-title">Centralized Materials & Purchase Orders</h3>
                
                <form onSubmit={createPurchaseOrder} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '15px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Replenishment Material Item</label>
                    <input 
                      type="text" 
                      value={poProduct}
                      onChange={(e) => setPoProduct(e.target.value)}
                      placeholder="e.g. Biodegradable Delivery Box"
                      style={{ width: '100%', background: '#121212', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '8px 12px', outline: 'none', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Requisition Qty</label>
                    <input 
                      type="number" 
                      value={poQty}
                      onChange={(e) => setPoQty(parseInt(e.target.value) || 0)}
                      style={{ width: '100%', background: '#121212', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '8px 12px', outline: 'none', fontSize: '13px' }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="action-btn-small action-btn-primary" 
                    style={{ padding: '10px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
                  >
                    <Plus size={16} />
                    Issue PO
                  </button>
                </form>

                <div className="table-responsive" style={{ marginTop: '20px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>PO Code</th>
                        <th>Date issued</th>
                        <th>Material Description</th>
                        <th>Order Volume</th>
                        <th>Material Valuation</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.map((po, index) => (
                        <tr key={index}>
                          <td><code style={{ fontSize: '12px', fontWeight: 'bold' }}>{po.id}</code></td>
                          <td>{po.date}</td>
                          <td style={{ fontWeight: 'bold', color: '#FFF' }}>{po.product}</td>
                          <td>{po.qty} units</td>
                          <td style={{ color: '#06C167' }}>#{po.price.toFixed(2)}</td>
                          <td>
                            <span className="status-badge" style={{ backgroundColor: '#222', color: '#aaa', borderColor: 'transparent' }}>
                              {po.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inactive & Low Stock Warnings */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} color="#F57C00" />
                  <span>Materials Stock Depletion Alerts (Groceries)</span>
                </h3>
                <div className="table-responsive" style={{ marginTop: '12px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Material Name</th>
                        <th>Merchant Store</th>
                        <th>Current On-Hand</th>
                        <th>Minimum Threshold</th>
                        <th>Status Indicator</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>🥛 Fresh Whole Milk 1L</td>
                        <td>Chow Grocery Express</td>
                        <td style={{ color: '#D32F2F', fontWeight: 'bold' }}>3 units</td>
                        <td>20 units</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: '#FFEBEE', color: '#D32F2F', borderColor: 'transparent' }}>Critical Low</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>🍞 Sliced Wheat Bread</td>
                        <td>Mega Grocery Store</td>
                        <td style={{ color: '#F57C00', fontWeight: 'bold' }}>8 units</td>
                        <td>15 units</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: '#FFF3E0', color: '#F57C00', borderColor: 'transparent' }}>Warning Level</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. SD SUB-PANEL */}
          {activeTab === 'sd' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* SLA Performance metrics */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="card-title">SD Delivery & Dispatch SLA Milestones</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Average Preparation SLA (Goal: &lt; 15 mins)</span>
                      <span style={{ fontWeight: 'bold' }}>12.4 mins ✓</span>
                    </div>
                    <div style={{ background: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ background: '#388E3C', width: '82%', height: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Rider Pickup Delay SLA (Goal: &lt; 8 mins)</span>
                      <span style={{ fontWeight: 'bold' }}>9.2 mins</span>
                    </div>
                    <div style={{ background: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ background: '#F57C00', width: '65%', height: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Transit Delivery SLA (Goal: &lt; 20 mins)</span>
                      <span style={{ fontWeight: 'bold' }}>18.1 mins ✓</span>
                    </div>
                    <div style={{ background: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ background: '#388E3C', width: '90%', height: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Auto-Surge Scheduler */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="card-title">Dynamic Surge Control & Rules Engine</h3>

                <form onSubmit={createSurgeRule} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '10px', alignItems: 'flex-end', marginTop: '15px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Active Timeframe</label>
                    <input 
                      type="text" 
                      value={newRuleTime}
                      onChange={(e) => setNewRuleTime(e.target.value)}
                      placeholder="e.g. 18:00 - 21:00"
                      style={{ width: '100%', background: '#121212', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '8px 12px', outline: 'none', fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Multiplier</label>
                    <input 
                      type="number" 
                      value={newRuleMult}
                      onChange={(e) => setNewRuleMult(parseFloat(e.target.value) || 1)}
                      style={{ width: '100%', background: '#121212', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '8px 12px', outline: 'none', fontSize: '12.5px' }}
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Trigger Rule</label>
                    <input 
                      type="text" 
                      value={newRuleCond}
                      onChange={(e) => setNewRuleCond(e.target.value)}
                      placeholder="e.g. Rain/Peak hour"
                      style={{ width: '100%', background: '#121212', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '8px 12px', outline: 'none', fontSize: '12.5px' }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="action-btn-small action-btn-primary" 
                    style={{ padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold' }}
                  >
                    Add Rule
                  </button>
                </form>

                <div className="table-responsive" style={{ marginTop: '20px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Rule ID</th>
                        <th>Time Window</th>
                        <th>Surge Multiplier</th>
                        <th>Trigger Event Code</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surgeRules.map((rule, index) => (
                        <tr key={index}>
                          <td><code style={{ fontSize: '12px' }}>{rule.id}</code></td>
                          <td>{rule.time}</td>
                          <td style={{ fontWeight: 'bold', color: '#06C167' }}>{rule.multiplier}x</td>
                          <td>{rule.condition}</td>
                          <td>
                            <span className="status-badge" style={{ backgroundColor: '#E8F5E9', color: '#388E3C', borderColor: 'transparent' }}>
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 4. HCM SUB-PANEL */}
          {activeTab === 'hcm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Roster shift schedule */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="card-title">HCM Operator Shift Roster Plan</h3>
                <div className="table-responsive" style={{ marginTop: '15px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Terminal Operator</th>
                        <th>Mon</th>
                        <th>Tue</th>
                        <th>Wed</th>
                        <th>Thu</th>
                        <th>Fri</th>
                        <th>Sat</th>
                        <th>Sun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(roster).map((opId, index) => {
                        const row = roster[opId];
                        return (
                          <tr key={opId}>
                            <td style={{ fontWeight: 'bold', color: '#FFF' }}>{row.name}</td>
                            <td style={{ fontSize: '11px', color: row.Mon === 'Off' ? '#666' : '#06C167' }}>{row.Mon}</td>
                            <td style={{ fontSize: '11px', color: row.Tue === 'Off' ? '#666' : '#06C167' }}>{row.Tue}</td>
                            <td style={{ fontSize: '11px', color: row.Wed === 'Off' ? '#666' : '#06C167' }}>{row.Wed}</td>
                            <td style={{ fontSize: '11px', color: row.Thu === 'Off' ? '#666' : '#06C167' }}>{row.Thu}</td>
                            <td style={{ fontSize: '11px', color: row.Fri === 'Off' ? '#666' : '#06C167' }}>{row.Fri}</td>
                            <td style={{ fontSize: '11px', color: row.Sat === 'Off' ? '#666' : '#06C167' }}>{row.Sat}</td>
                            <td style={{ fontSize: '11px', color: row.Sun === 'Off' ? '#666' : '#06C167' }}>{row.Sun}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rider Performance & payroll metrics */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="card-title">Driver Attendance & Bonus Settlements</h3>
                <div className="table-responsive" style={{ marginTop: '12px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Driver Profile</th>
                        <th>Weekly Deliveries</th>
                        <th>SLA Compliance</th>
                        <th>Base Earnings</th>
                        <th>Quota Bonus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drivers.length > 0 ? (
                        drivers.map(drv => {
                          const count = deliveredOrders.filter(o => o.driverId === drv.id).length;
                          const baseEarnings = count * 5.00; // Mock delivery fees
                          const bonus = count >= 5 ? 20.00 : 0.00;
                          return (
                            <tr key={drv.id}>
                              <td style={{ fontWeight: 'bold', color: '#FFF' }}>{drv.name || 'Anonymous Rider'}</td>
                              <td>{count} deliveries</td>
                              <td style={{ color: '#388E3C', fontWeight: 'bold' }}>98.2%</td>
                              <td>#{baseEarnings.toFixed(2)}</td>
                              <td style={{ color: bonus > 0 ? '#06C167' : '#888', fontWeight: 'bold' }}>
                                {bonus > 0 ? `+#${bonus.toFixed(2)}` : '#0.00'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '16px' }}>
                            No active drivers online to query payroll metrics.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 5. GRC SUB-PANEL */}
          {activeTab === 'grc' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Document expirations */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="card-title">GRC Entity Regulatory Compliance</h3>
                <div className="table-responsive" style={{ marginTop: '15px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Reference Code</th>
                        <th>Compliance Entity</th>
                        <th>Required License / Permit</th>
                        <th>Expiration Date</th>
                        <th>Risk Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceDocs.map((doc, idx) => (
                        <tr key={idx}>
                          <td><code>{doc.id}</code></td>
                          <td style={{ fontWeight: 'bold', color: '#FFF' }}>{doc.entity}</td>
                          <td>{doc.docType}</td>
                          <td>{doc.expiry}</td>
                          <td>
                            <span className="status-badge" style={{ backgroundColor: '#222', color: doc.color, borderColor: 'transparent' }}>
                              {doc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Administrative Audit trail log */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 className="card-title">Immutible Security Action Audit Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', background: '#222', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid #06C167' }}>
                    <span style={{ color: '#06C167', fontWeight: 'bold', fontFamily: 'monospace' }}>[14:23:12]</span>
                    <span style={{ color: '#FFF' }}><strong>Admin Auth:</strong> Operator account profile <strong>op_02</strong> (Clara Oswald) updated by SYSTEM_ADMIN.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', background: '#222', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid #06C167' }}>
                    <span style={{ color: '#06C167', fontWeight: 'bold', fontFamily: 'monospace' }}>[14:18:45]</span>
                    <span style={{ color: '#FFF' }}><strong>FICO Ledger:</strong> Tax rates adjusted from 5.0% to 7.5% across all regional stores.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', background: '#222', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid #0288D1' }}>
                    <span style={{ color: '#0288D1', fontWeight: 'bold', fontFamily: 'monospace' }}>[13:58:32]</span>
                    <span style={{ color: '#FFF' }}><strong>System Sync:</strong> Database backup transaction logged to Amazon S3 buckets successfully.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
