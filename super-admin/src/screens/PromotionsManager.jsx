import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, remove } from 'firebase/database';
import { Percent, Plus, Trash2, Ticket, Tag } from 'lucide-react';

export default function PromotionsManager() {
  const [promos, setPromos] = useState([]);
  
  // Form input states
  const [code, setCode] = useState('');
  const [type, setType] = useState('Percentage'); // 'Percentage' or 'Fixed'
  const [value, setValue] = useState('');
  const [minSpend, setMinSpend] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Subscribe to Firebase real-time /promotions database path
  useEffect(() => {
    const promoRef = ref(database, 'promotions');
    const unsubscribe = onValue(promoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setPromos(list);
      } else {
        setPromos([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Add a new discount voucher code
  const handleAddPromo = async (e) => {
    e.preventDefault();
    if (!code || !value || !minSpend) {
      setErrorMsg("Please fill in Code, Discount Value, and Minimum Spend.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanedCode = code.toUpperCase().replace(/\s+/g, '');
    const promoId = cleanedCode;

    const newPromo = {
      id: promoId,
      code: cleanedCode,
      type,
      value: parseFloat(value),
      minSpend: parseFloat(minSpend),
      createdAt: new Date().toISOString()
    };

    try {
      await set(ref(database, `promotions/${promoId}`), newPromo);
      setSuccessMsg(`Promo code "${cleanedCode}" successfully activated!`);
      // Reset form
      setCode('');
      setValue('');
      setMinSpend('');
    } catch (err) {
      setErrorMsg("Failed to save promotion: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete a promotion voucher code
  const handleDeletePromo = async (promoId) => {
    if (window.confirm("Are you sure you want to deactivate and delete this promotion?")) {
      try {
        await remove(ref(database, `promotions/${promoId}`));
      } catch (err) {
        console.error("Deleting promo failed:", err);
      }
    }
  };

  return (
    <div className="charts-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
      {/* Left: Add Promo Voucher Card */}
      <div className="card">
        <div className="card-title">Create Discount Voucher</div>
        
        {successMsg && (
          <div style={{ padding: '10px', backgroundColor: '#E8F5E9', color: '#2E7D32', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', fontWeight: '500' }}>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '10px', backgroundColor: '#FFEBEE', color: '#C62828', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', fontWeight: '500' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAddPromo}>
          <div className="form-group">
            <label>Promo Code (Uppercase)</label>
            <input 
              type="text" 
              className="form-control" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              placeholder="e.g. CHOWNEW50" 
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div className="form-group">
            <label>Discount Type</label>
            <select 
              className="form-control" 
              value={type} 
              onChange={e => setType(e.target.value)}
            >
              <option value="Percentage">Percentage (%)</option>
              <option value="Fixed">Fixed Amount ($)</option>
            </select>
          </div>

          <div className="form-group">
            <label>{type === 'Percentage' ? 'Discount Value (%)' : 'Discount Value ($)'}</label>
            <input 
              type="number" 
              step="0.01"
              className="form-control" 
              value={value} 
              onChange={e => setValue(e.target.value)} 
              placeholder={type === 'Percentage' ? 'e.g. 15' : 'e.g. 5.00'} 
            />
          </div>

          <div className="form-group">
            <label>Minimum Order Spend ($)</label>
            <input 
              type="number" 
              step="0.01"
              className="form-control" 
              value={minSpend} 
              onChange={e => setMinSpend(e.target.value)} 
              placeholder="e.g. 15.00" 
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            <Plus size={16} style={{ marginRight: '6px' }} />
            {loading ? 'Activating...' : 'Activate Promo Code'}
          </button>
        </form>
      </div>

      {/* Right: Active Promos Table */}
      <div className="card">
        <div className="card-title">
          <Ticket size={18} color="#06C167" style={{ marginRight: '8px' }} />
          Active Promotions ({promos.length})
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Code Name</th>
                <th>Type</th>
                <th>Discount Amount</th>
                <th>Min Spend Required</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.length > 0 ? (
                promos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#06C167' }}>
                        <Tag size={14} />
                        {p.code}
                      </span>
                    </td>
                    <td>{p.type}</td>
                    <td style={{ fontWeight: 'bold' }}>
                      {p.type === 'Percentage' ? `${p.value}%` : `$${p.value.toFixed(2)}`}
                    </td>
                    <td>${p.minSpend.toFixed(2)}</td>
                    <td>
                      <button 
                        onClick={() => handleDeletePromo(p.id)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: '#D32F2F', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '13px'
                        }}
                      >
                        <Trash2 size={14} />
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                    No active promotional codes registered in database. Use the creation form to configure active vouchers!
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
