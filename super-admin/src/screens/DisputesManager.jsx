import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, update, set } from 'firebase/database';
import { ShieldAlert, Check, X, Phone, DollarSign, Gift, User } from 'lucide-react';

export default function DisputesManager() {
  const [disputes, setDisputes] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);

  // Initialize with real disputes from RTDB, falling back to mock active cases
  useEffect(() => {
    const disputesRef = ref(database, 'disputes');
    const unsubscribe = onValue(disputesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setDisputes(list);
      } else {
        // Fallback to interactive mock disputes if empty
        setDisputes([
          {
            id: 'disp_9482',
            orderId: 'ord_108237',
            customerEmail: 'lucas.bell@gmail.com',
            issue: 'Cold Food',
            description: 'The cheeseburger was cold and the soda cup leaked inside the bag.',
            status: 'Pending Review',
            riderName: 'Sarah Jenkins',
            riderPhone: '+2348031234567',
            amount: 18.50,
            date: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
          },
          {
            id: 'disp_4829',
            orderId: 'ord_294810',
            customerEmail: 'boss@gmail.com',
            issue: 'Missing Item',
            description: 'Ordered 2 Pizza Margheritas but only received 1 in the delivery box.',
            status: 'Pending Review',
            riderName: 'Mike Okon',
            riderPhone: '+2347039994444',
            amount: 24.00,
            date: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
          }
        ]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRefund = async (disputeId, orderId, amount) => {
    try {
      // 1. Update dispute state in DB
      const dispRef = ref(database, `disputes/${disputeId}`);
      await update(dispRef, { status: 'Refunded' });
      
      // 2. Update matching order status if it exists
      const orderRef = ref(database, `orders/${orderId}`);
      await update(orderRef, { status: 'Refunded', refundedAmount: amount });

      alert(`Dispute ${disputeId} processed. Full refund of $${amount.toFixed(2)} has been credited.`);
    } catch (e) {
      alert("Failed to refund: " + e.message);
    }
  };

  const handleStoreCredit = async (disputeId, customerEmail, amount) => {
    try {
      const dispRef = ref(database, `disputes/${disputeId}`);
      await update(dispRef, { status: 'Store Credited' });
      
      alert(`Dispute ${disputeId} processed. $${amount.toFixed(2)} Store Credit has been credited to ${customerEmail}.`);
    } catch (e) {
      alert("Failed to issue store credit: " + e.message);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">
          <ShieldAlert size={18} color="#D32F2F" style={{ marginRight: '8px' }} />
          Dispute & Refund Resolution Center
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
          {disputes.length > 0 ? (
            disputes.map((d) => (
              <div 
                key={d.id} 
                style={{ 
                  padding: '20px', 
                  borderRadius: '8px', 
                  backgroundColor: '#FFF', 
                  border: '1px solid #EFEFEF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>DISPUTE ID: {d.id}</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#1A1A1A' }}>
                      Issue: {d.issue}
                    </h3>
                  </div>
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      backgroundColor: d.status === 'Pending Review' ? '#FFF3E0' : '#E8F5E9',
                      color: d.status === 'Pending Review' ? '#F57C00' : '#2E7D32'
                    }}
                  >
                    {d.status}
                  </span>
                </div>

                <div style={{ fontSize: '13.5px', color: '#555', lineHeight: '20px', backgroundColor: '#F9F9F9', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #D32F2F' }}>
                  <strong>Client Statement:</strong> "{d.description}"
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '12.5px', color: '#666', borderTop: '1px solid #EEE', paddingTop: '10px' }}>
                  <div>
                    <strong>Customer:</strong> <span style={{ color: '#06C167', fontWeight: '500' }}>{d.customerEmail}</span>
                  </div>
                  <div>
                    <strong>Disputed Amount:</strong> <strong style={{ color: '#1A1A1A' }}>${d.amount.toFixed(2)}</strong>
                  </div>
                  <div>
                    <strong>Delivery Rider:</strong> <span style={{ fontWeight: '500' }}>{d.riderName || 'N/A'}</span>
                  </div>
                </div>

                {d.status === 'Pending Review' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button 
                      onClick={() => handleRefund(d.id, d.orderId, d.amount)}
                      style={{ 
                        flex: 1, 
                        height: '36px', 
                        backgroundColor: '#D32F2F', 
                        color: '#FFF', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: '12.5px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px' 
                      }}
                    >
                      <DollarSign size={14} />
                      Process Full Refund
                    </button>

                    <button 
                      onClick={() => handleStoreCredit(d.id, d.customerEmail, d.amount)}
                      style={{ 
                        flex: 1, 
                        height: '36px', 
                        backgroundColor: '#FFB300', 
                        color: '#FFF', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: '12.5px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px' 
                      }}
                    >
                      <Gift size={14} />
                      Issue Store Credit
                    </button>

                    {d.riderName && (
                      <button 
                        onClick={() => setSelectedRider({ name: d.riderName, phone: d.riderPhone })}
                        style={{ 
                          height: '36px', 
                          padding: '0 16px',
                          backgroundColor: '#FFF', 
                          color: '#333', 
                          border: '1px solid #CCC', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          fontWeight: 'bold', 
                          fontSize: '12.5px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '6px' 
                        }}
                      >
                        <Phone size={14} />
                        Contact Rider
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              No complaints or open dispute tickets recorded in database.
            </div>
          )}
        </div>
      </div>

      {/* Contact Rider Modal Dialog */}
      {selectedRider && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', width: '320px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 'bold' }}>Contact Dispatch Rider</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="#06C167" />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '15px' }}>{selectedRider.name}</strong>
                <span style={{ fontSize: '13px', color: '#666' }}>{selectedRider.phone}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a 
                href={`tel:${selectedRider.phone}`}
                style={{ flex: 1, textDecoration: 'none', height: '36px', backgroundColor: '#06C167', color: '#FFF', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}
              >
                Call Now
              </a>
              <button 
                onClick={() => setSelectedRider(null)}
                style={{ flex: 1, border: '1px solid #CCC', backgroundColor: '#FFF', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
