import React, { useContext, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  Image, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import FooterNavbar from '../components/FooterNavbar';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase';
import { IS_LITE_MODE } from '../config';

export default function ProfileScreen({ navigation }) {
  const { user, logout, isMock } = useContext(AuthContext);
  const [walletBalance, setWalletBalance] = useState(0.00);
  const [subscriptionPlan, setSubscriptionPlan] = useState('Pay as you use');

  useEffect(() => {
    const userId = user?.uid || 'guest_user';
    const balanceRef = ref(database, `users/${userId}/wallet/balance`);
    const unsubscribeBalance = onValue(balanceRef, (snapshot) => {
      const val = snapshot.val();
      if (typeof val === 'number') {
        setWalletBalance(val);
      } else {
        setWalletBalance(0.00);
      }
    });

    const planRef = ref(database, `users/${userId}/subscriptionPlan`);
    const unsubscribePlan = onValue(planRef, (snapshot) => {
      const plan = snapshot.val();
      if (plan) {
        setSubscriptionPlan(plan);
      } else {
        setSubscriptionPlan('Pay as you use');
      }
    });

    return () => {
      unsubscribeBalance();
      unsubscribePlan();
    };
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Profile Card */}
        <View style={styles.profileHeaderCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }}
            style={styles.avatarImage}
          />
          <Text style={styles.userName}>{user?.email ? user.email.split('@')[0] : 'Guest User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'guest@example.com'}</Text>


          
          {isMock ? (
            <View style={styles.mockBadge}>
              <Text style={styles.mockBadgeText}>Sandbox Mode</Text>
            </View>
          ) : null}
        </View>

        {/* Menu Options Group */}
        <View style={styles.optionsCard}>
          <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('PastOrders')}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="receipt-outline" size={20} color="#06C167" />
            </View>
            <Text style={styles.optionText}>Past Orders</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          {!IS_LITE_MODE && (
            <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('Wallet')}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="wallet-outline" size={20} color="#06C167" />
              </View>
              <Text style={styles.optionText}>Chow Wallet</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('PaymentMethods')}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="card-outline" size={20} color="#06C167" />
            </View>
            <Text style={styles.optionText}>Payment Methods</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('SavedAddresses')}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="pin-outline" size={20} color="#06C167" />
            </View>
            <Text style={styles.optionText}>Saved Addresses</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="notifications-outline" size={20} color="#06C167" />
            </View>
            <Text style={styles.optionText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>

          {!IS_LITE_MODE && (
            <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('Subscription')}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="ribbon-outline" size={20} color="#06C167" />
              </View>
              <Text style={styles.optionText}>Subscription Plan</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, color: '#666666', fontWeight: '500' }}>{subscriptionPlan}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
              </View>
            </TouchableOpacity>
          )}


        </View>

        {/* Log Out Option */}
        {!IS_LITE_MODE && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Footer Navbar */}
      <FooterNavbar activeTab="Profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 90, // Avoid overlapping with footer navbar
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
    backgroundColor: '#F3F3F3',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  mockBadge: {
    backgroundColor: '#E6FAF0',
    borderColor: '#06C167',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  mockBadgeText: {
    color: '#06C167',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FAF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFEBEE',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutBtnText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletBadge: {
    backgroundColor: '#F0FAF4',
    borderColor: '#E6FAF0',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBadgeText: {
    color: '#06C167',
    fontSize: 13.5,
    fontWeight: 'bold',
  },
});
