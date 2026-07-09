import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DishRow from '../components/DishRow';
import BasketIcon from '../components/BasketIcon';
import { urlFor } from '../services/dataService';

export default function RestaurantScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Destructure params passed from card click
  const { 
    id, name, imgUrl, rating, reviews, address, description, dishes, lat, lng, category 
  } = route.params;

  const currentRestaurant = { _id: id, name, imgUrl, rating, reviews, address, description, dishes, lat, lng, category };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Floating View Basket Icon */}
      <BasketIcon />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Restaurant Hero Image */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: urlFor(imgUrl) }} 
            style={styles.heroImage} 
          />
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#06C167" />
          </TouchableOpacity>
        </View>

        {/* Restaurant Meta Details */}
        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{name}</Text>
          
          <View style={styles.ratingRow}>
            <View style={styles.metaCol}>
              <Ionicons name="star" size={16} color="#FFC000" />
              <Text style={styles.metaLabelText}>
                {rating} <Text style={styles.metaValueText}>({reviews}) • {category}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color="#666666" />
            <Text style={styles.addressText}>{address}</Text>
          </View>

          <Text style={styles.descriptionText}>{description}</Text>

          {/* Allergy Panel */}
          <TouchableOpacity style={styles.allergyContainer}>
            <Ionicons name="help-circle-outline" size={20} color="#666666" />
            <Text style={styles.allergyText}>Have a food allergy? Read info</Text>
            <Ionicons name="chevron-forward" size={16} color="#06C167" />
          </TouchableOpacity>
        </View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Menu</Text>
          {dishes && dishes.length > 0 ? (
            dishes.map((dish) => (
              <DishRow
                key={dish._id}
                id={dish._id}
                name={dish.name}
                description={dish.description}
                price={dish.price}
                imgUrl={dish.image}
                restaurant={currentRestaurant}
              />
            ))
          ) : (
            <View style={styles.noDishes}>
              <Text style={styles.noDishesText}>No dishes available at this moment.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 110, // Margin to make sure items are not blocked by floating basket bar
  },
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#F3F3F3',
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 4,
  },
  metaValueText: {
    color: '#666666',
    fontWeight: 'normal',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  allergyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    paddingVertical: 12,
  },
  allergyText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    marginLeft: 10,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FAFAFA',
  },
  noDishes: {
    padding: 24,
    alignItems: 'center',
  },
  noDishesText: {
    color: '#888888',
    fontSize: 14,
  },
});
