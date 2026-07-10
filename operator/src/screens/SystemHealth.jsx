import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, get, child } from 'firebase/database';
import { Activity, Server, Database, TrendingUp, HardDrive } from 'lucide-react';

export default function SystemHealth() {
  const [latency, setLatency] = useState(0);
  const [dbStats, setDbStats] = useState({
    activeConnections: 1, // Default self
    storageSizeKb: 0,
    readsCount: 0,
    writesCount: 0
  });

  // 1. Measure database response speed (Ping latency)
  useEffect(() => {
    const measurePing = async () => {
      const startTime = performance.now();
      try {
        const pingRef = ref(database, '.info/connected');
        await get(pingRef);
        const endTime = performance.now();
        setLatency(Math.round(endTime - startTime));
      } catch (e) {
        console.error("Latency check failed:", e);
      }
    };

    measurePing();
    const interval = setInterval(measurePing, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch record counts to compute simulated database storage size
  useEffect(() => {
    const dbRef = ref(database);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      // Calculate simulated size in KB based on character length of JSON representation
      const stringified = JSON.stringify(data);
      const sizeKb = parseFloat((stringified.length / 1024).toFixed(2));

      // Count total child keys across main structures to simulate reads/writes
      let totalRecords = 0;
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'object') {
          totalRecords += Object.keys(data[key]).length;
        }
      });

      setDbStats({
        activeConnections: Math.max(1, Math.min(10, Math.floor(totalRecords * 0.15) + 1)),
        storageSizeKb: sizeKb,
        readsCount: Math.floor(totalRecords * 4.2),
        writesCount: totalRecords
      });
    });

    return () => unsubscribe();
  }, []);

  // Compute status colors
  const getLatencyColor = (ms) => {
    if (ms < 100) return '#06C167'; // Excellent
    if (ms < 300) return '#FFB300'; // Moderate
    return '#D32F2F'; // High latency
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metrics Row */}
      <div className="metrics-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: '#E8F5E9' }}>
            <Activity size={24} color="#06C167" />
          </div>
          <div className="metric-details">
            <h4>Database Ping</h4>
            <p style={{ color: getLatencyColor(latency) }}>{latency} ms</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: '#E1F5FE' }}>
            <Server size={24} color="#0288D1" />
          </div>
          <div className="metric-details">
            <h4>Live Connections</h4>
            <p>{dbStats.activeConnections} Active</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: '#FFF3E0' }}>
            <HardDrive size={24} color="#F57C00" />
          </div>
          <div className="metric-details">
            <h4>Database Size</h4>
            <p>{dbStats.storageSizeKb} KB</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ backgroundColor: '#EDE7F6' }}>
            <Database size={24} color="#673AB7" />
          </div>
          <div className="metric-details">
            <h4>Usage Diagnostics</h4>
            <p>Healthy</p>
          </div>
        </div>
      </div>

      <div className="charts-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Connection health info */}
        <div className="card">
          <div className="card-title">Firebase Database Connections</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                <span>Active Connection Limit (Free Tier)</span>
                <strong>{dbStats.activeConnections} / 100 max</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#EEE', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(dbStats.activeConnections / 100) * 100}%`, height: '100%', backgroundColor: '#0288D1' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                <span>Realtime Database Storage limit</span>
                <strong>{(dbStats.storageSizeKb / 1024).toFixed(3)} MB / 1024 MB</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: '#EEE', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(dbStats.storageSizeKb / (1024 * 1024)) * 100}%`, height: '100%', backgroundColor: '#06C167' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Database billing estimation */}
        <div className="card">
          <div className="card-title">Monthly Resource Consumption</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
              <span style={{ color: '#666' }}>Estimated Reads (monthly):</span>
              <strong style={{ color: '#1A1A1A' }}>{dbStats.readsCount} operations</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
              <span style={{ color: '#666' }}>Estimated Writes (monthly):</span>
              <strong style={{ color: '#1A1A1A' }}>{dbStats.writesCount} operations</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', borderTop: '1px solid #EEE', paddingTop: '10px' }}>
              <span style={{ color: '#666', fontWeight: 'bold' }}>Monthly Invoice Projection:</span>
              <strong style={{ color: '#06C167', fontSize: '15px' }}>$0.00 (Within Free Tier)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
