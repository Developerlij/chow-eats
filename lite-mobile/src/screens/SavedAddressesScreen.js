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

export default function SavedAddressesScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const userId = user?.uid || 'guest_user';

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Address Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [addressIcon, setAddressIcon] = useState('pin'); // 'home', 'briefcase', 'pin'
  const [saving, setSaving] = useState(false);

  // 1. Fetch dynamic addresses from Firebase with auto-seeding
  useEffect(() => {
    const addrRef = ref(database, `users/${userId}/addresses`);
    const unsubscribe = onValue(addrRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setAddresses(list);
      } else {
        // Auto-seed default addresses
        const seedAddresses = {
          addr_1: { id: 'addr_1', label: 'Home', details: '123 Roman Way, Food Town', icon: 'home', color: '#06C167' },
          addr_2: { id: 'addr_2', label: 'Work', details: '456 Commerce Avenue, Tech District', icon: 'briefcase', color: '#0288D1' },
          addr_3: { id: 'addr_3', label: 'Other', details: '789 Broad Street, City Center', icon: 'pin', color: '#673AB7' }
        };
        set(addrRef, seedAddresses);
      }
    });

    // 2. Fetch preferred address select state
    const preferredRef = ref(database, `users/${userId}/preferredAddress`);
    const preferredUnsubscribe = onValue(preferredRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setSelectedAddress(val);
      } else {
        setSelectedAddress('addr_1'); // default fallback
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      preferredUnsubscribe();
    };
  }, [userId]);

  // Handle changing preferred address in Firebase
  const handleSelectAddress = async (addrId) => {
    try {
      setSelectedAddress(addrId);
      await set(ref(database, `users/${userId}/preferredAddress`), addrId);
    } catch (e) {
      console.warn("Failed to save preferred address:", e);
    }
  };

  // Handle adding custom address to Firebase
  const handleAddAddress = async () => {
    if (!addressLabel.trim()) {
      Alert.alert("Input Required", "Please enter an address label (e.g. Gym).");
      return;
    }
    if (!addressDetails.trim()) {
      Alert.alert("Input Required", "Please enter the street address details.");
      return;
    }

    setSaving(true);
    try {
      const addrRef = ref(database, `users/${userId}/addresses`);
      const newAddrRef = push(addrRef);
      const newId = newAddrRef.key;

      const colorsMap = {
        home: '#06C167',
        briefcase: '#0288D1',
        pin: '#673AB7'
      };

      const newAddr = {
        label: addressLabel.trim(),
        details: addressDetails.trim(),
        icon: addressIcon,
        color: colorsMap[addressIcon] || '#673AB7'
      };

      await set(newAddrRef, newAddr);
      await set(ref(database, `users/${userId}/preferredAddress`), newId);

      setModalVisible(false);
      setAddressLabel('');
      setAddressDetails('');
      setAddressIcon('pin');
      Alert.alert("Address Saved", "Your delivery destination has been saved.");
    } catch (e) {
      Alert.alert("Error", "Failed to save address: " + e.message);
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
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06C167" />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Delivery Destinations</Text>
          <Text style={styles.sectionSub}>Choose your default dropoff address for orders.</Text>

          <View style={{ gap: 12, marginTop: 16 }}>
            {addresses.map((address) => {
              const isSelected = selectedAddress === address.id;
              return (
                <TouchableOpacity 
                  key={address.id} 
                  style={[styles.card, isSelected && styles.activeCard]}
                  onPress={() => handleSelectAddress(address.id)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: address.color + '15' }]}>
                    <Ionicons name={address.icon} size={22} color={address.color} />
                  </View>
                  
                  <View style={styles.addressDetails}>
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    <Text style={styles.addressText}>{address.details}</Text>
                  </View>

                  <View style={[styles.radioOuter, isSelected && styles.radioActiveOuter]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Address Button */}
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#06C167" style={{ marginRight: 8 }} />
            <Text style={styles.addBtnText}>Add New Address</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Add Address Modal */}
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
              <Text style={styles.modalTitle}>Add Address</Text>
              {!saving && (
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {saving ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#06C167" style={{ marginBottom: 12 }} />
                <Text style={{ color: '#666' }}>Saving delivery coordinates...</Text>
              </View>
            ) : (
              <View style={{ gap: 15 }}>
                
                {/* Category Icon selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Select Icon Category</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <TouchableOpacity 
                      style={[styles.iconTab, addressIcon === 'home' && styles.activeIconTab]}
                      onPress={() => setAddressIcon('home')}
                    >
                      <Ionicons name="home" size={18} color={addressIcon === 'home' ? '#06C167' : '#666'} />
                      <Text style={[styles.iconTabText, addressIcon === 'home' && styles.activeIconTabText]}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.iconTab, addressIcon === 'briefcase' && styles.activeIconTab]}
                      onPress={() => setAddressIcon('briefcase')}
                    >
                      <Ionicons name="briefcase" size={18} color={addressIcon === 'briefcase' ? '#0288D1' : '#666'} />
                      <Text style={[styles.iconTabText, addressIcon === 'briefcase' && styles.activeIconTabText]}>Work</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.iconTab, addressIcon === 'pin' && styles.activeIconTab]}
                      onPress={() => setAddressIcon('pin')}
                    >
                      <Ionicons name="pin" size={18} color={addressIcon === 'pin' ? '#673AB7' : '#666'} />
                      <Text style={[styles.iconTabText, addressIcon === 'pin' && styles.activeIconTabText]}>Other</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Address Label</Text>
                  <TextInput 
                    style={styles.inputField}
                    placeholder="e.g. Gym, Friend's House"
                    value={addressLabel}
                    onChangeText={setAddressLabel}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Street Address Details</Text>
                  <TextInput 
                    style={styles.inputField}
                    placeholder="e.g. 789 Broad Street, City Center"
                    value={addressDetails}
                    onChangeText={setAddressDetails}
                  />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
                  <Text style={styles.saveBtnText}>Save Destination</Text>
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
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  addressText: {
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
  iconTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  activeIconTab: {
    borderColor: '#06C167',
    backgroundColor: '#FFF',
  },
  iconTabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  activeIconTabText: {
    color: '#06C167',
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
