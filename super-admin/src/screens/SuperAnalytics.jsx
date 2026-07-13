import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';

export default function SuperAnalytics() {
  const [activeSubTab, setActiveSubTab] = useState('ceo'); // 'ceo', 'data', 'fraud', 'pos'
  
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

    </div>
  );
}
