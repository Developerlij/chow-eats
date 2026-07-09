import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DeliveryMap({ style, region, restaurantCoords, userCoords, riderLocation }) {
  return (
    <View style={[style, styles.simulatedMapContainer]}>
      <Ionicons name="map-outline" size={60} color="#CCCCCC" />
      <Text style={styles.simulatedMapText}>Map Simulator (Active in iOS/Android builds)</Text>
      
      <View style={styles.simulatedDetails}>
        <Text style={styles.simDetailsText}>📍 Origin: {restaurantCoords.name}</Text>
        <Text style={styles.simDetailsText}>🏠 Destination: Your Home</Text>
        
        {riderLocation ? (
          <View style={styles.riderLiveBox}>
            <Text style={styles.riderLiveTitle}>⚡ Live Rider Position:</Text>
            <Text style={styles.riderLiveVal}>Lat: {riderLocation.latitude.toFixed(6)}</Text>
            <Text style={styles.riderLiveVal}>Lng: {riderLocation.longitude.toFixed(6)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  simulatedMapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEAEA',
    padding: 24,
  },
  simulatedMapText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  simulatedDetails: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    maxWidth: 320,
  },
  simDetailsText: {
    fontSize: 14,
    color: '#444444',
    marginVertical: 4,
  },
  riderLiveBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  riderLiveTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#06C167',
    marginBottom: 4,
  },
  riderLiveVal: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
    marginVertical: 1,
  },
});
