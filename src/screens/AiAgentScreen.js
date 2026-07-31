import React, { useState, useEffect, useRef, useContext } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase';
import { getFeaturedRows } from '../services/dataService';
import { BasketContext } from '../context/BasketContext';
import FooterNavbar from '../components/FooterNavbar';

// Static grocery store object for groceries addition
const groceryStore = {
  _id: 'grocery_store',
  name: 'Chow Groceries',
  rating: 4.9,
  reviews: '500+ reviews',
  address: 'Express Delivery • 15-20 min',
  description: 'Fresh groceries delivered straight to your door in minutes.'
};

export default function AiAgentScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef();
  const { addDish, forceAddDish, getDishCount } = useContext(BasketContext);

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'agent',
      text: 'Hello! I am your Chow AI Agent. 🤖\n\nWhat would you like to eat today? Tell me what you are craving, or search for groceries (e.g. "I want spicy Jollof Rice", "Do you have pepperoni pizza?", "I need fresh milk").',
      suggestions: []
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Real-time Database Collections for Matching
  const [restaurants, setRestaurants] = useState([]);
  const [groceryProducts, setGroceryProducts] = useState([]);

  // Fetch data on load
  useEffect(() => {
    // 1. Fetch restaurants from services / DB
    getFeaturedRows().then((rows) => {
      // Collect unique restaurants from featured rows
      const allRests = [];
      const seen = new Set();
      rows.forEach(row => {
        if (row.restaurants) {
          row.restaurants.forEach(r => {
            if (r && !seen.has(r._id)) {
              seen.add(r._id);
              allRests.push(r);
            }
          });
        }
      });
      setRestaurants(allRests);
    }).catch(err => console.warn(err));

    // 2. Fetch groceries from Firebase database path
    const prodsRef = ref(database, 'groceryProducts');
    const unsubscribeProds = onValue(prodsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setGroceryProducts(list);
      } else {
        setGroceryProducts([]);
      }
    });

    return () => unsubscribeProds();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  // Handle Quick Prompt clicks
  const handleQuickPrompt = (promptText) => {
    setInputMessage(promptText);
    sendMessage(promptText);
  };

  // Match items based on query keywords and semantic synonyms
  const findMatches = (query) => {
    const rawKeywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    if (rawKeywords.length === 0) return [];

    // Synonym mapping for semantic expansion
    const synonymMap = {
      'spicy': ['chili', 'suya', 'pepper', 'hot', 'yaji', 'spiced', 'nigerian', 'buka'],
      'hot': ['chili', 'suya', 'pepper', 'spicy', 'yaji', 'smoky'],
      'chili': ['spicy', 'pepper', 'hot', 'yaji'],
      'pepper': ['spicy', 'chili', 'hot', 'yaji'],
      'italian': ['pizza', 'pasta', 'cheese', 'mozzarella', 'pepperoni', 'bread', 'nonna'],
      'pizza': ['margherita', 'pepperoni', 'supreme', 'italian', 'mozzarella', 'cheese', 'nonna'],
      'cheese': ['mozzarella', 'pizza', 'cheeseburger', 'cheesy'],
      'burger': ['cheeseburger', 'patty', 'beef', 'bacon', 'bbq', 'fries', 'onion'],
      'fries': ['chips', 'potato', 'parmesan', 'truffle'],
      'sushi': ['roll', 'nigiri', 'salmon', 'tuna', 'edamame', 'japanese', 'zen', 'tempura'],
      'japanese': ['sushi', 'roll', 'nigiri', 'tempura', 'zen'],
      'fish': ['sushi', 'tuna', 'salmon', 'seafood'],
      'nigerian': ['jollof', 'rice', 'plantain', 'dodo', 'chicken', 'egusi', 'yam', 'suya', 'puff puff', 'buka'],
      'african': ['jollof', 'rice', 'plantain', 'dodo', 'chicken', 'egusi', 'yam', 'suya', 'puff puff', 'buka'],
      'swallow': ['egusi', 'yam', 'pounded'],
      'suya': ['beef', 'skewers', 'yaji', 'spicy', 'nigerian'],
      'healthy': ['salad', 'quinoa', 'bowl', 'avocado', 'kale', 'spinach', 'detox', 'juice', 'vegan', 'green'],
      'vegan': ['salad', 'quinoa', 'bowl', 'avocado', 'kale', 'spinach', 'detox', 'juice', 'healthy', 'green'],
      'salad': ['caesar', 'romaine', 'spinach', 'lettuce', 'avocado', 'green'],
      'drink': ['beverage', 'juice', 'coffee', 'milk', 'water', 'sparkling', 'cold brew', 'elixir'],
      'beverage': ['drink', 'juice', 'coffee', 'milk', 'water', 'sparkling', 'cold brew', 'elixir'],
      'grocery': ['milk', 'egg', 'butter', 'banana', 'apple', 'avocado', 'bread', 'sourdough', 'croissant', 'water', 'chips', 'chocolate'],
      'dairy': ['milk', 'egg', 'butter', 'eggs', 'cheese']
    };

    // Expand search keywords using synonym map
    const keywords = [...rawKeywords];
    rawKeywords.forEach(word => {
      if (synonymMap[word]) {
        keywords.push(...synonymMap[word]);
      }
    });

    const matches = [];

    // A. Match food dishes in restaurants
    restaurants.forEach(rest => {
      const dishesList = rest.dishes 
        ? (Array.isArray(rest.dishes) ? rest.dishes : Object.values(rest.dishes))
        : [];
      dishesList.forEach(dish => {
        if (!dish) return;
        let score = 0;
        const nameLower = (dish.name || '').toLowerCase();
        const descLower = (dish.description || '').toLowerCase();
        const catLower = (rest.category || '').toLowerCase();

        keywords.forEach(keyword => {
          if (nameLower.includes(keyword)) score += 5;
          if (descLower.includes(keyword)) score += 2;
          if (catLower.includes(keyword)) score += 3;
          // Exact matches get extra boost
          if (nameLower === keyword) score += 10;
        });

        if (score > 0) {
          matches.push({
            type: 'food',
            score,
            id: dish._id,
            name: dish.name,
            price: dish.price,
            image: dish.image,
            description: dish.description,
            vendorName: rest.name,
            restaurant: rest,
            category: rest.category
          });
        }
      });
    });

    // B. Match grocery products
    groceryProducts.forEach(prod => {
      let score = 0;
      const nameLower = (prod.name || '').toLowerCase();
      const descLower = (prod.description || '').toLowerCase();
      const catLower = (prod.category || '').toLowerCase();

      keywords.forEach(keyword => {
        if (nameLower.includes(keyword)) score += 5;
        if (descLower.includes(keyword)) score += 2;
        if (catLower.includes(keyword)) score += 3;
        if (nameLower === keyword) score += 10;
      });

      if (score > 0) {
        matches.push({
          type: 'grocery',
          score,
          id: prod.id,
          name: prod.name,
          price: prod.price,
          image: prod.image,
          description: prod.description,
          vendorName: 'Chow Groceries',
          product: prod,
          category: 'Grocery'
        });
      }
    });

    // Sort by match score descending
    return matches.sort((a, b) => b.score - a.score).slice(0, 5);
  };

  // Add Item to Basket handler
  const handleAddItem = (item) => {
    if (item.type === 'food') {
      const result = addDish({
        _id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image
      }, item.restaurant);

      if (result && result.conflict) {
        Alert.alert(
          "Clear Basket?",
          `Your basket contains items from another store. Clear it to add ${item.name}?`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Clear & Add", 
              onPress: () => forceAddDish({
                _id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image
              }, item.restaurant) 
            }
          ]
        );
      } else {
        Alert.alert("Success", `${item.name} added to your basket.`);
      }
    } else {
      // Grocery item addition
      const result = addDish({
        _id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image
      }, groceryStore);

      if (result && result.conflict) {
        Alert.alert(
          "Clear Basket?",
          "Your basket contains items from a restaurant. Clear it to add groceries?",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Clear & Add", 
              onPress: () => forceAddDish({
                _id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image
              }, groceryStore) 
            }
          ]
        );
      } else {
        Alert.alert("Success", `${item.name} added to groceries basket.`);
      }
    }
  };

  // View store/restaurant menu navigation handler
  const handleViewVendor = (item) => {
    if (item.type === 'food') {
      const r = item.restaurant;
      navigation.navigate('Restaurant', {
        id: r._id || r.id,
        name: r.name,
        imgUrl: r.image || r.imgUrl,
        rating: r.rating,
        reviews: r.reviews,
        address: r.address,
        description: r.description,
        dishes: r.dishes,
        lat: r.lat,
        lng: r.lng,
        category: r.category
      });
    } else {
      navigation.navigate('Groceries');
    }
  };

  // Send Message Logic with custom cuisine replies
  const sendMessage = (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    // A. Add User Message
    const userMsg = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: text,
      suggestions: []
    };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    // B. Trigger Agent Thinking & Matching
    setIsTyping(true);

    setTimeout(() => {
      const matches = findMatches(text);
      let replyText = '';

      if (matches.length > 0) {
        // Find dominant category matched
        const topMatch = matches[0];
        const category = topMatch.category?.toLowerCase() || '';

        if (category === 'nigerian') {
          replyText = `🌶️ Smoky, hot, and delicious! I found the perfect Nigerian Bukka feasts (smoky Jollof, Egusi, Suya) for you. Check them out:`;
        } else if (category === 'pizza') {
          replyText = `🍕 Mamma mia! I matched some delicious fresh pizzas from Nonna's Pizzeria for you. Check them out:`;
        } else if (category === 'sushi') {
          replyText = `🍣 Fresh rolls and platters heading your way! I matched these Japanese specialties from Sakura Zen:`;
        } else if (category === 'burgers') {
          replyText = `🍔 Craft burger alert! I matched these gourmet smashed beef patties and truffle fries for you:`;
        } else if (category === 'healthy') {
          replyText = `🥗 Fresh and nutritious! I matched these healthy quinoa power bowls and Caesar salads:`;
        } else if (category === 'grocery') {
          replyText = `🛒 Stocking up? I matched these items from Chow Groceries to replenish your kitchen:`;
        } else {
          replyText = `I found some delicious options matching "${text}" for you! Check them out below:`;
        }
      } else {
        replyText = `Hmm, I couldn't find a direct match for "${text}" in our active menus.\n\nAre you in the mood for Pizza, Burgers, Sushi, Nigerian dishes, or fresh Groceries? Tell me what you'd like to eat!`;
      }

      const agentMsg = {
        id: 'msg_' + (Date.now() + 1),
        sender: 'agent',
        text: replyText,
        suggestions: matches
      };

      setMessages(prev => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Panel */}
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.aiAvatar}>
            <Ionicons name="hardware-chip-outline" size={24} color="#FFF" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Chow AI Assistant</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.statusDot} />
              <Text style={styles.headerSubtitle}>Online • Ready to Order</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages Log */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={{ padding: 15, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <View key={msg.id} style={[styles.msgRow, isAgent ? styles.rowAgent : styles.rowUser]}>
                {isAgent && (
                  <View style={styles.bubbleAvatar}>
                    <Ionicons name="robot-outline" size={16} color="#06C167" />
                  </View>
                )}
                <View style={{ flex: 1, alignItems: isAgent ? 'flex-start' : 'flex-end' }}>
                  <View style={[styles.bubble, isAgent ? styles.bubbleAgent : styles.bubbleUser]}>
                    <Text style={styles.bubbleText}>{msg.text}</Text>
                  </View>

                  {/* Recommendations Cards Carousel */}
                  {isAgent && msg.suggestions && msg.suggestions.length > 0 && (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={{ marginTop: 12, width: '100%' }}
                      contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                    >
                      {msg.suggestions.map((item) => (
                        <View key={item.id} style={styles.recommendCard}>
                          <Image source={{ uri: item.image }} style={styles.cardImage} />
                          <View style={styles.cardInfo}>
                            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.cardVendor} numberOfLines={1}>📍 {item.vendorName}</Text>
                            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                            
                            <View style={styles.priceRow}>
                              <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
                              {item.type === 'food' && item.restaurant?.rating && (
                                <View style={styles.ratingBadge}>
                                  <Ionicons name="star" size={12} color="#FFB300" />
                                  <Text style={styles.ratingText}>{item.restaurant.rating}</Text>
                                </View>
                              )}
                            </View>

                            <View style={styles.cardButtonsRow}>
                              <TouchableOpacity 
                                style={[styles.cardBtn, styles.btnPrimary]}
                                onPress={() => handleAddItem(item)}
                              >
                                <Ionicons name="cart" size={14} color="#FFF" />
                                <Text style={styles.btnText}>Add</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.cardBtn, styles.btnSecondary]}
                                onPress={() => handleViewVendor(item)}
                              >
                                <Ionicons name="restaurant" size={12} color="#ccc" />
                                <Text style={styles.btnTextSec}>Store</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={[styles.msgRow, styles.rowAgent]}>
              <View style={styles.bubbleAvatar}>
                <Ionicons name="robot-outline" size={16} color="#06C167" />
              </View>
              <View style={[styles.bubble, styles.bubbleAgent, { paddingVertical: 12, paddingHorizontal: 16 }]}>
                <ActivityIndicator size="small" color="#06C167" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Taps Suggestion Pills */}
        <View style={styles.pillsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 15 }}>
            <TouchableOpacity style={styles.pill} onPress={() => handleQuickPrompt('I want Spicy Jollof Rice')}>
              <Text style={styles.pillText}>🍗 Spicy Jollof Rice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => handleQuickPrompt('Pepperoni Pizza deals')}>
              <Text style={styles.pillText}>🍕 Pepperoni Pizza</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => handleQuickPrompt('Healthy salad bowl')}>
              <Text style={styles.pillText}>🥗 Salad Bowl</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => handleQuickPrompt('Need fresh whole milk')}>
              <Text style={styles.pillText}>🥛 Fresh Milk</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => handleQuickPrompt('Any tasty desserts?')}>
              <Text style={styles.pillText}>🍰 Sweet Desserts</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Text Input Row */}
        <View style={styles.inputArea}>
          <TextInput 
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type your food craving here..."
            placeholderTextColor="#666"
            style={styles.textInput}
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputMessage.trim() && { opacity: 0.5 }]}
            onPress={() => sendMessage()}
            disabled={!inputMessage.trim()}
          >
            <Ionicons name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Footer Nav Bar */}
      <FooterNavbar activeTab="AiAgent" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#1E1E1E'
  },
  aiAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#06C167',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06C167',
    marginRight: 4
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: 11,
  },
  chatArea: {
    flex: 1,
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 8,
    width: '100%'
  },
  rowAgent: {
    justifyContent: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleAgent: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderTopLeftRadius: 3,
  },
  bubbleUser: {
    backgroundColor: '#06C167',
    borderTopRightRadius: 3,
  },
  bubbleText: {
    color: '#FFF',
    fontSize: 13.5,
    lineHeight: 19,
  },
  pillsContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#121212',
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333'
  },
  pillText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500'
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#222',
    marginBottom: 72 // space for footer navigation bar
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
    color: '#FFF',
    paddingHorizontal: 15,
    fontSize: 13.5,
    outlineStyle: 'none'
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#06C167',
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recommendCard: {
    width: 170,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 90,
  },
  cardInfo: {
    padding: 10,
  },
  cardName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardVendor: {
    color: '#06C167',
    fontSize: 10.5,
    fontWeight: 'bold',
    marginTop: 2,
  },
  cardDesc: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 13,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  cardPrice: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    color: '#FFB300',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  cardBtn: {
    flex: 1,
    height: 28,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  btnPrimary: {
    backgroundColor: '#06C167',
  },
  btnSecondary: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444'
  },
  btnText: {
    color: '#FFF',
    fontSize: 10.5,
    fontWeight: 'bold'
  },
  btnTextSec: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: 'bold'
  }
});
