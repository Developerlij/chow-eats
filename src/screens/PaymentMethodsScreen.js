import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentMethodsScreen({ navigation }) {
  const [selectedMethod, setSelectedMethod] = useState('card_1');

  const paymentMethods = [
    {
      id: 'card_1',
      type: 'Credit Card',
      label: 'Personal Card',
      details: '•••• •••• •••• 4829',
      icon: 'card',
      color: '#1A1A1A'
    },
    {
      id: 'card_2',
      type: 'Credit Card',
      label: 'Business Card',
      details: '•••• •••• •••• 8820',
      icon: 'card-outline',
      color: '#0D47A1'
    },
    {
      id: 'transfer',
      type: 'Bank Transfer',
      label: 'Chow Bank Transfer',
      details: 'Wema Bank: 0123456789',
      icon: 'business',
      color: '#06C167'
    },
    {
      id: 'cash',
      type: 'Cash',
      label: 'Cash on Delivery',
      details: 'Pay cash to dispatch rider',
      icon: 'cash-outline',
      color: '#FFB300'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Preferred Payment Option</Text>
        <Text style={styles.sectionSub}>Select the primary payment option to use during checkout.</Text>

        <View style={{ gap: 12, marginTop: 16 }}>
          {paymentMethods.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity 
                key={method.id} 
                style={[styles.card, isSelected && styles.activeCard]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={[styles.iconCircle, { backgroundColor: method.color + '15' }]}>
                  <Ionicons name={method.icon} size={22} color={method.color} />
                </View>
                
                <View style={styles.cardDetails}>
                  <Text style={styles.cardLabel}>{method.label}</Text>
                  <Text style={styles.cardDigits}>{method.details}</Text>
                </View>

                <View style={[styles.radioOuter, isSelected && styles.radioActiveOuter]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add Payment Method Button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => alert("Payment configuration integrations are locked in Sandbox mode.")}>
          <Ionicons name="add-circle-outline" size={20} color="#06C167" style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add New Card</Text>
        </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  sectionSub: {
    fontSize: 13,
    color: '#888888',
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  activeCard: {
    borderColor: '#06C167',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardDetails: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  cardDigits: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActiveOuter: {
    borderColor: '#06C167',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#06C167',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#06C167',
    height: 52,
    marginTop: 20,
  },
  addBtnText: {
    color: '#06C167',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
