import React, { useContext, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  Platform,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DeliveryMap from '../components/DeliveryMap';
import { BasketContext } from '../context/BasketContext';
import FooterNavbar from '../components/FooterNavbar';
import { ref, onValue } from 'firebase/database';
import { database, isMockFirebase } from '../../firebase';
import * as Notifications from 'expo-notifications';

// Configure standard notification display configuration for active foreground states
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function DeliveryScreen() {
  const navigation = useNavigation();
  const { restaurant, activeOrderId } = useContext(BasketContext);

  // Fallback coords if no restaurant detail was cached
  const restaurantCoords = {
    latitude: restaurant?.lat || 37.7882,
    longitude: restaurant?.lng || -122.4324,
    name: restaurant?.name || "Nonna's Pizzeria"
  };

  const userCoords = {
    latitude: 37.7749,
    longitude: -122.4194,
    name: "Your Home"
  };

  const mapRegion = {
    latitude: (restaurantCoords.latitude + userCoords.latitude) / 2,
    longitude: (restaurantCoords.longitude + userCoords.longitude) / 2,
    latitudeDelta: Math.abs(restaurantCoords.latitude - userCoords.latitude) * 2,
    longitudeDelta: Math.abs(restaurantCoords.longitude - userCoords.longitude) * 2,
  };

  const [orderStatus, setOrderStatus] = useState("Preparing");
  const [riderLocation, setRiderLocation] = useState({
    latitude: restaurantCoords.latitude,
    longitude: restaurantCoords.longitude
  });

  useEffect(() => {
    if (!isMockFirebase && database && activeOrderId) {
      // Real-time Database Order Status & Rider Coordinate Listener
      const orderRef = ref(database, `orders/${activeOrderId}`);
      const unsubscribe = onValue(orderRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (data.status) setOrderStatus(data.status);
          if (data.rider && data.rider.lat && data.rider.lng) {
            setRiderLocation({
              latitude: data.rider.lat,
              longitude: data.rider.lng
            });
          }
        }
      });
      return () => unsubscribe();
    } else {
      // Mock Sandbox Mode: Simulates rider travelling from restaurant to destination over 20s
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 1;
        
        if (elapsed < 5) {
          setOrderStatus("Preparing Order");
        } else if (elapsed < 12) {
          setOrderStatus("Rider Picked Up Order");
        } else if (elapsed < 18) {
          setOrderStatus("Rider is Nearby");
        } else {
          setOrderStatus("Order Delivered");
          clearInterval(interval);
        }

        const fraction = Math.min(elapsed / 20, 1);
        const latDiff = userCoords.latitude - restaurantCoords.latitude;
        const lngDiff = userCoords.longitude - restaurantCoords.longitude;
        
        setRiderLocation({
          latitude: restaurantCoords.latitude + latDiff * fraction,
          longitude: restaurantCoords.longitude + lngDiff * fraction
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeOrderId]);

  // Helper to calculate estimated travel minutes from Haversine distance
  const getRemainingTime = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    
    // Assume average speed is 30km/h (0.5 km per min) + 2 min handoff padding
    const mins = Math.round(distance / 0.5) + 2;
    return Math.max(1, mins);
  };

  // Request notifications permissions on screen mount
  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS !== 'web') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn("Local notification permissions not granted by user.");
        }
      }
    }
    requestPermissions();
  }, []);

  // Monitor orderStatus and riderLocation changes to trigger/update notification bar details
  useEffect(() => {
    const isEnRoute = 
      orderStatus === "Rider Picked Up Order" || 
      orderStatus === "Rider is Nearby" || 
      orderStatus === "Driver on the way" || 
      orderStatus === "Picked Up";

    if (isEnRoute && riderLocation && userCoords) {
      const minsRemaining = getRemainingTime(
        riderLocation.latitude, 
        riderLocation.longitude, 
        userCoords.latitude, 
        userCoords.longitude
      );

      Notifications.scheduleNotificationAsync({
        identifier: 'active-order-tracking',
        content: {
          title: orderStatus === "Rider is Nearby" ? "Rider is nearby! 🚴" : "Chow Eats: Rider en route! 🚴",
          body: `Estimated arrival: ${minsRemaining} mins remaining.`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null
      }).catch(() => {});
    } else if (orderStatus === "Order Delivered") {
      // Dismiss active rider en-route progress notifications and push final alert
      Notifications.dismissNotificationAsync('active-order-tracking').catch(() => {});
      
      Notifications.scheduleNotificationAsync({
        identifier: 'order-delivered-alert',
        content: {
          title: "Order Delivered! 🎉",
          body: "Your hot meal has arrived. Bon appétit!",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null
      }).catch(() => {});
    }
  }, [orderStatus, riderLocation]);

  const handleCallRider = () => {
    Linking.openURL('tel:1234567890').catch((err) => {
      console.warn("Phone dialer not supported on this device:", err);
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Banner overlay */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.bannerContainer}>
          <View style={styles.bannerHeaderRow}>
            <TouchableOpacity 
              style={styles.closeBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
            <Text style={styles.helpText}>Order Help</Text>
          </View>
          
          <View style={styles.etaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaTime}>30-40 Minutes</Text>
            </View>
            <Ionicons name="bicycle" size={32} color="#06C167" />
          </View>

          {/* Simulated progress tracker */}
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.progressStatusText}>{orderStatus}</Text>
        </View>
      </SafeAreaView>

      {/* Map View */}
      <DeliveryMap
        style={styles.mapView}
        region={mapRegion}
        restaurantCoords={restaurantCoords}
        userCoords={userCoords}
        riderLocation={riderLocation}
      />

      {/* Bottom Driver Card */}
      <SafeAreaView style={styles.bottomSafeArea}>
        <View style={styles.driverCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }}
            style={styles.driverAvatar}
          />
          
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>Sarah Jenkins</Text>
            <Text style={styles.driverTitle}>Your Rider</Text>
          </View>

          <View style={styles.driverActions}>
            <TouchableOpacity 
              style={styles.actionBtnCircle}
              onPress={handleCallRider}
            >
              <Ionicons name="call" size={20} color="#06C167" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionBtnCircle, { marginLeft: 12 }]}>
              <Ionicons name="chatbubble" size={20} color="#888888" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <FooterNavbar activeTab="Tracking" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  bannerContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  etaLabel: {
    fontSize: 13,
    color: '#666666',
  },
  etaTime: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 2,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EEEEEE',
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '40%', // Initial simulated progress
    height: '100%',
    backgroundColor: '#06C167',
    borderRadius: 3,
  },
  progressStatusText: {
    fontSize: 13,
    color: '#666666',
  },
  mapView: {
    flex: 1,
  },
  simulatedMapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEAEA',
    padding: 24,
  },
  simulatedMapText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  simulatedDetails: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    maxWidth: 320,
  },
  simDetailsText: {
    fontSize: 14,
    color: '#444444',
    marginVertical: 4,
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 50,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F3F3',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  driverTitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  driverActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
