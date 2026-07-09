import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Categories from '../components/Categories';
import FeaturedRow from '../components/FeaturedRow';
import FooterNavbar from '../components/FooterNavbar';
import { getCategories, getFeaturedRows } from '../services/dataService';
import { AuthContext } from '../context/AuthContext';

export default function HomeScreen() {
  const [categories, setCategories] = useState([]);
  const [featuredRows, setFeaturedRows] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { logout, user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, rows] = await Promise.all([
          getCategories(),
          getFeaturedRows()
        ]);
        setCategories(cats);
        setFeaturedRows(rows);
      } catch (err) {
        console.error("Failed to load home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter restaurants based on category select and search input query
  const getFilteredFeaturedRows = () => {
    return featuredRows.map((row) => {
      let filteredRestaurants = row.restaurants || [];
      
      // Filter by category
      if (activeCategory) {
        filteredRestaurants = filteredRestaurants.filter(
          (r) => r.category && r.category.toLowerCase() === activeCategory.toLowerCase()
        );
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredRestaurants = filteredRestaurants.filter(
          (r) => r.name.toLowerCase().includes(query) || 
                 (r.description && r.description.toLowerCase().includes(query)) ||
                 (r.dishes && r.dishes.some(d => d.name.toLowerCase().includes(query)))
        );
      }

      return {
        ...row,
        restaurants: filteredRestaurants
      };
    }).filter(row => row.restaurants.length > 0); // Hide empty rows
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Container */}
      <View style={styles.headerContainer}>
        {/* Top Location Line */}
        <View style={styles.topHeaderLine}>
          <View style={styles.locationContainer}>
            <View style={styles.locationPinCircle}>
              <Ionicons name="location" size={18} color="#06C167" />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.deliverLabelText}>Deliver Now</Text>
              <View style={styles.addressRow}>
                <Text style={styles.addressText}>San Francisco, CA</Text>
                <Ionicons name="chevron-down" size={16} color="#1A1A1A" style={{ marginLeft: 4 }} />
              </View>
            </View>
          </View>
          
          <TouchableOpacity onPress={logout} style={styles.profileBtn}>
            <Ionicons name="log-out-outline" size={22} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Search Bar Line */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#888888" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Food, drinks, groceries..."
              placeholderTextColor="#888888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#888888" style={{ marginRight: 4 }} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#06C167" />
          <Text style={styles.loadingText}>Fetching delicious options...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.bodyContainer}
          contentContainerStyle={{ paddingBottom: 90 }}
        >
          {/* Categories Horizontal Slider */}
          <Categories 
            categories={categories} 
            activeCategory={activeCategory} 
            onSelectCategory={setActiveCategory} 
          />

          {/* Featured Rows */}
          <View style={styles.featuredRowsContainer}>
            {getFilteredFeaturedRows().length > 0 ? (
              getFilteredFeaturedRows().map((row) => (
                <FeaturedRow
                  key={row._id}
                  id={row._id}
                  title={row.name}
                  description={row.description}
                  restaurants={row.restaurants}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={60} color="#CCCCCC" />
                <Text style={styles.emptyTitle}>No Results Found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search or category filters.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
      <FooterNavbar activeTab="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  topHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPinCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FAF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverLabelText: {
    fontSize: 12,
    color: '#666666',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  addressText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  profileBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    height: '100%',
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#06C167',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06C167',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
    fontSize: 14,
  },
  featuredRowsContainer: {
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 6,
  },
});
