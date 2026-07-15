import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, set, update, push } from 'firebase/database';
import { database } from '../../firebase';
import { AuthContext } from '../context/AuthContext';

export default function PaymentMethodsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.uid || 'guest_user';

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Card Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [cardLabel, setCardLabel] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saving, setSaving] = useState(false);

  // 1. Fetch dynamic payment methods from Firebase with auto-seeding
  useEffect(() => {
    const methodsRef = ref(database, `users/${userId}/paymentMethods`);
    const unsubscribe = onValue(methodsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setPaymentMethods(list);
      } else {
        // Auto-seed default payments
        const seedMethods = {
          card_1: { id: 'card_1', type: 'Credit Card', label: 'Personal Card', details: '•••• •••• •••• 4829', icon: 'card', color: '#1A1A1A' },
          card_2: { id: 'card_2', type: 'Credit Card', label: 'Business Card', details: '•••• •••• •••• 8820', icon: 'card-outline', color: '#0D47A1' },
          transfer: { id: 'transfer', type: 'Bank Transfer', label: 'Chow Bank Transfer', details: 'Wema Bank: 0123456789', icon: 'business', color: '#06C167' },
          cash: { id: 'cash', type: 'Cash', label: 'Cash on Delivery', details: 'Pay cash to dispatch rider', icon: 'cash-outline', color: '#FFB300' }
        };
        set(methodsRef, seedMethods);
      }
    });

    // 2. Fetch preferred payment method select state
    const preferredRef = ref(database, `users/${userId}/preferredPaymentMethod`);
    const preferredUnsubscribe = onValue(preferredRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setSelectedMethod(val);
      } else {
        setSelectedMethod('card_1'); // default fallback
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      preferredUnsubscribe();
    };
  }, [userId]);

  // Handle changing preferred payment method in Firebase
  const handleSelectMethod = async (methodId) => {
    try {
      setSelectedMethod(methodId);
      await set(ref(database, `users/${userId}/preferredPaymentMethod`), methodId);
    } catch (e) {
      console.warn("Failed to save preferred payment method:", e);
    }
  };

  // Handle adding custom card to Firebase RTDB
  const handleAddCard = async () => {
    if (!cardLabel.trim()) {
      Alert.alert("Input Required", "Please enter a card label (e.g. My Visa).");
      return;
    }
    if (cardNumber.replace(/\s/g, '').length < 12) {
      Alert.alert("Invalid Card", "Please enter a valid credit card number.");
      return;
    }
    if (!cardExpiry.includes('/')) {
      Alert.alert("Invalid Expiry", "Please enter expiry date in MM/YY format.");
      return;
    }
    if (cardCvv.length < 3) {
      Alert.alert("Invalid CVV", "Please enter a 3 or 4 digit CVV code.");
      return;
    }

    setSaving(true);
    try {
      const cleanNumber = cardNumber.replace(/\s/g, '');
      const lastFour = cleanNumber.slice(-4);
      
      const methodsRef = ref(database, `users/${userId}/paymentMethods`);
      const newMethodRef = push(methodsRef);
      const newId = newMethodRef.key;

      const newCard = {
        type: 'Credit Card',
        label: cardLabel.trim(),
        details: `•••• •••• •••• ${lastFour}`,
        icon: 'card',
        color: '#E53935' // custom color for newly added credit cards
      };

      await set(newMethodRef, newCard);
      await set(ref(database, `users/${userId}/preferredPaymentMethod`), newId);

      setModalVisible(false);
      setCardLabel('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      Alert.alert("Card Added", "Your credit card has been saved successfully.");
    } catch (e) {
      Alert.alert("Error", "Failed to save card: " + e.message);
    } finally {
      setSaving(false);
    }
  };

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06C167" />
        </View>
      ) : (
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
                  onPress={() => handleSelectMethod(method.id)}
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
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#06C167" style={{ marginRight: 8 }} />
            <Text style={styles.addBtnText}>Add New Card</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Add Card Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => { if (!saving) setModalVisible(false); }}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Credit Card</Text>
              {!saving && (
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {saving ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#06C167" style={{ marginBottom: 12 }} />
                <Text style={{ color: '#666' }}>Saving secure credentials...</Text>
              </View>
            ) : (
              <View style={{ gap: 15 }}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Card Label</Text>
                  <TextInput 
                    style={styles.inputField}
                    placeholder="e.g. Personal Visa"
                    value={cardLabel}
                    onChangeText={setCardLabel}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput 
                    style={styles.inputField}
                    placeholder="1234 5678 1234 5678"
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    maxLength={19}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TextInput 
                      style={styles.inputField}
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                      maxLength={5}
                    />
                  </View>
                  
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CVV Code</Text>
                    <TextInput 
                      style={styles.inputField}
                      placeholder="123"
                      keyboardType="numeric"
                      secureTextEntry={true}
                      value={cardCvv}
                      onChangeText={setCardCvv}
                      maxLength={4}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddCard}>
                  <Text style={styles.saveBtnText}>Save Card Securely</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  formGroup: {
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  inputField: {
    height: 46,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  saveBtn: {
    backgroundColor: '#06C167',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15.5,
  }
});
