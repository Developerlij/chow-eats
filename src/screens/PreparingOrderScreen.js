import React, { useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator 
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BasketContext } from '../context/BasketContext';

export default function PreparingOrderScreen() {
  const navigation = useNavigation();
  const { clearBasket } = useContext(BasketContext);

  useEffect(() => {
    // Clear the basket on order placement
    clearBasket();

    // Simulate order processing and transition to delivery map
    const timer = setTimeout(() => {
      navigation.navigate('Delivery');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.contentContainer}>
        {/* Vector Icon Pulse Circle */}
        <Animatable.View
          animation="zoomIn"
          duration={1000}
          style={styles.outerPulseCircle}
        >
          <Animatable.View
            animation="pulse"
            easing="ease-out"
            iterationCount="infinite"
            duration={1500}
            style={styles.innerPulseCircle}
          >
            <Ionicons name="restaurant" size={60} color="#06C167" />
          </Animatable.View>
        </Animatable.View>

        <Animatable.View 
          animation="slideInUp" 
          duration={800}
          style={styles.textContainer}
        >
          <Text style={styles.primaryText}>Preparing Your Order</Text>
          <Text style={styles.secondaryText}>The restaurant is preparing your food. A rider will arrive shortly to collect it.</Text>
        </Animatable.View>

        {/* Loading Spinner */}
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06C167', // Premium green background
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  outerPulseCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  innerPulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  primaryText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  secondaryText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  spinner: {
    marginTop: 10,
  },
});
