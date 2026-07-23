import React, { useContext, useEffect } from 'react';
import { ref, update } from 'firebase/database';
import { database } from './firebase';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { BasketProvider } from './src/context/BasketContext';
import * as Location from 'expo-location';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import RestaurantScreen from './src/screens/RestaurantScreen';
import BasketScreen from './src/screens/BasketScreen';
import PreparingOrderScreen from './src/screens/PreparingOrderScreen';
import DeliveryScreen from './src/screens/DeliveryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GroceriesScreen from './src/screens/GroceriesScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import PastOrdersScreen from './src/screens/PastOrdersScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import SavedAddressesScreen from './src/screens/SavedAddressesScreen';
import WalletScreen from './src/screens/WalletScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

const Stack = createNativeStackNavigator();

function NavigationWrapper() {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;
    
    const userId = user.uid || 'guest_user';
    const email = user.email || 'guest@example.com';
    let locationSubscription = null;
    let fallbackTimer = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Watch user location change natively using Expo Location
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 10, // Update database every 10 meters of movement
            },
            (location) => {
              if (location && location.coords) {
                const { latitude, longitude } = location.coords;
                const locRef = ref(database, `userLocations/${userId}`);
                update(locRef, {
                  userId,
                  email,
                  lat: latitude,
                  lng: longitude,
                  updatedAt: new Date().toISOString()
                }).catch(e => {});
              }
            }
          );
        } else {
          startFallbackTracking();
        }
      } catch (error) {
        console.warn("Native location tracking initialization failed:", error);
        startFallbackTracking();
      }
    };

    const startFallbackTracking = () => {
      // Sandbox mode / Simulator fallback tracking
      fallbackTimer = setInterval(async () => {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (loc && loc.coords) {
            const locRef = ref(database, `userLocations/${userId}`);
            update(locRef, {
              userId,
              email,
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              updatedAt: new Date().toISOString()
            }).catch(e => {});
            return;
          }
        } catch (e) {
          // Fallback to random walk simulation around San Francisco coordinates
          const mockLat = 37.7749 + (Math.random() - 0.5) * 0.005;
          const mockLng = -122.4194 + (Math.random() - 0.5) * 0.005;
          const locRef = ref(database, `userLocations/${userId}`);
          update(locRef, {
            userId,
            email,
            lat: mockLat,
            lng: mockLng,
            updatedAt: new Date().toISOString()
          }).catch(e => {});
        }
      }, 10000);
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
      }
    };
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06C167" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user === null ? (
          // Authentication flow
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // Main App flow
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Restaurant" component={RestaurantScreen} />
            <Stack.Screen 
              name="Basket" 
              component={BasketScreen} 
              options={{ presentation: 'modal' }} 
            />
            <Stack.Screen 
              name="PreparingOrder" 
              component={PreparingOrderScreen} 
              options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="Delivery" component={DeliveryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Groceries" component={GroceriesScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="PastOrders" component={PastOrdersScreen} />
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
            <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BasketProvider>
        <NavigationWrapper />
      </BasketProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
