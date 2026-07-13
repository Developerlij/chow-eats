import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { ShoppingCart, Check, Bike, Coffee, Eye } from 'lucide-react';

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(list);
        
        // Keep selected order updated
        if (selectedOrder) {
          const updated = list.find(o => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedOrder]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      await update(orderRef, { status: newStatus });
      
      // If order is out for delivery, start a coordinate animation simulation in the database!
      if (newStatus === 'Rider Picked Up Order' || newStatus === 'Rider is Nearby') {
        simulateRiderMovement(orderId);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Simulates rider moving from restaurant coordinates to user coordinates in database
  const simulateRiderMovement = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const startLat = order.restaurant?.lat || 37.7882;
    const startLng = order.restaurant?.lng || -122.4324;
    const endLat = 37.7749; // Simulated user home
    const endLng = -122.4194;

    let step = 0;
    const totalSteps = 20;

    const timer = setInterval(async () => {
      step += 1;
      const fraction = step / totalSteps;
      const currentLat = startLat + (endLat - startLat) * fraction;
      const currentLng = startLng + (endLng - startLng) * fraction;

      try {
        const riderRef = ref(database, `orders/${orderId}/rider`);
        await update(riderRef, {
          lat: currentLat,
          lng: currentLng
        });

        // Automatically advance order status in database as they arrive!
        if (step === 10) {
          await update(ref(database, `orders/${orderId}`), { status: 'Rider is Nearby' });
        } else if (step === totalSteps) {
          await update(ref(database, `orders/${orderId}`), { status: 'Order Delivered' });
          clearInterval(timer);
        }
      } catch (err) {
        console.error("Simulation database write failed:", err);
        clearInterval(timer);
      }
    }, 1000);
  };

  return (
    <div>
      <div className="charts-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Left Side: Orders Table */}
        <div className="card">
          <div className="card-title">
            <span>Incoming Live Orders</span>
            <ShoppingCart size={18} color="#06C167" />
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Restaurant</th>
                  <th>Total Price</th>
                  <th>Items Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td><code style={{ fontSize: '12px' }}>{order.id.slice(0, 10)}...</code></td>
                      <td>{order.restaurant?.name || 'Chow Groceries'}</td>
                      <td style={{ fontWeight: 'bold' }}>${(order.total || 0).toFixed(2)}</td>
                      <td>{order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0} items</td>
                      <td>
                        <span className={`status-badge ${
                          order.status === 'Preparing' || order.status === 'Preparing Order' ? 'preparing' :
                          order.status === 'Order Delivered' ? 'delivered' : 'pickup'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-btn-group">
                          <button 
                            className="action-btn-small" 
                            onClick={() => setSelectedOrder(order)}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          
                          {order.status === 'Preparing' && (
                            <button 
                              className="action-btn-small action-btn-primary" 
                              onClick={() => updateOrderStatus(order.id, 'Preparing Order')}
                            >
                              Accept
                            </button>
                          )}

                          {order.status === 'Preparing Order' && (
                            <button 
                              className="action-btn-small action-btn-primary" 
                              style={{ backgroundColor: '#0288D1', borderColor: '#0288D1' }}
                              onClick={() => updateOrderStatus(order.id, 'Rider Picked Up Order')}
                            >
                              Dispatch Rider
                            </button>
                          )}

                          {(order.status === 'Rider Picked Up Order' || order.status === 'Rider is Nearby') && (
                            <button 
                              className="action-btn-small action-btn-primary" 
                              style={{ backgroundColor: '#388E3C', borderColor: '#388E3C' }}
                              onClick={() => updateOrderStatus(order.id, 'Order Delivered')}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                      No live client orders placed in the database. Open the mobile app and place an order to see it sync here in real-time!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Order Detail Panel */}
        <div className="card">
          <div className="card-title">Order Details</div>
          
          {selectedOrder ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>ORDER ID</h4>
                <p style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold' }}>{selectedOrder.id}</p>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>RESTAURANT</h4>
                <p style={{ fontSize: '15px', fontWeight: 'bold' }}>{selectedOrder.restaurant?.name || 'Chow Groceries'}</p>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>ITEMS LIST</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingBottom: '8px', borderBottom: '1px solid #f6f6f6' }}>
                      <span>{item.quantity} x {item.name}</span>
                      <span style={{ fontWeight: '500' }}>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid #eee' }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Total Amount</span>
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#06C167' }}>${(selectedOrder.total || 0).toFixed(2)}</span>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>PAYMENT METHOD</h4>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginTop: '4px' }}>
                  {selectedOrder.paymentMethod === 'Transfer' ? '🏦 Bank Transfer' : '💵 Cash on Delivery'}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>DELIVERY STATUS</h4>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px', gap: '8px' }}>
                  <span className={`status-badge ${
                    selectedOrder.status === 'Preparing' || selectedOrder.status === 'Preparing Order' ? 'preparing' :
                    selectedOrder.status === 'Order Delivered' ? 'delivered' : 'pickup'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '14px' }}>
              Select an order from the list to view its complete summary.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
