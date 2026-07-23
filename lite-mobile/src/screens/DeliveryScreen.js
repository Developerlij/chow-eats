import React, { useContext, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  Platform,
  Linking,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DeliveryMap from '../components/DeliveryMap';
import { BasketContext } from '../context/BasketContext';
import { AuthContext } from '../context/AuthContext';
import FooterNavbar from '../components/FooterNavbar';
import { ref, onValue } from 'firebase/database';
import { database, isMockFirebase } from '../../firebase';
let Notifications = null;
try {
  // Expo Go (since SDK 53) does not support remote push notifications and crashes during import.
  // We wrap it in a try-catch to allow the app to run safely.
  Notifications = require('expo-notifications');
  
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch (e) {
  console.warn("expo-notifications is not supported in this environment:", e);
}

export default function DeliveryScreen() {
  const navigation = useNavigation();
  const { restaurant, activeOrderId, timeLeft } = useContext(BasketContext);
  const { user } = useContext(AuthContext);
  const userId = user?.uid || 'guest_user';

  // Fallback coords if no restaurant detail was cached
  const restaurantCoords = {
    latitude: restaurant?.lat || 37.7882,
    longitude: restaurant?.lng || -122.4324,
    name: restaurant?.name || "Nonna's Pizzeria"
  };

  // State-driven user location to support dynamic location matching
  const [userCoords, setUserCoords] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    name: "Your Home"
  });

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

  // Dynamic Driver states
  const [hasRider, setHasRider] = useState(false);
  const [riderInfo, setRiderInfo] = useState({
    name: 'Sarah Jenkins',
    phone: '1234567890',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  });

  // Real-time Chat States & Refs
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm your delivery partner. I'll keep you updated on your order.",
      sender: 'rider',
      timestamp: new Date()
    }
  ]);
  const scrollViewRef = React.useRef(null);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessageId = Math.random().toString(36).substring(2, 9);
    const userMsgObj = {
      id: userMessageId,
      text: chatInput.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsgObj]);
    const typedText = chatInput.trim().toLowerCase();
    setChatInput('');

    // Simulate Rider Auto-Response:
    setTimeout(() => {
      let replyText = "Got it! Thanks.";

      if (typedText.includes("extra") || typedText.includes("sauce") || typedText.includes("condiment")) {
        replyText = "I will request extra sauces from the merchant right now if they haven't sealed it yet!";
      } else if (typedText.includes("gate") || typedText.includes("code") || typedText.includes("door") || typedText.includes("bell") || typedText.includes("ring")) {
        replyText = "Understood. Thanks for the drop-off details!";
      } else if (typedText.includes("hot") || typedText.includes("cold") || typedText.includes("fresh")) {
        replyText = "I've got it inside my thermal insulated bag, so it will stay fresh and hot!";
      } else if (typedText.includes("where") || typedText.includes("status") || typedText.includes("far")) {
        const elapsed = 1500 - timeLeft;
        if (elapsed <= 600) {
          replyText = "I'm still at the restaurant waiting for the kitchen to finish preparing your food.";
        } else {
          replyText = "I'm on the road heading to your address now!";
        }
      } else {
        const elapsed = 1500 - timeLeft;
        if (elapsed <= 600) {
          replyText = "Sure, I'm heading to the restaurant to collect your fresh food now.";
        } else if (elapsed <= 1380) {
          replyText = "Alright! I've picked up your order and I'm riding your way.";
        } else {
          replyText = "I'm almost at your door, see you in a minute!";
        }
      }

      setChatMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        text: replyText,
        sender: 'rider',
        timestamp: new Date()
      }]);
    }, 2000); // 2 second realistic delay
  };

  // 1. Fetch user live coordinates from Firebase RTDB
  useEffect(() => {
    if (!isMockFirebase && database) {
      const userLocRef = ref(database, `userLocations/${userId}`);
      const unsubscribeUserLoc = onValue(userLocRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.lat && data.lng) {
          setUserCoords({
            latitude: data.lat,
            longitude: data.lng,
            name: "Your Location"
          });
        }
      });
      return () => unsubscribeUserLoc();
    }
  }, [userId]);

  // 2. Real-time Database Order Status & Rider Coordinate Listener
  useEffect(() => {
    if (!isMockFirebase && database && activeOrderId) {
      const orderRef = ref(database, `orders/${activeOrderId}`);
      const unsubscribe = onValue(orderRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (data.status) setOrderStatus(data.status);
          
          if (data.rider) {
            setHasRider(true);
            setRiderInfo({
              name: data.rider.name || 'Dispatched Rider',
              phone: data.rider.phone || '1234567890',
              image: data.rider.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            });
            if (data.rider.lat && data.rider.lng) {
              setRiderLocation({
                latitude: data.rider.lat,
                longitude: data.rider.lng
              });
            }
          } else {
            setHasRider(false);
            setRiderLocation({
              latitude: restaurantCoords.latitude,
              longitude: restaurantCoords.longitude
            });
          }
        }
      });
      return () => unsubscribe();
    } else {
      // Mock Sandbox Mode: Synced with real-time 1500s global countdown (10m prep + 15m delivery)
      setHasRider(true);
      setRiderInfo({
        name: 'Sarah Jenkins (Sandbox)',
        phone: '1234567890',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      });

      const initialRiderLat = restaurantCoords.latitude + 0.008;
      const initialRiderLng = restaurantCoords.longitude - 0.008;

      const elapsed = 1500 - timeLeft;

      if (elapsed <= 600) {
        setOrderStatus("Preparing Order");
        const fraction = elapsed / 600;
        setRiderLocation({
          latitude: initialRiderLat + (restaurantCoords.latitude - initialRiderLat) * fraction,
          longitude: initialRiderLng + (restaurantCoords.longitude - initialRiderLng) * fraction
        });
      } else if (elapsed <= 1380) {
        setOrderStatus("Rider Picked Up Order");
        const fraction = (elapsed - 600) / 900;
        setRiderLocation({
          latitude: restaurantCoords.latitude + (userCoords.latitude - restaurantCoords.latitude) * fraction,
          longitude: restaurantCoords.longitude + (userCoords.longitude - restaurantCoords.longitude) * fraction
        });
      } else if (elapsed < 1500) {
        setOrderStatus("Rider is Nearby");
        setRiderLocation({
          latitude: userCoords.latitude,
          longitude: userCoords.longitude
        });
      } else {
        setOrderStatus("Order Delivered");
        setRiderLocation({
          latitude: userCoords.latitude,
          longitude: userCoords.longitude
        });
      }
    }
  }, [activeOrderId, userCoords.latitude, userCoords.longitude, timeLeft]);

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
      if (Platform.OS !== 'web' && Notifications && Notifications.requestPermissionsAsync) {
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            console.warn("Local notification permissions not granted by user.");
          }
        } catch (e) {
          console.warn("Failed to request permissions:", e);
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

      if (Notifications && Notifications.scheduleNotificationAsync) {
        Notifications.scheduleNotificationAsync({
          identifier: 'active-order-tracking',
          content: {
            title: orderStatus === "Rider is Nearby" ? "Rider is nearby! 🚴" : "Chow Eats: Rider en route! 🚴",
            body: `Estimated arrival: ${minsRemaining} mins remaining.`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority?.HIGH || 4,
          },
          trigger: null
        }).catch(() => {});
      }
    } else if (orderStatus === "Order Delivered") {
      // Dismiss active rider en-route progress notifications and push final alert
      if (Notifications && Notifications.dismissNotificationAsync) {
        Notifications.dismissNotificationAsync('active-order-tracking').catch(() => {});
      }
      
      if (Notifications && Notifications.scheduleNotificationAsync) {
        Notifications.scheduleNotificationAsync({
          identifier: 'order-delivered-alert',
          content: {
            title: "Order Delivered! 🎉",
            body: "Your hot meal has arrived. Bon appétit!",
            sound: true,
            priority: Notifications.AndroidNotificationPriority?.HIGH || 4,
          },
          trigger: null
        }).catch(() => {});
      }
    }
  }, [orderStatus, riderLocation, userCoords.latitude, userCoords.longitude]);

  const handleCallRider = () => {
    if (!hasRider) {
      Alert.alert("Rider Not Assigned", "We are currently locating a nearby dispatch partner for your order.");
      return;
    }
    Linking.openURL(`tel:${riderInfo.phone}`).catch((err) => {
      console.warn("Phone dialer not supported on this device:", err);
    });
  };

  // Uber-style dual-phase remaining delivery time calculations
  const getETADisplay = () => {
    if (!hasRider) return "Assigning Rider...";
    if (isMockFirebase) {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      const secsStr = secs < 10 ? `0${secs}` : secs;
      return `${mins}:${secsStr}`;
    }

    const isHeadingToStore = 
      orderStatus === "Preparing" || 
      orderStatus === "Preparing Order" || 
      orderStatus === "Ready for Pickup";

    if (isHeadingToStore) {
      // Phase 1: Rider travels from current coordinates to the restaurant to fetch order
      const minsToStore = getRemainingTime(
        riderLocation.latitude,
        riderLocation.longitude,
        restaurantCoords.latitude,
        restaurantCoords.longitude
      );
      // Total delivery ETA = travel to store + 8 minutes restaurant prep buffer
      return `${minsToStore + 8} Minutes`;
    } else {
      // Phase 2: Rider picked up food and is traveling directly to user's home
      const minsToUser = getRemainingTime(
        riderLocation.latitude,
        riderLocation.longitude,
        userCoords.latitude,
        userCoords.longitude
      );
      return `${minsToUser} Minutes`;
    }
  };

  // Uber-style dual-phase status label
  const getStatusLabel = () => {
    if (!hasRider) return "Awaiting merchant dispatch partner assignment...";
    if (isMockFirebase) {
      const elapsed = 1500 - timeLeft;
      if (elapsed <= 600) {
        const remainingPrep = Math.ceil((600 - elapsed) / 60);
        return `Preparing Order (ready in ${remainingPrep} mins)`;
      } else {
        const remainingDelivery = Math.ceil((1500 - elapsed) / 60);
        return `Rider heading to you (arriving in ${remainingDelivery} mins)`;
      }
    }
    
    if (orderStatus === "Preparing" || orderStatus === "Preparing Order") {
      const minsToStore = getRemainingTime(
        riderLocation.latitude,
        riderLocation.longitude,
        restaurantCoords.latitude,
        restaurantCoords.longitude
      );
      return `Rider heading to store (arriving in ${minsToStore} mins)`;
    }
    if (orderStatus === "Rider Picked Up Order" || orderStatus === "Driver on the way") {
      const minsToUser = getRemainingTime(
        riderLocation.latitude,
        riderLocation.longitude,
        userCoords.latitude,
        userCoords.longitude
      );
      return `Rider heading to you (arriving in ${minsToUser} mins)`;
    }
    return orderStatus;
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
              <Text style={styles.etaTime}>{getETADisplay()}</Text>
            </View>
            <Ionicons name="bicycle" size={32} color="#06C167" />
          </View>

          {/* Simulated progress tracker */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: hasRider ? (orderStatus === 'Order Delivered' ? '100%' : '75%') : '30%' }]} />
          </View>
          <Text style={styles.progressStatusText}>{getStatusLabel()}</Text>
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
          {hasRider ? (
            <>
              <Image
                source={{ uri: riderInfo.image }}
                style={styles.driverAvatar}
              />
              
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{riderInfo.name}</Text>
                <Text style={styles.driverTitle}>Your Rider</Text>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.driverAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="small" color="#06C167" />
              </View>
              <View style={styles.driverDetails}>
                <Text style={[styles.driverName, { color: '#888', fontWeight: '500' }]}>Finding your Rider...</Text>
                <Text style={styles.driverTitle}>Assigning logistics partner</Text>
              </View>
            </>
          )}

          <View style={styles.driverActions}>
            <TouchableOpacity 
              style={[styles.actionBtnCircle, !hasRider && { opacity: 0.5 }]}
              onPress={handleCallRider}
              disabled={!hasRider}
            >
              <Ionicons name="call" size={20} color="#06C167" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtnCircle, { marginLeft: 12 }, !hasRider && { opacity: 0.5 }]}
              disabled={!hasRider}
              onPress={() => setIsChatVisible(true)}
            >
              <Ionicons name="chatbubble" size={20} color="#06C167" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <FooterNavbar activeTab="Tracking" />

      {/* Chat Modal */}
      <Modal
        visible={isChatVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsChatVisible(false)}
      >
        <SafeAreaView style={styles.chatContainer}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setIsChatVisible(false)} style={styles.chatCloseBtn}>
              <Ionicons name="chevron-back" size={26} color="#06C167" />
            </TouchableOpacity>
            
            <View style={styles.chatHeaderRiderInfo}>
              <Image source={{ uri: riderInfo.image }} style={styles.chatRiderAvatar} />
              <View>
                <Text style={styles.chatRiderName}>{riderInfo.name}</Text>
                <Text style={styles.chatRiderStatus}>Active Delivery Partner</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleCallRider} style={styles.chatCallBtn}>
              <Ionicons name="call" size={20} color="#06C167" />
            </TouchableOpacity>
          </View>

          {/* Chat Messages */}
          <ScrollView 
            style={styles.chatMessagesList}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <View 
                  key={msg.id} 
                  style={[
                    styles.messageRow, 
                    isUser ? styles.messageRowUser : styles.messageRowRider
                  ]}
                >
                  {!isUser && (
                    <Image source={{ uri: riderInfo.image }} style={styles.messageAvatar} />
                  )}
                  <View 
                    style={[
                      styles.messageBubble, 
                      isUser ? styles.bubbleUser : styles.bubbleRider
                    ]}
                  >
                    <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextRider}>
                      {msg.text}
                    </Text>
                    <Text style={isUser ? styles.timeTextUser : styles.timeTextRider}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Chat Input Bar */}
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInputBox}
              placeholder="Type a message to rider..."
              placeholderTextColor="#999"
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={handleSendMessage} style={styles.chatSendBtn}>
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  chatCloseBtn: {
    padding: 4,
    marginRight: 8,
  },
  chatHeaderRiderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatRiderAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#EEEEEE',
  },
  chatRiderName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  chatRiderStatus: {
    fontSize: 12,
    color: '#06C167',
    fontWeight: '500',
  },
  chatCallBtn: {
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  chatMessagesList: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowRider: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#EEEEEE',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: '#06C167',
    borderBottomRightRadius: 4,
  },
  bubbleRider: {
    backgroundColor: '#EAEAEA',
    borderBottomLeftRadius: 4,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
  bubbleTextRider: {
    color: '#1A1A1A',
    fontSize: 14,
    lineHeight: 18,
  },
  timeTextUser: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  timeTextRider: {
    fontSize: 9,
    color: '#888888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  chatInputBox: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1A1A1A',
    marginRight: 10,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#06C167',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
