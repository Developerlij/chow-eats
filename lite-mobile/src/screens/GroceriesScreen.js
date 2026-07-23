import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  FlatList,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BasketContext } from '../context/BasketContext';
import FooterNavbar from '../components/FooterNavbar';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase';

const groceryStore = {
  _id: 'grocery_store',
  name: 'Chow Groceries',
  rating: 4.9,
  reviews: '500+ reviews',
  address: 'Express Delivery • 15-20 min',
  description: 'Fresh groceries delivered straight to your door in minutes.'
};

const groceryCategories = [
  { id: 'gcat1', name: 'Fresh Produce', icon: 'leaf-outline', color: '#E8F5E9' },
  { id: 'gcat2', name: 'Dairy & Eggs', icon: 'egg-outline', color: '#FFFDE7' },
  { id: 'gcat3', name: 'Bakery', icon: 'restaurant-outline', color: '#EFEBE9' },
  { id: 'gcat4', name: 'Beverages', icon: 'beer-outline', color: '#E1F5FE' },
  { id: 'gcat5', name: 'Snacks', icon: 'pizza-outline', color: '#FDF2E9' }
];

const groceryProducts = [
  { id: 'gprod1', category: 'Fresh Produce', name: 'Organic Bananas', description: 'Fresh sweet organic bananas, bunch of 5-6.', price: 1.99, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=60' },
  { id: 'gprod2', category: 'Fresh Produce', name: 'Red Gala Apples', description: 'Sweet, crisp organic red apples, bag of 4.', price: 2.99, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&auto=format&fit=crop&q=60' },
  { id: 'gprod3', category: 'Fresh Produce', name: 'Fresh Avocado', description: 'Ripe Hass avocado, perfect for guacamole.', price: 1.25, image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&auto=format&fit=crop&q=60' },
  
  { id: 'gprod4', category: 'Dairy & Eggs', name: 'Organic Whole Milk', description: 'Pasteurized whole milk, 1 gallon jug.', price: 4.49, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=60' },
  { id: 'gprod5', category: 'Dairy & Eggs', name: 'Large Brown Eggs', description: 'Grade A free range brown eggs, 12 count.', price: 3.89, image: 'https://images.unsplash.com/photo-1516448424440-9dbca97779c1?w=300&auto=format&fit=crop&q=60' },
  { id: 'gprod6', category: 'Dairy & Eggs', name: 'Salted Butter', description: 'Creamy sweet cream salted butter, 4 sticks.', price: 2.99, image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=60' },

  { id: 'gprod7', category: 'Bakery', name: 'Fresh Sourdough Bread', description: 'Locally baked crusty sourdough bread loaf.', price: 3.49, image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300&auto=format&fit=crop&q=60' },
  { id: 'gprod8', category: 'Bakery', name: 'Butter Croissants', description: 'Flaky French-style butter croissants, pack of 2.', price: 2.49, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=60' },

  { id: 'gprod9', category: 'Beverages', name: 'Sparkling Water', description: 'Natural lime flavor sparkling water, pack of 8.', price: 4.99, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=60' },
  { id: 'gprod10', category: 'Beverages', name: 'Cold Brew Coffee', description: 'Unsweetened organic black cold brew coffee, 32 oz.', price: 5.49, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop&q=60' },

  { id: 'gprod11', category: 'Snacks', name: 'Sea Salt Potato Chips', description: 'Crispy kettle-cooked potato chips with sea salt.', price: 1.89, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d20?w=300&auto=format&fit=crop&q=60' },
  { id: 'gprod12', category: 'Snacks', name: 'Dark Chocolate Bar', description: '72% cacao premium single origin dark chocolate.', price: 2.29, image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&auto=format&fit=crop&q=60' }
];

export default function GroceriesScreen() {
  const [dbCategories, setDbCategories] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { addDish, removeDish, forceAddDish, getDishCount } = useContext(BasketContext);

  const activeCategoriesList = dbCategories.length > 0 ? dbCategories : groceryCategories;
  const activeProductsList = dbProducts.length > 0 ? dbProducts : groceryProducts;

  // Subscribe to Firebase real-time grocery database configurations
  useEffect(() => {
    const catsRef = ref(database, 'groceryCategories');
    const unsubscribeCats = onValue(catsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDbCategories(list);
      } else {
        setDbCategories([]);
      }
    });

    const prodsRef = ref(database, 'groceryProducts');
    const unsubscribeProds = onValue(prodsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDbProducts(list);
      } else {
        setDbProducts([]);
      }
    });

    return () => {
      unsubscribeCats();
      unsubscribeProds();
    };
  }, []);

  // Select first category automatically when loaded
  useEffect(() => {
    if (!activeCategory && activeCategoriesList.length > 0) {
      setActiveCategory(activeCategoriesList[0].name);
    }
  }, [activeCategoriesList, activeCategory]);

  const handleAddItem = (product) => {
    const result = addDish({
      _id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image
    }, groceryStore);

    if (result && result.conflict) {
      Alert.alert(
        "Clear Restaurant Basket?",
        "Your basket contains items from a restaurant. Would you like to clear your basket to add groceries?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Clear & Add", 
            onPress: () => forceAddDish({
              _id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              image: product.image
            }, groceryStore) 
          }
        ]
      );
    }
  };

  const handleRemoveItem = (product) => {
    if (getDishCount(product.id) > 0) {
      removeDish({ _id: product.id });
    }
  };

  const getFilteredProducts = () => {
    let filtered = activeProductsList.filter(p => p.category === activeCategory);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = activeProductsList.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }
    return filtered;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Container */}
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <Ionicons name="storefront-outline" size={24} color="#06C167" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>Chow Groceries</Text>
        </View>
        <Text style={styles.headerSubtitle}>Fresh daily items delivered in 15-20 mins</Text>

        {/* Search Input */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#888888" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search groceries, fruits, milk..."
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
        </View>
      </View>

      {/* Main Content Side-by-Side Category + Product Listing */}
      <View style={styles.bodyRow}>
        {/* Left Side Category Navigation */}
        <View style={styles.leftCategoryCol}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {activeCategoriesList.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catSidebarItem,
                    isActive && styles.activeSidebarItem
                  ]}
                  onPress={() => {
                    setActiveCategory(cat.name);
                    setSearchQuery('');
                  }}
                >
                  <View style={[styles.catIconCircle, { backgroundColor: cat.color }]}>
                    <Ionicons name={cat.icon} size={18} color="#1A1A1A" />
                  </View>
                  <Text style={[styles.catItemLabel, isActive && styles.activeCatLabel]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Side Products Grid */}
        <View style={styles.rightProductsCol}>
          <Text style={styles.sectionHeaderTitle}>{searchQuery ? 'Search Results' : activeCategory}</Text>
          <FlatList
            data={getFilteredProducts()}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            renderItem={({ item }) => {
              const qty = getDishCount(item.id);
              return (
                <View style={styles.productCard}>
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                  <View style={styles.productDetails}>
                    <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
                    
                    {/* Add/Remove CTA row */}
                    <View style={styles.actionsRow}>
                      {qty > 0 ? (
                        <View style={styles.quantityControls}>
                          <TouchableOpacity 
                            onPress={() => handleRemoveItem(item)}
                            style={styles.actionBtnSmall}
                          >
                            <Ionicons name="remove" size={14} color="#06C167" />
                          </TouchableOpacity>
                          <Text style={styles.qtyLabel}>{qty}</Text>
                          <TouchableOpacity 
                            onPress={() => handleAddItem(item)}
                            style={styles.actionBtnSmall}
                          >
                            <Ionicons name="add" size={14} color="#06C167" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.addCartBtn}
                          onPress={() => handleAddItem(item)}
                        >
                          <Ionicons name="add" size={14} color="#FFFFFF" />
                          <Text style={styles.addCartBtnText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyProducts}>
                <Ionicons name="search-outline" size={40} color="#CCCCCC" />
                <Text style={styles.emptyProductsText}>No items found in this section.</Text>
              </View>
            )}
          />
        </View>
      </View>

      {/* Footer Nav Bar */}
      <FooterNavbar activeTab="Groceries" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    height: '100%',
  },
  bodyRow: {
    flex: 1,
    flexDirection: 'row',
  },
  leftCategoryCol: {
    width: 86,
    backgroundColor: '#FAFAFA',
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
  },
  catSidebarItem: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  activeSidebarItem: {
    backgroundColor: '#FFFFFF',
    borderLeftColor: '#06C167',
  },
  catIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catItemLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  activeCatLabel: {
    color: '#06C167',
    fontWeight: 'bold',
  },
  rightProductsCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  flatListContent: {
    paddingBottom: 90, // Spacing above the footer tabbar
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    margin: 4,
    maxWidth: '48%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  productImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#F3F3F3',
  },
  productDetails: {
    padding: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 2,
  },
  productDesc: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
    height: 28,
    lineHeight: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 10,
    height: 30,
  },
  addCartBtn: {
    flex: 1,
    backgroundColor: '#06C167',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCartBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  quantityControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: '#06C167',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 4,
  },
  actionBtnSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyProductsText: {
    fontSize: 13,
    color: '#888888',
    marginTop: 10,
    textAlign: 'center',
  },
});
