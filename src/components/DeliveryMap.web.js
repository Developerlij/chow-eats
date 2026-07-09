import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Haversine formula to compute distance between two coords in km
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function DeliveryMap({ style, region, restaurantCoords, userCoords, riderLocation }) {
  let distanceStr = '';
  if (riderLocation) {
    const dist = getDistanceKm(
      riderLocation.latitude,
      riderLocation.longitude,
      userCoords.latitude,
      userCoords.longitude
    );
    distanceStr = dist < 0.1 ? 'Arrived!' : `${dist.toFixed(2)} km away`;
  }

  return (
    <View style={[style, styles.simulatedMapContainer]}>
      <Ionicons name="map-outline" size={60} color="#CCCCCC" />
      <Text style={styles.simulatedMapText}>Map Simulator (Active in iOS/Android builds)</Text>
      
      <View style={styles.simulatedDetails}>
        <Text style={styles.simDetailsText}>📍 Origin: {restaurantCoords.name}</Text>
        <Text style={styles.simDetailsText}>🏠 Destination: Your Home</Text>
        
        {riderLocation ? (
          <View style={styles.riderLiveBox}>
            <View style={styles.riderLiveHeader}>
              <Text style={styles.riderLiveTitle}>⚡ Live Rider Position:</Text>
              <Text style={styles.distanceBadge}>{distanceStr}</Text>
            </View>
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
  riderLiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  riderLiveTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#06C167',
  },
  distanceBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#E8F5E9',
    color: '#06C167',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 193, 103, 0.2)',
  },
  riderLiveVal: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
    marginVertical: 1,
  },
});
