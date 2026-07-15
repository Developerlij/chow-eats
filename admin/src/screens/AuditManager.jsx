import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, update, set, remove } from 'firebase/database';
import { ShieldCheck, Users, Briefcase, Bike, ToggleLeft, ToggleRight, Radio, Search, ShieldAlert } from 'lucide-react';

export default function AuditManager() {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'operators', 'drivers', 'stores'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real database states
  const [usersList, setUsersList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [operatorsList, setOperatorsList] = useState([]);
  const [storesList, setStoresList] = useState([]);

  useEffect(() => {
    // 1. Fetch Users from Firebase
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setUsersList(list);
      }
    });

    // 2. Fetch Drivers from Firebase
    const driversRef = ref(database, 'drivers');
    const unsubscribeDrivers = onValue(driversRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setDriversList(list);
      }
    });

    // 3. Fetch Operators from Firebase with Auto-Seeding
    const operatorsRef = ref(database, 'operators');
    const unsubscribeOperators = onValue(operatorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setOperatorsList(list);
      } else {
        // Auto-seed default operators if node doesn't exist
        const seedOperators = {
          op_01: { id: 'op_01', name: 'Alex Rivera', role: 'Live Orders Manager', status: 'Active', ip: '192.168.1.104', permissions: { Overview: true, Menu: true, Grocery: false, Orders: true } },
          op_02: { id: 'op_02', name: 'Clara Oswald', role: 'Menu Coordinator', status: 'Active', ip: '192.168.1.112', permissions: { Overview: false, Menu: true, Grocery: false, Orders: false } },
          op_03: { id: 'op_03', name: 'Marcus Brody', role: 'Grocery Lead', status: 'Offline', ip: '192.168.1.95', permissions: { Overview: false, Menu: false, Grocery: true, Orders: false } },
          op_04: { id: 'op_04', name: 'Selina Kyle', role: 'Night Dispatcher', status: 'Active', ip: '192.168.1.48', permissions: { Overview: true, Menu: false, Grocery: false, Orders: true } }
        };
        set(operatorsRef, seedOperators);
      }
    });

    // 4. Fetch Stores (Restaurants) from Firebase
    const storesRef = ref(database, 'restaurants');
    const unsubscribeStores = onValue(storesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setStoresList(list);
      } else {
        setStoresList([]);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeDrivers();
      unsubscribeOperators();
      unsubscribeStores();
    };
  }, []);

  // Action: Toggle driver status (Approve / Suspend)
  const toggleDriverApproval = async (driverId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'Approved' ? 'Suspended' : 'Approved';
      await update(ref(database, `drivers/${driverId}`), { status: nextStatus });
    } catch (e) {
      alert("Failed to toggle driver status: " + e.message);
    }
  };

  // Action: Toggle user status (Active / Banned)
  const toggleUserBanStatus = async (userId, isBanned) => {
    try {
      await update(ref(database, `users/${userId}`), { isBanned: !isBanned });
    } catch (e) {
      alert("Failed to toggle user status: " + e.message);
    }
  };

  // Action: Toggle operator active status
  const toggleOperatorStatus = async (opId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'Active' ? 'Offline' : 'Active';
      await update(ref(database, `operators/${opId}`), { status: nextStatus });
    } catch (e) {
      alert("Failed to toggle operator status: " + e.message);
    }
  };

  // Action: Toggle operator module permission checkbox
  const toggleOperatorPermission = async (opId, moduleKey, currentVal) => {
    try {
      const valRef = ref(database, `operators/${opId}/permissions/${moduleKey}`);
      await set(valRef, !currentVal);
    } catch (e) {
      console.error("Failed to update permission:", e);
    }
  };

  // Action: Verify / Approve Merchant Store Registration request
  const toggleStoreVerification = async (storeId, currentVerified) => {
    try {
      const nextVerified = !currentVerified;
      await update(ref(database, `restaurants/${storeId}`), { 
        verified: nextVerified,
        status: nextVerified ? 'Active' : 'Pending Verification'
      });
    } catch (e) {
      alert("Failed to verify merchant store: " + e.message);
    }
  };

  // Action: Reject & delete unverified store
  const deleteStore = async (storeId) => {
    if (window.confirm("Are you sure you want to permanently reject and delete this store registration?")) {
      try {
        await remove(ref(database, `restaurants/${storeId}`));
      } catch (e) {
        alert("Failed to delete store: " + e.message);
      }
    }
  };

  // Filters search inputs
  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase().trim();
    if (activeTab === 'users') {
      return usersList.filter(u => 
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.phoneNumber && u.phoneNumber.includes(query)) ||
        (u.subscriptionPlan && u.subscriptionPlan.toLowerCase().includes(query))
      );
    } else if (activeTab === 'operators') {
      return operatorsList.filter(op => 
        op.name.toLowerCase().includes(query) ||
        op.role.toLowerCase().includes(query) ||
        op.ip.includes(query)
      );
    } else if (activeTab === 'drivers') {
      return driversList.filter(d => 
        d.name.toLowerCase().includes(query) ||
        (d.phone && d.phone.includes(query)) ||
        (d.vehicle && d.vehicle.toLowerCase().includes(query))
      );
    } else {
      return storesList.filter(s => 
        s.name.toLowerCase().includes(query) ||
        (s.address && s.address.toLowerCase().includes(query)) ||
        (s.category && s.category.toLowerCase().includes(query))
      );
    }
  };

  const filteredItems = getFilteredItems();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Overview stats header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: '#888' }}>Perform real-time profile verification, security bans, and operator permission scope audits.</span>
      </div>

      {/* Metrics Summary cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid #06C167' }}>
          <div className="metric-icon-box" style={{ backgroundColor: '#E8F5E9' }}>
            <Users size={24} color="#06C167" />
          </div>
          <div className="metric-details">
            <h4>Total Registered Users</h4>
            <p>{usersList.length} Accounts</p>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #0288D1' }}>
          <div className="metric-icon-box" style={{ backgroundColor: '#E1F5FE' }}>
            <Briefcase size={24} color="#0288D1" />
          </div>
          <div className="metric-details">
            <h4>Active Operators</h4>
            <p>{operatorsList.filter(o => o.status === 'Active').length} Active</p>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #F57C00' }}>
          <div className="metric-icon-box" style={{ backgroundColor: '#FFF3E0' }}>
            <Bike size={24} color="#F57C00" />
          </div>
          <div className="metric-details">
            <h4>Approved Drivers</h4>
            <p>{driversList.filter(d => d.status === 'Approved').length} / {driversList.length} Riders</p>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #E53935' }}>
          <div className="metric-icon-box" style={{ backgroundColor: '#FFEBEE' }}>
            <Radio size={24} color="#E53935" />
          </div>
          <div className="metric-details">
            <h4>Banned Entities</h4>
            <p>{usersList.filter(u => u.isBanned).length + driversList.filter(d => d.status === 'Suspended').length} Banned</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Search Card */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          
          {/* Sub-panels toggles */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`action-btn-small ${activeTab === 'users' ? 'action-btn-primary' : ''}`}
              style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
              onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            >
              👤 Users ({usersList.length})
            </button>
            <button 
              className={`action-btn-small ${activeTab === 'operators' ? 'action-btn-primary' : ''}`}
              style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
              onClick={() => { setActiveTab('operators'); setSearchQuery(''); }}
            >
              💼 Operators ({operatorsList.length})
            </button>
            <button 
              className={`action-btn-small ${activeTab === 'drivers' ? 'action-btn-primary' : ''}`}
              style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
              onClick={() => { setActiveTab('drivers'); setSearchQuery(''); }}
            >
              🚲 Drivers ({driversList.length})
            </button>
            <button 
              className={`action-btn-small ${activeTab === 'stores' ? 'action-btn-primary' : ''}`}
              style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
              onClick={() => { setActiveTab('stores'); setSearchQuery(''); }}
            >
              🏪 Stores ({storesList.length})
            </button>
          </div>

          {/* Search bar input */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#222', borderRadius: '6px', border: '1px solid #444', padding: '4px 10px', width: '280px' }}>
            <Search size={14} color="#888" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '13px', width: '100%', outline: 'none' }}
            />
          </div>

        </div>

        {/* Audit Tables depending on active selection tab */}
        <div className="table-responsive" style={{ marginTop: '20px' }}>
          
          {/* USER AUDIT PANEL */}
          {activeTab === 'users' && (
            <table className="table">
              <thead>
                <tr>
                  <th>User Identifier</th>
                  <th>Subscription Plan</th>
                  <th>Wallet Balance</th>
                  <th>Joined Date</th>
                  <th>User Status</th>
                  <th style={{ textAlign: 'right' }}>Security Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 'bold' }}>
                        {u.email || u.phoneNumber || u.id}
                      </td>
                      <td>
                        <span className="status-badge" style={{ 
                          backgroundColor: u.subscriptionPlan === 'Monthly Subscription' ? '#E8F5E9' : u.subscriptionPlan === 'Yearly Subscription' ? '#F3E5F5' : '#F5F5F5',
                          color: u.subscriptionPlan === 'Monthly Subscription' ? '#06C167' : u.subscriptionPlan === 'Yearly Subscription' ? '#9C27B0' : '#666',
                          borderColor: 'transparent',
                          fontSize: '11px',
                          padding: '3px 8px'
                        }}>
                          {u.subscriptionPlan || 'Pay as you use'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        ${u.wallet?.balance !== undefined ? parseFloat(u.wallet.balance).toFixed(2) : '0.00'}
                      </td>
                      <td>{new Date(u.joinedAt || Date.now()).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${u.isBanned ? 'pickup' : 'delivered'}`}>
                          {u.isBanned ? 'Banned / Blocked' : 'Active Account'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="action-btn-small"
                          style={{ 
                            backgroundColor: u.isBanned ? '#388E3C' : '#D32F2F', 
                            borderColor: u.isBanned ? '#388E3C' : '#D32F2F',
                            color: '#FFF',
                            padding: '4px 10px'
                          }}
                          onClick={() => toggleUserBanStatus(u.id, !!u.isBanned)}
                        >
                          {u.isBanned ? 'Lift Ban' : 'Ban User'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                      No matching user accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* OPERATOR AUDIT PANEL */}
          {activeTab === 'operators' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Operator Name</th>
                  <th>Assigned Role</th>
                  <th>Module Permissions (Manage & Authorize Scope)</th>
                  <th>Login IP</th>
                  <th>Terminal Status</th>
                  <th style={{ textAlign: 'right' }}>Scope Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((op) => {
                    const perms = op.permissions || {};
                    return (
                      <tr key={op.id}>
                        <td style={{ fontWeight: 'bold' }}>🔑 {op.name}</td>
                        <td style={{ color: '#888', fontWeight: '500' }}>{op.role}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={!!perms.Overview} 
                                onChange={() => toggleOperatorPermission(op.id, 'Overview', !!perms.Overview)}
                              />
                              <span>Live Dispatch Map (Overview)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={!!perms.Menu} 
                                onChange={() => toggleOperatorPermission(op.id, 'Menu', !!perms.Menu)}
                              />
                              <span>Food Manager (Menu)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={!!perms.Grocery} 
                                onChange={() => toggleOperatorPermission(op.id, 'Grocery', !!perms.Grocery)}
                              />
                              <span>Product Update (Grocery)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={!!perms.Orders} 
                                onChange={() => toggleOperatorPermission(op.id, 'Orders', !!perms.Orders)}
                              />
                              <span>Live Orders (Orders)</span>
                            </label>
                          </div>
                        </td>
                        <td><code style={{ fontSize: '12px' }}>{op.ip}</code></td>
                        <td>
                          <span className={`status-badge ${op.status === 'Active' ? 'delivered' : 'pickup'}`}>
                            {op.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="action-btn-small"
                            style={{ 
                              backgroundColor: op.status === 'Active' ? '#D32F2F' : '#388E3C', 
                              borderColor: op.status === 'Active' ? '#D32F2F' : '#388E3C',
                              color: '#FFF',
                              padding: '4px 10px'
                            }}
                            onClick={() => toggleOperatorStatus(op.id, op.status)}
                          >
                            {op.status === 'Active' ? 'Disconnect' : 'Connect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                      No matching operators found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* DRIVER AUDIT PANEL */}
          {activeTab === 'drivers' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Phone Number</th>
                  <th>Vehicle Details</th>
                  <th>Duty Status</th>
                  <th>Live Map Coords</th>
                  <th>Approval State</th>
                  <th style={{ textAlign: 'right' }}>Security Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 'bold' }}>🚲 {d.name}</td>
                      <td>{d.phone || '—'}</td>
                      <td>{d.vehicle || 'Bicycle'}</td>
                      <td>
                        <span className={`status-badge ${d.tripStatus === 'On Trip' ? 'preparing' : 'delivered'}`}>
                          {d.tripStatus || 'Online / Idle'}
                        </span>
                      </td>
                      <td>
                        {d.lat && d.lng ? (
                          <code style={{ fontSize: '11.5px', color: '#06C167' }}>
                            {parseFloat(d.lat).toFixed(4)}, {parseFloat(d.lng).toFixed(4)}
                          </code>
                        ) : (
                          <span style={{ color: '#888', fontStyle: 'italic' }}>no streams</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${d.status === 'Approved' ? 'delivered' : 'pickup'}`}>
                          {d.status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="action-btn-small"
                          style={{ 
                            backgroundColor: d.status === 'Approved' ? '#D32F2F' : '#388E3C', 
                            borderColor: d.status === 'Approved' ? '#D32F2F' : '#388E3C',
                            color: '#FFF',
                            padding: '4px 10px'
                          }}
                          onClick={() => toggleDriverApproval(d.id, d.status)}
                        >
                          {d.status === 'Approved' ? 'Suspend Rider' : 'Approve Rider'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                      No matching delivery drivers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* STORE/MERCHANT AUDIT PANEL */}
          {activeTab === 'stores' && (
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Store Cover</th>
                  <th>Store Name</th>
                  <th>Category</th>
                  <th>Address</th>
                  <th>Coordinates</th>
                  <th>Verification Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <img 
                          src={s.image} 
                          alt={s.name} 
                          style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', backgroundColor: '#333' }}
                        />
                      </td>
                      <td style={{ fontWeight: 'bold' }}>🏪 {s.name}</td>
                      <td>
                        <span className="status-badge delivered" style={{ backgroundColor: 'rgba(2, 136, 209, 0.15)', color: '#0288D1' }}>
                          {s.category}
                        </span>
                      </td>
                      <td>{s.address || '—'}</td>
                      <td>
                        {s.lat && s.lng ? (
                          <code style={{ fontSize: '11.5px', color: '#06C167' }}>
                            {parseFloat(s.lat).toFixed(4)}, {parseFloat(s.lng).toFixed(4)}
                          </code>
                        ) : (
                          <span style={{ color: '#888', fontStyle: 'italic' }}>no coords</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${s.verified ? 'delivered' : 'pickup'}`}>
                          {s.verified ? 'Verified ✓' : 'Pending Verification ⚠️'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            className="action-btn-small"
                            style={{ 
                              backgroundColor: s.verified ? '#D32F2F' : '#388E3C', 
                              borderColor: s.verified ? '#D32F2F' : '#388E3C',
                              color: '#FFF',
                              padding: '4px 10px'
                            }}
                            onClick={() => toggleStoreVerification(s.id, s.verified)}
                          >
                            {s.verified ? 'Revoke Store' : 'Verify Store'}
                          </button>
                          <button 
                            className="action-btn-small"
                            style={{ 
                              backgroundColor: 'transparent', 
                              borderColor: '#D32F2F',
                              color: '#D32F2F',
                              padding: '4px 10px'
                            }}
                            onClick={() => deleteStore(s.id)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                      No merchant stores found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

        </div>
      </div>
      
    </div>
  );
}
