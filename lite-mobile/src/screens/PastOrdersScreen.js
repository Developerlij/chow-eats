import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase';
import { AuthContext } from '../context/AuthContext';

export default function PastOrdersScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time /orders node, filtering for current user
  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Filter orders placed by this user's email
        const userEmail = user?.email || 'guest@example.com';
        const filtered = list.filter(o => o.userEmail === userEmail);
        
        // Sort newest first
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(filtered);
      } else {
        // Mock fallback past orders for Sandbox/Guest
        setOrders([
          {
            id: 'ord_mock_1',
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
            restaurant: { name: 'Gourmet Burger Bistro' },
            items: [
              { name: 'Craft Cheeseburger', quantity: 2 },
              { name: 'Truffle Fries', quantity: 1 }
            ],
            total: 28.50,
            status: 'Order Delivered',
            paymentMethod: 'Cash'
          },
          {
            id: 'ord_mock_2',
            createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
            restaurant: { name: 'Pizzeria Bella' },
            items: [
              { name: 'Pizza Margherita', quantity: 1 },
              { name: 'Garlic Bread', quantity: 1 }
            ],
            total: 19.00,
            status: 'Order Delivered',
            paymentMethod: 'Transfer'
          }
        ]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Delivered':
        return '#2E7D32';
      case 'Refunded':
        return '#D32F2F';
      case 'Preparing':
      case 'Preparing Order':
        return '#F57C00';
      default:
        return '#0288D1';
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06C167" />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {orders.length > 0 ? (
            orders.map((order) => (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.restaurantName}>{order.restaurant?.name || 'Groceries Order'}</Text>
                    <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Items List */}
                <View style={styles.itemsContainer}>
                  {order.items && order.items.map((item, idx) => (
                    <Text key={idx} style={styles.itemRow}>
                      <Text style={styles.quantity}>{item.quantity}x</Text>  {item.name}
                    </Text>
                  ))}
                </View>

                <View style={styles.divider} />

                {/* Footer totals */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.paymentMethod}>
                    {order.paymentMethod === 'Transfer' ? '🏦 Bank Transfer' : '💵 Cash on Delivery'}
                  </Text>
                  <Text style={styles.totalPrice}>Total: ${order.total ? order.total.toFixed(2) : '0.00'}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#CCCCCC" />
              <Text style={styles.emptyText}>No orders placed yet</Text>
              <Text style={styles.emptySubText}>Items you order from restaurants or grocery stores will be listed here.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  orderTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  itemsContainer: {
    gap: 6,
  },
  itemRow: {
    fontSize: 14,
    color: '#444444',
  },
  quantity: {
    fontWeight: 'bold',
    color: '#06C167',
  },
  paymentMethod: {
    fontSize: 13,
    color: '#666666',
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 6,
  },
});
