import React, { useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BasketContext } from '../context/BasketContext';

export default function BasketIcon() {
  const navigation = useNavigation();
  const { getBasketTotal, getBasketCount } = useContext(BasketContext);

  const count = getBasketCount();
  const total = getBasketTotal();

  if (count === 0) return null;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <TouchableOpacity 
        style={styles.basketBtn}
        onPress={() => navigation.navigate('Basket')}
      >
        <View style={styles.countBadge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>

        <Text style={styles.centerText}>View Basket</Text>

        <Text style={styles.priceText}>${total.toFixed(2)}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  basketBtn: {
    backgroundColor: '#06C167',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
