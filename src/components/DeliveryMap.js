import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import react-native-maps components on native platforms
let MapView = null;
let Marker = null;
let UrlTile = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    UrlTile = Maps.UrlTile;
  } catch (e) {
    console.warn("react-native-maps is not supported or failed to load:", e);
  }
}

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
          toValue: 1.15,
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
      progressPercent = Math.min(100, Math.max(0, Math.round(((totalDist - remainingDist) / totalDist) * 100)));
    }
  }

  // Generates Leaflet-based OpenStreetMap HTML content for Web frames
  const getLeafletHtml = () => {
    const restLat = restaurantCoords?.latitude || 6.5244;
    const restLng = restaurantCoords?.longitude || 3.3792;
    const restName = restaurantCoords?.name || "Restaurant";
    
    const userLat = userCoords?.latitude || 6.5244;
    const userLng = userCoords?.longitude || 3.3792;

    const riderLat = riderLocation?.latitude || "";
    const riderLng = riderLocation?.longitude || "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
            background: #1E1E1E;
          }
          /* Custom Leaflet Dark mode overrides */
          .leaflet-container {
            background: #1A1A1A;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: true });
          
          // Render beautiful OpenStreetMap tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          var markers = [];

          // Add Restaurant Marker
          var restMarker = L.marker([${restLat}, ${restLng}]).addTo(map)
            .bindPopup("<b>🏠 ${restName}</b><br/>Vendor Pick-up Point")
            .openPopup();
          markers.push(restMarker);

          // Add User Marker
          var userMarker = L.marker([${userLat}, ${userLng}]).addTo(map)
            .bindPopup("<b>📍 Your Delivery Address</b>");
          markers.push(userMarker);

          // Add Rider Marker
          var riderLat = "${riderLat}";
          var riderLng = "${riderLng}";
          if (riderLat && riderLng) {
            var riderMarker = L.marker([parseFloat(riderLat), parseFloat(riderLng)]).addTo(map)
              .bindPopup("<b>🚴 Rider Location</b>");
            markers.push(riderMarker);
          }

          var group = new L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.2));
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={[style, styles.container]}>
      {/* Visual Route Header */}
      <View style={styles.header}>
        <Ionicons name="navigate-circle" size={24} color="#06C167" />
        <Text style={styles.headerText}>Chow Live GPS Map (OpenStreetMap)</Text>
      </View>

      {/* Actual Map Frame */}
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' ? (
          <iframe
            srcDoc={getLeafletHtml()}
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
            title="OpenStreetMap GPS View"
          />
        ) : (
          MapView ? (
            <MapView
              style={styles.nativeMap}
              initialRegion={region || {
                latitude: restaurantCoords?.latitude || 6.5244,
                longitude: restaurantCoords?.longitude || 3.3792,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              }}
            >
              <UrlTile
                urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
              />
              {restaurantCoords && (
                <Marker
                  coordinate={{
                    latitude: restaurantCoords.latitude,
                    longitude: restaurantCoords.longitude,
                  }}
                  title={restaurantCoords.name || "Restaurant"}
                  description="Vendor Pick-up"
                />
              )}
              {userCoords && (
                <Marker
                  coordinate={{
                    latitude: userCoords.latitude,
                    longitude: userCoords.longitude,
                  }}
                  title="Your Home"
                  description="Delivery Destination"
                  pinColor="green"
                />
              )}
              {riderLocation && (
                <Marker
                  coordinate={{
                    latitude: riderLocation.latitude,
                    longitude: riderLocation.longitude,
                  }}
                  title="Rider Location"
                  description="Live Tracking"
                  pinColor="blue"
                />
              )}
            </MapView>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' }}>
              <Text style={{ color: '#fff' }}>Map view not available on this platform</Text>
            </View>
          )
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
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    width: '100%',
  },
  headerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mapWrapper: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  nativeMap: {
    width: '100%',
    height: '100%',
  },
  detailsCard: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
  valueHighlight: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#06C167',
    backgroundColor: 'rgba(6, 193, 103, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  gpsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 10,
    marginTop: 10,
    gap: 2,
  },
  gpsLabel: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#888888',
    marginBottom: 4,
  },
  gpsText: {
    fontSize: 10.5,
    color: '#666666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
