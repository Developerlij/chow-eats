import React, { useState, useEffect } from 'react';
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

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time /broadcasts database node
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
        setNotifications(list);
      } else {
        // Mock fallback if empty so the screen always has demo alerts
        setNotifications([
          {
            id: 'mock_1',
            title: 'Welcome to ChowEats!',
            message: 'Order fresh meals and groceries delivered straight to your door in minutes.',
            sentAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'mock_2',
            title: '🎉 Free Delivery Weekend',
            message: 'Get free delivery on all restaurant orders above $15. Active until Sunday midnight!',
            sentAt: new Date(Date.now() - 3600000 * 24).toISOString()
          }
        ]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} /> {/* Spacer to align title center */}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06C167" />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <View key={notif.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.bellCircle}>
                    <Ionicons name="notifications" size={16} color="#06C167" />
                  </View>
                  <Text style={styles.cardTitle}>{notif.title}</Text>
                </View>
                <Text style={styles.cardMessage}>{notif.message}</Text>
                <Text style={styles.cardTime}>{formatTime(notif.sentAt)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#CCCCCC" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubText}>Announcements from ChowEats managers will appear here.</Text>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bellCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6FAF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  cardMessage: {
    fontSize: 13.5,
    color: '#555555',
    lineHeight: 18,
    marginBottom: 8,
    paddingLeft: 38,
  },
  cardTime: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'right',
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
