import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RestaurantCard from './RestaurantCard';

export default function FeaturedRow({ id, title, description, restaurants }) {
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
        <TouchableOpacity style={styles.arrowIcon}>
          <Ionicons name="arrow-forward" size={20} color="#06C167" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Cards Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant._id}
            id={restaurant._id}
            name={restaurant.name}
            imgUrl={restaurant.image}
            rating={restaurant.rating}
            reviews={restaurant.reviews}
            address={restaurant.address}
            description={restaurant.description}
            dishes={restaurant.dishes}
            lat={restaurant.lat}
            lng={restaurant.lng}
            category={restaurant.category}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  descriptionText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  arrowIcon: {
    padding: 4,
  },
  scrollContainer: {
    paddingLeft: 16,
  },
});
