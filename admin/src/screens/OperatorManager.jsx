import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { UserCheck, ShieldAlert, ShieldCheck, Trash2, Key, UserPlus, Lock } from 'lucide-react';

export default function OperatorManager() {
  const [operators, setOperators] = useState([]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Live Orders Manager');
  const [permissions, setPermissions] = useState({
    Overview: true,
    Menu: true,
    Grocery: false,
    Orders: true
  });

  useEffect(() => {
    const opRef = ref(database, 'operators');
    const unsubscribe = onValue(opRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setOperators(Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })));
      } else {
        setOperators([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCreateOperator = async (e) => {
    e.preventDefault();
    if (!name || !username || !password) {
      alert("Please fill in all fields.");
      return;
    }

    // Check if username already exists
    const exists = operators.some(op => op.username?.toLowerCase() === username.toLowerCase());
    if (exists) {
      alert("Username already taken. Please choose another one.");
      return;
    }

    const opId = 'op_' + Math.random().toString(36).substring(2, 9);
    const newOperator = {
      id: opId,
      name,
      username,
      password,
      role,
      verified: true, // Created by admin, auto-verified
      status: 'Active',
      permissions
    };

    try {
      await set(ref(database, `operators/${opId}`), newOperator);
      alert("Operator profile created and verified successfully!");
      setName('');
      setUsername('');
      setPassword('');
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleVerifyOperator = async (opId) => {
    try {
      await update(ref(database, `operators/${opId}`), {
        verified: true,
        status: 'Active'
      });
      alert("Operator profile verified successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleTogglePermission = async (opId, permName, currentVal) => {
    try {
      await update(ref(database, `operators/${opId}/permissions`), {
        [permName]: !currentVal
      });
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteOperator = async (opId) => {
    if (window.confirm("Are you sure you want to delete this operator terminal profile?")) {
      try {
        await remove(ref(database, `operators/${opId}`));
        alert("Operator deleted successfully.");
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <span style={{ fontSize: '14px', color: '#888' }}>
        Create operator accounts, manage terminal permission levels, and verify employee registration profiles.
      </span>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Create Operator Card */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="#06C167" />
            <span>Create Operator Console</span>
          </div>

          <form onSubmit={handleCreateOperator} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '8px 12px', outline: 'none' }}
                placeholder="e.g. Alex Smith"
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '8px 12px', outline: 'none' }}
                placeholder="e.g. asmith"
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '8px 12px', outline: 'none' }}
                placeholder="Secret Password"
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Designated Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '8px 12px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="Live Orders Manager">Live Orders Manager</option>
                <option value="Menu Coordinator">Menu Coordinator</option>
                <option value="Grocery Lead">Grocery Lead</option>
                <option value="Night Dispatcher">Night Dispatcher</option>
              </select>
            </div>

            <div style={{ marginTop: '5px' }}>
              <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '6px' }}>Terminal Permission Levels</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {Object.keys(permissions).map((perm) => (
                  <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#ccc', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={permissions[perm]} 
                      onChange={() => setPermissions(prev => ({ ...prev, [perm]: !prev[perm] }))}
                      style={{ accentColor: '#06C167' }}
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              className="action-btn-small action-btn-primary" 
              style={{ width: '100%', padding: '10px', marginTop: '10px', borderRadius: '6px', fontWeight: 'bold' }}
            >
              Create & Verify Account
            </button>
          </form>
        </div>

        {/* Operators List Card */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="card-title">Registered Terminals & Operators ({operators.length})</div>
          
          <div className="table-responsive" style={{ marginTop: '15px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Operator Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Permissions Desk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {operators.length > 0 ? (
                  operators.map((op) => (
                    <tr key={op.id}>
                      <td>
                        <div style={{ fontWeight: 'bold', color: '#FFF' }}>{op.name}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>ID: {op.id}</div>
                      </td>
                      <td style={{ fontSize: '13px' }}>{op.username || 'N/A'}</td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: '#2D2D2D', color: '#ccc', borderColor: 'transparent' }}>
                          {op.role}
                        </span>
                      </td>
                      <td>
                        {op.verified ? (
                          <span style={{ color: '#06C167', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={14} />
                            Verified
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ color: '#F57C00', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldAlert size={14} />
                              Pending
                            </span>
                            <button 
                              className="action-btn-small action-btn-primary" 
                              style={{ padding: '2px 8px', fontSize: '10.5px', borderRadius: '4px' }}
                              onClick={() => handleVerifyOperator(op.id)}
                            >
                              Verify Account
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {['Overview', 'Menu', 'Grocery', 'Orders'].map(perm => {
                            const hasPerm = op.permissions?.[perm];
                            return (
                              <button
                                key={perm}
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  borderRadius: '3px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  backgroundColor: hasPerm ? '#E8F5E9' : '#FFEBEE',
                                  color: hasPerm ? '#388E3C' : '#D32F2F',
                                  fontWeight: 'bold'
                                }}
                                onClick={() => handleTogglePermission(op.id, perm, hasPerm)}
                              >
                                {perm} {hasPerm ? '✓' : '✗'}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <button 
                          style={{ background: 'transparent', border: 'none', color: '#D32F2F', cursor: 'pointer' }}
                          onClick={() => handleDeleteOperator(op.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                      No operator terminals logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
