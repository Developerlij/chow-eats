import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Bike, Navigation, MapPin } from 'lucide-react';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Collect all assigned riders and map their active status
        const riderMap = {};
        
        orderList.forEach(order => {
          if (order.rider && order.rider.name) {
            const riderName = order.rider.name;
            const isDeliveryActive = order.status === 'Rider Picked Up Order' || order.status === 'Rider is Nearby';
            
            // If rider is already mapped, only overwrite with active delivery info
            if (!riderMap[riderName] || isDeliveryActive) {
              riderMap[riderName] = {
                name: riderName,
                lat: order.rider.lat || 37.7882,
                lng: order.rider.lng || -122.4324,
                activeOrderId: isDeliveryActive ? order.id : null,
                status: isDeliveryActive ? 'On Trip' : 'Offline/Idle',
                restaurantName: order.restaurant?.name || 'Groceries'
              };
            }
          }
        });

        // Convert map to array
        setDrivers(Object.values(riderMap));
      } else {
        // Fallback placeholder driver if database is empty
        setDrivers([
          {
            name: 'Sarah Jenkins',
            lat: 37.7882,
            lng: -122.4324,
            activeOrderId: null,
            status: 'Offline/Idle',
            restaurantName: ''
          }
        ]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="card">
      <div className="card-title">
        <span>Active Delivery Riders</span>
        <Bike size={18} color="#06C167" />
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Rider Name</th>
              <th>Status</th>
              <th>Assigned Restaurant</th>
              <th>Current Coordinates</th>
              <th>Trip ID</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 'bold' }}>🏍️ {driver.name}</td>
                <td>
                  <span className={`status-badge ${
                    driver.status === 'On Trip' ? 'pickup' : 'delivered'
                  }`} style={{ color: driver.status === 'On Trip' ? '#0288D1' : '#666', backgroundColor: driver.status === 'On Trip' ? '#E1F5FE' : '#F0F0F0' }}>
                    {driver.status}
                  </span>
                </td>
                <td>{driver.status === 'On Trip' ? driver.restaurantName : '—'}</td>
                <td>
                  <span style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', color: '#666' }}>
                    <Navigation size={12} style={{ marginRight: '4px' }} />
                    {driver.lat.toFixed(6)}, {driver.lng.toFixed(6)}
                  </span>
                </td>
                <td>
                  {driver.activeOrderId ? (
                    <code style={{ fontSize: '12px' }}>{driver.activeOrderId.slice(0, 12)}...</code>
                  ) : (
                    <span style={{ color: '#aaa' }}>None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
