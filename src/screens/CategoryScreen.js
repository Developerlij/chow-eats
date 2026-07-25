import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getDishesByCategory, getRestaurantsByCategory, urlFor } from '../services/dataService';
import { BasketContext } from '../context/BasketContext';
import RestaurantCard from '../components/RestaurantCard';

export default function CategoryScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { categoryName } = route.params;

  const { addDish, removeDish, getDishCount } = useContext(BasketContext);

  const [activeTab, setActiveTab] = useState('foods'); // 'foods' or 'restaurants'
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedDishes, fetchedRestaurants] = await Promise.all([
          getDishesByCategory(categoryName),
          getRestaurantsByCategory(categoryName)
        ]);
        setDishes(fetchedDishes);
        setRestaurants(fetchedRestaurants);
      } catch (err) {
        console.error("Failed to load category data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryName]);

  const renderDishItem = ({ item }) => {
    const quantity = getDishCount(item._id);

    return (
      <View style={styles.dishCard}>
        <Image 
          source={{ uri: urlFor(item.image) }} 
          style={styles.dishImage} 
        />
        <View style={styles.dishInfo}>
          <Text style={styles.dishName}>{item.name}</Text>
          <Text style={styles.dishDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <TouchableOpacity 
            style={styles.restaurantTag}
            onPress={() => {
              if (item.restaurant) {
                navigation.navigate('Restaurant', {
                  id: item.restaurant._id,
                  name: item.restaurant.name,
                  imgUrl: item.restaurant.imgUrl,
                  rating: item.restaurant.rating,
                  reviews: item.restaurant.reviews,
                  address: item.restaurant.address,
                  description: item.restaurant.description,
                  dishes: item.restaurant.dishes || [],
                  lat: item.restaurant.lat,
                  lng: item.restaurant.lng,
                  category: item.restaurant.category
                });
              }
            }}
          >
            <Ionicons name="restaurant-outline" size={12} color="#06C167" />
            <Text style={styles.restaurantTagText} numberOfLines={1}>
              {item.restaurant?.name || 'Chow Partner'}
            </Text>
          </TouchableOpacity>

          <View style={styles.priceRow}>
            <Text style={styles.dishPrice}>#{item.price}</Text>
            
            {quantity > 0 ? (
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => removeDish(item._id)}
                >
                  <Ionicons name="remove" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => addDish(item, item.restaurant)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addBtn}
                onPress={() => addDish(item, item.restaurant)}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'foods' && styles.activeTab]}
          onPress={() => setActiveTab('foods')}
        >
          <Text style={[styles.tabText, activeTab === 'foods' && styles.activeTabText]}>
            Foods & Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'restaurants' && styles.activeTab]}
          onPress={() => setActiveTab('restaurants')}
        >
          <Text style={[styles.tabText, activeTab === 'restaurants' && styles.activeTabText]}>
            Restaurants
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06C167" />
          <Text style={styles.loadingText}>Loading category items...</Text>
        </View>
      ) : activeTab === 'foods' ? (
        <FlatList
          data={dishes}
          renderItem={renderDishItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="fast-food-outline" size={60} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No foods in this category</Text>
              <Text style={styles.emptySubtitle}>Check back later for newly uploaded products.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={restaurants}
          renderItem={({ item }) => (
            <View style={styles.restaurantCardWrapper}>
              <RestaurantCard 
                id={item._id}
                name={item.name}
                imgUrl={item.image || item.imgUrl}
                rating={item.rating || 5}
                reviews={item.reviews || '0 reviews'}
                address={item.address}
                description={item.description}
                dishes={item.dishes || []}
                lat={item.lat}
                lng={item.lng}
                category={item.category}
              />
            </View>
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={60} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No restaurants available</Text>
              <Text style={styles.emptySubtitle}>No active stores serve this category right now.</Text>
            </View>
          }
        />
      )}
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
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#06C167',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
  activeTabText: {
    color: '#06C167',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  dishCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dishImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  dishInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  dishDescription: {
    fontSize: 12,
    color: '#777777',
    marginTop: 4,
    lineHeight: 16,
  },
  restaurantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FAF0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
  },
  restaurantTagText: {
    fontSize: 11,
    color: '#06C167',
    fontWeight: '600',
    marginLeft: 4,
    maxWidth: 150,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dishPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06C167',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: 20,
    padding: 2,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#06C167',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E1E1E',
  },
  restaurantCardWrapper: {
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555555',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },
});
