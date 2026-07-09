import React, { useContext, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BasketContext } from '../context/BasketContext';
import { urlFor } from '../services/dataService';
import FooterNavbar from '../components/FooterNavbar';
import { ref, push, set } from 'firebase/database';
import { database, isMockFirebase } from '../../firebase';

export default function BasketScreen() {
  const navigation = useNavigation();
  const { restaurant, items, removeDish, getBasketTotal, startOrderTracking } = useContext(BasketContext);

  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const subtotal = getBasketTotal();
  const deliveryFee = subtotal > 0 ? 5.99 : 0;
  const total = subtotal + deliveryFee;

  const handleRemove = (dish) => {
    removeDish(dish);
  };

  const handlePlaceOrder = async () => {
    const orderId = `order_${Date.now()}`;
    const orderData = {
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address,
        lat: restaurant.lat || 37.7882,
        lng: restaurant.lng || -122.4324
      },
      items: items.map(item => ({
        id: item.dish._id,
        name: item.dish.name,
        price: item.dish.price,
        quantity: item.quantity
      })),
      subtotal,
      deliveryFee,
      total,
      status: 'Preparing',
      paymentMethod, // 'Transfer' or 'Cash'
      createdAt: new Date().toISOString(),
      rider: {
        name: 'Sarah Jenkins',
        lat: restaurant.lat || 37.7882,
        lng: restaurant.lng || -122.4324
      }
    };

    let finalOrderId = orderId;

    if (!isMockFirebase && database) {
      try {
        const ordersRef = ref(database, 'orders');
        const newOrderRef = push(ordersRef);
        await set(newOrderRef, orderData);
        finalOrderId = newOrderRef.key;
        console.log("Order written to Firebase RTDB with key:", finalOrderId);
      } catch (e) {
        console.warn("Failed to write order to Firebase database, using local:", e);
      }
    } else {
      console.log("Mock Firebase Active. Simulating order placement locally.");
    }

    // Start tracking this order with a countdown and ID
    startOrderTracking(restaurant, finalOrderId);
    // Navigate to the PreparingOrderScreen
    navigation.navigate('PreparingOrder');
  };

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="cart-outline" size={80} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>Your basket is empty</Text>
          <Text style={styles.emptySubtitle}>Go back and add some items to start an order!</Text>
          <TouchableOpacity 
            style={styles.backHomeBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backHomeBtnText}>Back to Restaurant</Text>
          </TouchableOpacity>
        </View>
        <FooterNavbar activeTab="Checkout" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#06C167" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Basket</Text>
          <Text style={styles.headerSubtitle}>{restaurant.name}</Text>
        </View>
      </View>

      {/* Delivery Speed Highlight */}
      <View style={styles.deliverySpeedRow}>
        <Ionicons name="bicycle" size={22} color="#06C167" />
        <Text style={styles.deliverySpeedText}>Deliver in 30-40 mins</Text>
        <TouchableOpacity>
          <Text style={styles.changeText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable list of items */}
      <ScrollView style={styles.itemsScroll}>
        <View style={styles.itemsListContainer}>
          {items.map((item) => (
            <View key={item.dish._id} style={styles.itemRow}>
              <Text style={styles.quantityText}>{item.quantity} x</Text>
              
              <Image 
                source={{ uri: urlFor(item.dish.image) }} 
                style={styles.itemImage} 
              />
              
              <Text style={styles.itemName} numberOfLines={1}>
                {item.dish.name}
              </Text>
              
              <Text style={styles.itemPrice}>
                ${(item.dish.price * item.quantity).toFixed(2)}
              </Text>
              
              <TouchableOpacity 
                onPress={() => handleRemove(item.dish)}
                style={styles.removeBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.paymentContainer}>
          <Text style={styles.paymentTitle}>Payment Method</Text>
          <View style={styles.paymentOptionsRow}>
            <TouchableOpacity 
              style={[
                styles.paymentOptionCard, 
                paymentMethod === 'Cash' && styles.paymentOptionCardActive
              ]}
              onPress={() => setPaymentMethod('Cash')}
            >
              <Ionicons 
                name="cash-outline" 
                size={18} 
                color={paymentMethod === 'Cash' ? '#06C167' : '#666666'} 
              />
              <Text style={[
                styles.paymentOptionText, 
                paymentMethod === 'Cash' && styles.paymentOptionTextActive
              ]}>Cash on Delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.paymentOptionCard, 
                paymentMethod === 'Transfer' && styles.paymentOptionCardActive
              ]}
              onPress={() => setPaymentMethod('Transfer')}
            >
              <Ionicons 
                name="wallet-outline" 
                size={18} 
                color={paymentMethod === 'Transfer' ? '#06C167' : '#666666'} 
              />
              <Text style={[
                styles.paymentOptionText, 
                paymentMethod === 'Transfer' && styles.paymentOptionTextActive
              ]}>Bank Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Pricing Sheet */}
      <View style={styles.priceSheetContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabelText}>Subtotal</Text>
          <Text style={styles.priceValueText}>${subtotal.toFixed(2)}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabelText}>Delivery Fee</Text>
          <Text style={styles.priceValueText}>${deliveryFee.toFixed(2)}</Text>
        </View>

        <View style={[styles.priceRow, { marginTop: 8 }]}>
          <Text style={styles.totalLabelText}>Order Total</Text>
          <Text style={styles.totalValueText}>${total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity 
          style={styles.placeOrderBtn}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderBtnText}>Place Order</Text>
        </TouchableOpacity>
      </View>
      <FooterNavbar activeTab="Checkout" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    height: 60,
  },
  closeBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  deliverySpeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF4',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  deliverySpeedText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    marginLeft: 12,
  },
  changeText: {
    color: '#06C167',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemsScroll: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  itemsListContainer: {
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  quantityText: {
    color: '#06C167',
    fontSize: 15,
    fontWeight: 'bold',
    width: 32,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#F3F3F3',
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 16,
  },
  removeBtn: {
    padding: 6,
  },
  priceSheetContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 92 : 82,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabelText: {
    fontSize: 14,
    color: '#666666',
  },
  priceValueText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  totalLabelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  totalValueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  placeOrderBtn: {
    backgroundColor: '#06C167',
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#06C167',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  backHomeBtn: {
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: '#06C167',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backHomeBtnText: {
    color: '#06C167',
    fontSize: 15,
    fontWeight: 'bold',
  },
  paymentContainer: {
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginTop: 12,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  paymentOptionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  paymentOptionCardActive: {
    borderColor: '#06C167',
    backgroundColor: '#E8F5E9',
  },
  paymentOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  paymentOptionTextActive: {
    color: '#06C167',
  },
});
