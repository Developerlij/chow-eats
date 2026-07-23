import React, { useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BasketContext } from '../context/BasketContext';
import { IS_LITE_MODE } from '../config';

export default function FooterNavbar({ activeTab }) {
  const navigation = useNavigation();
  const { getBasketCount, orderActive, timeLeft } = useContext(BasketContext);
  
  const basketCount = getBasketCount();

  const tabs = [
    {
      name: 'Home',
      iconOutline: 'home-outline',
      iconFilled: 'home',
      label: 'Home',
      route: 'Home'
    },
    {
      name: 'Groceries',
      iconOutline: 'storefront-outline',
      iconFilled: 'storefront',
      label: 'Groceries',
      route: 'Groceries'
    },
    {
      name: 'Checkout',
      iconOutline: 'cart-outline',
      iconFilled: 'cart',
      label: 'Basket',
      route: 'Basket',
      badge: basketCount > 0 ? basketCount : null
    },
    {
      name: 'Tracking',
      iconOutline: 'timer-outline',
      iconFilled: 'timer',
      label: 'Tracking',
      route: 'Delivery',
      badgeText: orderActive ? `${timeLeft}m` : null
    },
    {
      name: 'Profile',
      iconOutline: 'person-outline',
      iconFilled: 'person',
      label: 'Profile',
      route: 'Profile'
    }
  ];

  const handlePress = (tab) => {
    if (activeTab === tab.name) return;
    
    // Check if the route is valid in stack
    try {
      navigation.navigate(tab.route);
    } catch (e) {
      console.warn(`Failed to navigate to route: ${tab.route}`, e);
    }
  };

  const filteredTabs = IS_LITE_MODE
    ? tabs.filter(t => t.name === 'Home' || t.name === 'Checkout' || t.name === 'Profile')
    : tabs;

  return (
    <View style={styles.footerContainer}>
      {filteredTabs.map((tab) => {
        const isActive = activeTab === tab.name;
        
        return (
          <TouchableOpacity 
            key={tab.name}
            style={styles.tabButton}
            onPress={() => handlePress(tab)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={isActive ? tab.iconFilled : tab.iconOutline} 
                size={24} 
                color={isActive ? '#06C167' : '#888888'} 
              />
              
              {/* Item Count Red/Green Badge */}
              {tab.badge ? (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}

              {/* Live Time Left Badge */}
              {tab.badgeText ? (
                <View style={styles.badgeTextContainer}>
                  <Text style={styles.badgeTextVal}>{tab.badgeText}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[
              styles.tabLabel, 
              isActive && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    position: 'relative',
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#888888',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#06C167',
    fontWeight: 'bold',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#D32F2F', // Alert red for cart item counts
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeTextContainer: {
    position: 'absolute',
    top: -6,
    right: -14,
    backgroundColor: '#06C167', // Emerald green for delivery tracking count
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeTextVal: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
