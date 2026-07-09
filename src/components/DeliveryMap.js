import React from 'react';
import MapView, { Marker } from 'react-native-maps';

export default function DeliveryMap({ style, region, restaurantCoords, userCoords, riderLocation }) {
  return (
    <MapView
      initialRegion={region}
      style={style}
      mapType="mutedStandard"
    >
      <Marker
        coordinate={{
          latitude: restaurantCoords.latitude,
          longitude: restaurantCoords.longitude,
        }}
        title={restaurantCoords.name}
        description="Your food is here!"
        pinColor="#06C167"
      />

      <Marker
        coordinate={{
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
        }}
        title="Delivery Location"
        description="Your home address"
        pinColor="#1A1A1A"
      />

      {riderLocation ? (
        <Marker
          coordinate={{
            latitude: riderLocation.latitude,
            longitude: riderLocation.longitude,
          }}
          title="Your Rider"
          description="Rider is moving in real-time!"
          pinColor="#00B0FF" // Light blue pin for rider
        />
      ) : null}
    </MapView>
  );
}
