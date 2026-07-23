import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { urlFor } from '../services/dataService';

export default function RestaurantCard({ id, name, imgUrl, rating, reviews, address, description, dishes, lat, lng, category }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => {
        navigation.navigate('Restaurant', {
          id, name, imgUrl, rating, reviews, address, description, dishes, lat, lng, category
        });
      }}
    >
      <Image 
        source={{ uri: urlFor(imgUrl) }} 
        style={styles.restaurantImage} 
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.restaurantName} numberOfLines={1}>{name}</Text>
        
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={15} color="#FFC000" />
          <Text style={styles.ratingText}>
            {rating} <Text style={styles.reviewsText}>({reviews}) • {category}</Text>
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={15} color="#888888" style={{ marginRight: 2 }} />
          <Text style={styles.addressText} numberOfLines={1}>Nearby • {address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    width: 250,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
    marginBottom: 8,
  },
  restaurantImage: {
    height: 140,
    width: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  infoContainer: {
    padding: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 4,
  },
  reviewsText: {
    color: '#666666',
    fontWeight: 'normal',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
});
