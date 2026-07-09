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

export default function SavedAddressesScreen({ navigation }) {
  const [selectedAddress, setSelectedAddress] = useState('addr_1');

  const addresses = [
    {
      id: 'addr_1',
      label: 'Home',
      details: '123 Roman Way, Food Town',
      icon: 'home',
      color: '#06C167'
    },
    {
      id: 'addr_2',
      label: 'Work',
      details: '456 Commerce Avenue, Tech District',
      icon: 'briefcase',
      color: '#0288D1'
    },
    {
      id: 'addr_3',
      label: 'Other',
      details: '789 Broad Street, City Center',
      icon: 'pin',
      color: '#673AB7'
    }
  ];

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
                onPress={() => setSelectedAddress(address.id)}
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
        <TouchableOpacity style={styles.addBtn} onPress={() => alert("Address maps configuration is locked in Sandbox mode.")}>
          <Ionicons name="add-circle-outline" size={20} color="#06C167" style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Add New Address</Text>
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
});
