import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, push } from 'firebase/database';
import { Send, Bell, Users, Clock } from 'lucide-react';

export default function BroadcastHub() {
  const [broadcasts, setBroadcasts] = useState([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetCohort, setTargetCohort] = useState('All Users'); // 'All Users', 'Active Riders', 'Inactive Customers'

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Subscribe to Firebase real-time /broadcasts path
  useEffect(() => {
    const broadsRef = ref(database, 'broadcasts');
    const unsubscribe = onValue(broadsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort newest first
        list.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        setBroadcasts(list);
      } else {
        setBroadcasts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      setErrorMsg("Please provide both Title and Message for the broadcast.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const newBroadcast = {
      title,
      message,
      targetCohort,
      sentAt: new Date().toISOString()
    };

    try {
      const broadsRef = ref(database, 'broadcasts');
      await push(broadsRef, newBroadcast);
      setSuccessMsg(`Broadcast campaign "${title}" successfully sent to ${targetCohort}!`);
      setTitle('');
      setMessage('');
    } catch (err) {
      setErrorMsg("Broadcast failed to send: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="charts-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
      {/* Left: Compose Broadcast Form */}
      <div className="card">
        <div className="card-title">Compose Campaign</div>
        
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

        <form onSubmit={handleBroadcast}>
          <div className="form-group">
            <label>Campaign Title</label>
            <input 
              type="text" 
              className="form-control" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Free Delivery Weekend!" 
            />
          </div>

          <div className="form-group">
            <label>Target Audience Cohort</label>
            <select 
              className="form-control" 
              value={targetCohort} 
              onChange={e => setTargetCohort(e.target.value)}
            >
              <option value="All Users">All Registered Users</option>
              <option value="Active Riders">Active Delivery Riders</option>
              <option value="Inactive Customers">Inactive Customers (No orders in 7 days)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notification Message</label>
            <textarea 
              className="form-control" 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Type notification text..." 
              style={{ height: '100px', resize: 'none' }}
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
            <Send size={16} style={{ marginRight: '6px' }} />
            {loading ? 'Sending...' : 'Broadcast Notification'}
          </button>
        </form>
      </div>

      {/* Right: Broadcast Log History */}
      <div className="card">
        <div className="card-title">
          <Bell size={18} color="#06C167" style={{ marginRight: '8px' }} />
          Past Engagement Campaigns ({broadcasts.length})
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Title & Message</th>
                <th>Audience</th>
                <th>Date Sent</th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.length > 0 ? (
                broadcasts.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong style={{ display: 'block', color: '#1A1A1A' }}>{b.title}</strong>
                      <span style={{ fontSize: '12.5px', color: '#666' }}>{b.message}</span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#E8F5E9', color: '#06C167', fontWeight: 'bold' }}>
                        <Users size={12} />
                        {b.targetCohort}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {new Date(b.sentAt).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                    No broadcast campaigns dispatched yet. Use the composer form to send your first notification!
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
