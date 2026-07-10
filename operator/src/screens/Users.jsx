import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Users as UsersIcon, ShoppingBag, DollarSign, Calendar } from 'lucide-react';

export default function Users() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const ordersRef = ref(database, 'orders');

    let registeredUsers = {};
    let ordersList = [];

    const processCustomerStats = (users, orders) => {
      // Create a map to group purchases by email/user identifier
      const customerMap = {};

      // 1. Initialize map with registered users
      Object.keys(users).forEach(uid => {
        const u = users[uid];
        const emailKey = u.email && u.email !== 'Phone User' ? u.email : (u.phoneNumber || u.uid);
        customerMap[emailKey] = {
          identifier: emailKey,
          joinedAt: u.joinedAt || new Date().toISOString(),
          ordersCount: 0,
          totalSpent: 0,
          purchasedItems: [],
          lastActive: u.joinedAt || '—'
        };
      });

      // 2. Scan orders to calculate spend and purchases
      orders.forEach(order => {
        // Group by user email or user ID
        const emailKey = order.userEmail || order.userId || 'Guest User';
        
        if (!customerMap[emailKey]) {
          customerMap[emailKey] = {
            identifier: emailKey,
            joinedAt: order.createdAt || new Date().toISOString(),
            ordersCount: 0,
            totalSpent: 0,
            purchasedItems: [],
            lastActive: order.createdAt
          };
        }

        const customer = customerMap[emailKey];
        customer.ordersCount += 1;
        customer.totalSpent += order.total || 0;
        
        if (new Date(order.createdAt) > new Date(customer.lastActive)) {
          customer.lastActive = order.createdAt;
        }

        // Add dishes/items to purchased items list
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const existing = customer.purchasedItems.find(i => i.name === item.name);
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              customer.purchasedItems.push({
                name: item.name,
                quantity: item.quantity
              });
            }
          });
        }
      });

      // Convert map to array and sort by highest spend first
      const statsList = Object.values(customerMap);
      statsList.sort((a, b) => b.totalSpent - a.totalSpent);
      setCustomers(statsList);
    };

    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      registeredUsers = data || {};
      processCustomerStats(registeredUsers, ordersList);
    });

    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        ordersList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
      } else {
        ordersList = [];
      }
      processCustomerStats(registeredUsers, ordersList);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeOrders();
    };
  }, []);

  return (
    <div className="card">
      <div className="card-title">
        <span>Customers Directory & Analytics</span>
        <UsersIcon size={18} color="#06C167" />
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Customer Identifier</th>
              <th>Date Joined</th>
              <th>Orders Count</th>
              <th>Lifetime Spend</th>
              <th>Purchased Food Items</th>
              <th>Last Active Date</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map((cust, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 'bold', color: '#1A1A1A' }}>👤 {cust.identifier}</td>
                  <td style={{ fontSize: '13px', color: '#666' }}>
                    {cust.joinedAt ? new Date(cust.joinedAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    <span style={{ padding: '4px 10px', backgroundColor: '#F0F9F4', color: '#06C167', borderRadius: '12px', fontSize: '12px' }}>
                      {cust.ordersCount} orders
                    </span>
                  </td>
                  <td style={{ fontWeight: '800', color: '#06C167' }}>
                    ${cust.totalSpent.toFixed(2)}
                  </td>
                  <td style={{ maxWidth: '300px', fontSize: '13px', color: '#555' }}>
                    {cust.purchasedItems.length > 0 ? (
                      cust.purchasedItems.map((item, i) => (
                        <span key={i} style={{ display: 'inline-block', backgroundColor: '#F5F5F5', padding: '2px 6px', borderRadius: '4px', margin: '2px', fontSize: '11px', fontWeight: '600' }}>
                          {item.quantity}x {item.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#aaa', fontStyle: 'italic' }}>No purchases yet</span>
                    )}
                  </td>
                  <td style={{ fontSize: '13px', color: '#666' }}>
                    {cust.lastActive !== '—' ? new Date(cust.lastActive).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                  No customer registrations or orders found in database yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
