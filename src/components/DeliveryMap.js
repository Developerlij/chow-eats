import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Platform, Animated } from 'react-native';
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the live tracking indicators
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  let distanceMetres = 0;
  let distanceStr = 'Calculating...';
  let progressPercent = 0;

  if (riderLocation && userCoords && restaurantCoords) {
    const totalDist = getDistanceKm(
      restaurantCoords.latitude,
      restaurantCoords.longitude,
      userCoords.latitude,
      userCoords.longitude
    );

    const remainingDist = getDistanceKm(
      riderLocation.latitude,
      riderLocation.longitude,
      userCoords.latitude,
      userCoords.longitude
    );

    distanceMetres = Math.round(remainingDist * 1000);
    distanceStr = distanceMetres < 30 ? 'Arrived!' : `${distanceMetres} metres away`;

    if (totalDist > 0) {
      // Calculate progress: 0% at restaurant, 100% at user
      progressPercent = Math.min(100, Math.max(0, Math.round(((totalDist - remainingDist) / totalDist) * 100)));
    }
  }

  return (
    <View style={[style, styles.container]}>
      {/* Visual Route Header */}
      <View style={styles.header}>
        <Ionicons name="map" size={24} color="#06C167" />
        <Text style={styles.headerText}>Chow Live GPS Route Tracker</Text>
      </View>

      {/* Visual Route Line and Animation */}
      <View style={styles.routeContainer}>
        {/* The Path Line */}
        <View style={styles.pathLineBg}>
          <View style={[styles.pathLineFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* Nodes Row */}
        <View style={styles.nodesRow}>
          {/* Restaurant Node */}
          <View style={styles.nodeWrapper}>
            <View style={[styles.nodeIconBg, styles.restaurantNode]}>
              <Ionicons name="restaurant" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.nodeLabel}>{restaurantCoords.name}</Text>
          </View>

          {/* User Node */}
          <View style={styles.nodeWrapper}>
            <Animated.View style={[
              styles.nodeIconBg, 
              styles.userNode,
              { transform: [{ scale: pulseAnim }] }
            ]}>
              <Ionicons name="home" size={20} color="#FFFFFF" />
            </Animated.View>
            <Text style={styles.nodeLabel}>Your Home</Text>
          </View>
        </View>

        {/* Moving Rider Badge overlay on the line */}
        {riderLocation && (
          <View style={[styles.riderBadge, { left: `${Math.min(85, Math.max(5, progressPercent))}%` }]}>
            <View style={styles.riderIconCircle}>
              <Ionicons name="bicycle" size={18} color="#FFFFFF" />
            </View>
          </View>
        )}
      </View>

      {/* Real-time Telemetry Data Card */}
      <View style={styles.detailsCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Rider Proximity:</Text>
          <Text style={styles.valueHighlight}>{distanceStr}</Text>
        </View>

        {riderLocation && (
          <View style={styles.gpsContainer}>
            <Text style={styles.gpsLabel}>🛰️ Live Telemetry:</Text>
            <Text style={styles.gpsText}>Lat: {riderLocation.latitude.toFixed(6)}</Text>
            <Text style={styles.gpsText}>Lng: {riderLocation.longitude.toFixed(6)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212', // Premium dark mode background
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  routeContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  pathLineBg: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
  },
  pathLineFill: {
    height: '100%',
    backgroundColor: '#06C167',
    borderRadius: 3,
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '8%',
    width: '100%',
    position: 'absolute',
  },
  nodeWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  nodeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  restaurantNode: {
    backgroundColor: '#333333',
  },
  userNode: {
    backgroundColor: '#06C167',
  },
  nodeLabel: {
    fontSize: 11,
    color: '#AAAAAA',
    fontWeight: '600',
    maxWidth: 90,
    textAlign: 'center',
  },
  riderBadge: {
    position: 'absolute',
    top: '30%',
    transform: [{ translateX: -18 }],
  },
  riderIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00B0FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#121212',
  },
  detailsCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
  valueHighlight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#06C167',
    backgroundColor: 'rgba(6, 193, 103, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  gpsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 10,
    gap: 2,
  },
  gpsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888888',
    marginBottom: 4,
  },
  gpsText: {
    fontSize: 11,
    color: '#666666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
