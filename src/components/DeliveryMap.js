import React from 'react';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';

export default function DeliveryMap({ style, region, restaurantCoords, userCoords, riderLocation }) {
  return (
    <MapView
      initialRegion={region}
      style={style}
      mapType="none" // Turn off standard provider maps so OSM tiles load clean
    >
      {/* 100% Free OpenStreetMap Tile Layer */}
      <UrlTile 
        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
      />

      {/* Route Path Line from Rider to User */}
      {riderLocation ? (
        <Polyline
          coordinates={[
            { latitude: riderLocation.latitude, longitude: riderLocation.longitude },
            { latitude: userCoords.latitude, longitude: userCoords.longitude }
          ]}
          strokeColor="#06C167" // Emerald green path line
          strokeWidth={4}
          lineDashPattern={[5, 10]} // Dashed line styling
        />
      ) : null}

      {/* Origin/Restaurant Marker */}
      <Marker
        coordinate={{
          latitude: restaurantCoords.latitude,
          longitude: restaurantCoords.longitude,
        }}
        title={restaurantCoords.name}
        description="Your food is here!"
        pinColor="#06C167"
      />

      {/* Destination/User Marker */}
      <Marker
        coordinate={{
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
        }}
        title="Delivery Location"
        description="Your home address"
        pinColor="#1A1A1A"
      />

      {/* Moving Rider Marker */}
      {riderLocation ? (
        <Marker
          coordinate={{
            latitude: riderLocation.latitude,
            longitude: riderLocation.longitude,
          }}
          title="Your Rider"
          description="Rider is moving in real-time!"
          pinColor="#00B0FF"
        />
      ) : null}
    </MapView>
  );
}
