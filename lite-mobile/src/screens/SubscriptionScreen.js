import React, { useContext, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../firebase';

export default function SubscriptionScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [currentPlan, setCurrentPlan] = useState('Pay as you use');
  const userId = user?.uid || 'guest_user';

  // Read current subscription plan from Firebase Realtime Database
  useEffect(() => {
    const planRef = ref(database, `users/${userId}/subscriptionPlan`);
    const unsubscribe = onValue(planRef, (snapshot) => {
      const plan = snapshot.val();
      if (plan) {
        setCurrentPlan(plan);
      } else {
        setCurrentPlan('Pay as you use');
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSelectPlan = async (planName, price) => {
    try {
      const planRef = ref(database, `users/${userId}/subscriptionPlan`);
      await set(planRef, planName);
      
      Alert.alert(
        "Subscription Updated",
        `You have successfully subscribed to the ${planName} plan!`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Subscription update failed:", error);
      Alert.alert("Error", "Failed to update subscription. Please try again.");
    }
  };

  const plans = [
    {
      id: 'pay_as_you_use',
      name: 'Pay as you use',
      price: '$0.00',
      period: 'forever',
      badge: 'Free Tier',
      color: '#666666',
      bgColor: '#F5F5F5',
      features: [
        'Standard delivery fees apply',
        'Standard customer support queue',
        'Fulfillment from all partners'
      ]
    },
    {
      id: 'monthly',
      name: 'Monthly Subscription',
      price: '$9.99',
      period: 'month',
      badge: 'Chow Pass Monthly',
      color: '#06C167',
      bgColor: '#E8F5E9',
      features: [
        'Free Delivery on orders over $15',
        '50% discount on platform service fees',
        'Priority en-route driver dispatching'
      ],
      isPopular: true
    },
    {
      id: 'yearly',
      name: 'Yearly Subscription',
      price: '$89.99',
      period: 'year',
      badge: 'Chow Pass Yearly',
      color: '#9C27B0',
      bgColor: '#F3E5F5',
      features: [
        'Unlimited FREE delivery on all orders',
        'Zero platform service fees ($0.00 fees)',
        '24/7 VIP priority support hotline',
        'Save over 25% compared to monthly plan'
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.welcomeSection}>
          <Ionicons name="ribbon-outline" size={48} color="#06C167" style={{ marginBottom: 12 }} />
          <Text style={styles.welcomeTitle}>Upgrade Your Chow Pass</Text>
          <Text style={styles.welcomeSubtitle}>
            Unlock zero delivery fees, custom service fee discounts, and priority dispatching on every request.
          </Text>
        </View>

        {/* Plan Cards */}
        {plans.map((plan) => {
          const isActive = currentPlan === plan.name;
          return (
            <View 
              key={plan.id} 
              style={[
                styles.planCard, 
                isActive && { borderColor: plan.color, borderWidth: 2, shadowOpacity: 0.15 }
              ]}
            >
              {plan.isPopular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.planBadge, { color: plan.color, backgroundColor: plan.bgColor }]}>
                    {plan.badge}
                  </Text>
                  <Text style={styles.planName}>{plan.name}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={[styles.priceText, { color: plan.color }]}>{plan.price}</Text>
                  <Text style={styles.periodText}>/ {plan.period}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color={plan.color} style={{ marginRight: 8 }} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={[
                  styles.selectButton, 
                  isActive ? { backgroundColor: '#E0E0E0' } : { backgroundColor: plan.color }
                ]}
                disabled={isActive}
                onPress={() => handleSelectPlan(plan.name, plan.price)}
              >
                <Text style={[styles.selectButtonText, isActive && { color: '#666666' }]}>
                  {isActive ? 'Current Plan' : 'Select Plan'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  periodText: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 16,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 18,
    flex: 1,
  },
  selectButton: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  }
});
