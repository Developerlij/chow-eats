import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Bike, Navigation, Phone, Shield } from 'lucide-react';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    const driversRef = ref(database, 'drivers');
    const ordersRef = ref(database, 'orders');

    let registeredDrivers = [];
    let activeOrders = [];

    const mergeDriverData = (drvs, ords) => {
      const merged = drvs.map(driver => {
        // Look up if this driver has an active trip in the orders list
        const activeTrip = ords.find(o => 
          o.rider && 
          o.rider.name === driver.name && 
          (o.status === 'Preparing Order' || o.status === 'Rider Picked Up Order' || o.status === 'Rider is Nearby')
        );

        return {
          ...driver,
          tripStatus: activeTrip ? 'On Trip' : 'Online/Idle',
          // Show live coordinate streaming if on trip, otherwise default to 0
          lat: activeTrip?.rider?.lat || 0,
          lng: activeTrip?.rider?.lng || 0,
          activeOrderId: activeTrip ? activeTrip.id : null,
          restaurantName: activeTrip ? (activeTrip.restaurant?.name || 'Groceries') : '—'
        };
      });
      setDrivers(merged);
    };

    const unsubscribeDrivers = onValue(driversRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        registeredDrivers = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
      } else {
        registeredDrivers = [];
      }
      mergeDriverData(registeredDrivers, activeOrders);
    });

    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        activeOrders = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
      } else {
        activeOrders = [];
      }
      mergeDriverData(registeredDrivers, activeOrders);
    });

    return () => {
      unsubscribeDrivers();
      unsubscribeOrders();
    };
  }, []);

  return (
    <div className="card">
      <div className="card-title">
        <span>Registered Delivery Drivers ({drivers.length})</span>
        <Bike size={18} color="#06C167" />
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Vehicle Details</th>
              <th>Duty Status</th>
              <th>Live Coordinates</th>
              <th>Active Restaurant</th>
              <th>Current Trip ID</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length > 0 ? (
              drivers.map((driver) => (
                <tr key={driver.id}>
                  <td>
                    <img 
                      src={driver.image} 
                      alt={driver.name} 
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #06C167', backgroundColor: '#eee' }} 
                    />
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{driver.name}</td>
                  <td>
                    <span style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#555' }}>
                      <Phone size={12} />
                      {driver.phone}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', display: 'block', fontWeight: 'bold' }}>{driver.vehicle}</span>
                    <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>{driver.plate}</span>
                  </td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ 
                        color: driver.tripStatus === 'On Trip' ? '#0288D1' : '#06C167', 
                        backgroundColor: driver.tripStatus === 'On Trip' ? '#E1F5FE' : '#E8F5E9',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                    >
                      {driver.tripStatus}
                    </span>
                  </td>
                  <td>
                    {driver.tripStatus === 'On Trip' ? (
                      <span style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', color: '#0288D1', fontFamily: 'monospace' }}>
                        <Navigation size={12} style={{ marginRight: '4px' }} />
                        {driver.lat.toFixed(5)}, {driver.lng.toFixed(5)}
                      </span>
                    ) : (
                      <span style={{ color: '#aaa', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '13px' }}>{driver.restaurantName}</td>
                  <td>
                    {driver.activeOrderId ? (
                      <code style={{ fontSize: '12px' }}>{driver.activeOrderId.slice(0, 10)}...</code>
                    ) : (
                      <span style={{ color: '#aaa', fontSize: '13px' }}>None</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                  No delivery drivers registered in database yet. Open the Driver App to register your first rider!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
