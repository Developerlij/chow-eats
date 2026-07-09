import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { ref, get } from 'firebase/database';
import { database, isMockFirebase } from '../../firebase';

// Replace with your Sanity credentials when deploying to production
const sanityConfig = {
  projectId: 'YOUR_SANITY_PROJECT_ID',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-05-03',
};

let client = null;
let builder = null;
let isMockSanity = true;

const hasValidSanity = (config) => {
  return config && 
         config.projectId && 
         config.projectId !== 'YOUR_SANITY_PROJECT_ID';
};

if (hasValidSanity(sanityConfig)) {
  try {
    client = createClient(sanityConfig);
    builder = imageUrlBuilder(client);
    isMockSanity = false;
    console.log("Sanity client initialized successfully with project ID.");
  } catch (error) {
    console.error("Sanity client initialization failed:", error);
  }
} else {
  console.log("Sanity configuration details not found. Using local Mock Data Service.");
}

// Image Helper function
export const urlFor = (source) => {
  if (!isMockSanity && builder && source) {
    try {
      return builder.image(source).url();
    } catch (e) {
      console.warn("Failed to build image URL from Sanity:", e);
    }
  }
  // Return the source string if it's already a URL (our mock data uses URLs directly)
  return source;
};

// ----------------------------------------------------
// MOCK DATASET
// ----------------------------------------------------
const mockCategories = [
  { _id: 'cat1', name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60' },
  { _id: 'cat2', name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60' },
  { _id: 'cat3', name: 'Sushi', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60' },
  { _id: 'cat4', name: 'Healthy', image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&auto=format&fit=crop&q=60' },
  { _id: 'cat5', name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=60' },
  { _id: 'cat6', name: 'Beverages', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60' },
  { _id: 'cat7', name: 'Nigerian', image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&auto=format&fit=crop&q=60' }
];

const mockDishes = {
  nonna: [
    { _id: 'dish1', name: 'Margherita Pizza', description: 'Fresh mozzarella, tomato sauce, basil, and a drizzle of extra virgin olive oil.', price: 12.99, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish2', name: 'Pepperoni Supreme', description: 'Double pepperoni, loaded cheese, oregano, and house marinara sauce.', price: 14.99, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish3', name: 'Tuscan Garlic Bread', description: 'Crisp ciabatta slices brushed with garlic herb butter, baked with mozzarella.', price: 5.99, image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500&auto=format&fit=crop&q=60' }
  ],
  burger: [
    { _id: 'dish4', name: 'Classic Craft Cheeseburger', description: 'Premium smash beef patty, cheddar cheese, lettuce, tomato, pickles, and craft sauce.', price: 10.99, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish5', name: 'Bacon BBQ Smokehouse', description: 'Double beef patty, crispy applewood smoked bacon, sharp cheddar, onion rings, and smoky BBQ sauce.', price: 13.99, image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish6', name: 'Truffle Parmesan Fries', description: 'Golden hand-cut fries tossed in white truffle oil, grated parmesan cheese, and fresh parsley.', price: 6.49, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60' }
  ],
  sakura: [
    { _id: 'dish7', name: 'Signature Sushi Platter', description: 'Assortment of chef\'s choice: 5 pieces nigiri (tuna, salmon, yellowtail) and 8 pieces california roll.', price: 21.99, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish8', name: 'Spicy Tuna Crunch Roll', description: 'Minced spicy tuna, cucumber, topped with tempura flakes, spicy mayo, and sweet eel sauce.', price: 11.99, image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish9', name: 'Steamed Edamame', description: 'Steamed soybean pods sprinkled with flaky sea salt and toasted sesame seeds.', price: 4.99, image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=60' }
  ],
  green: [
    { _id: 'dish10', name: 'Quinoa Power Bowl', description: 'Tri-color quinoa, roasted sweet potatoes, avocado, edamame, baby spinach, with lemon tahini dressing.', price: 11.49, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish11', name: 'Avocado Caesar Salad', description: 'Crispy romaine lettuce, shaved parmesan, garlic croutons, avocado slices, and light caesar dressing.', price: 9.99, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish12', name: 'Green Detox Elixir', description: 'Freshly pressed juice with celery, cucumber, kale, green apple, ginger, and lemon juice.', price: 5.99, image: 'https://images.unsplash.com/photo-1610970881699-44a5587caaec?w=500&auto=format&fit=crop&q=60' }
  ],
  nigerian: [
    { _id: 'dish13', name: 'Party Jollof Rice Feast', description: 'Rich, smoky, and party-style Nigerian Jollof rice, served with fried plantain (dodo) and succulent grilled chicken.', price: 15.99, image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish14', name: 'Egusi & Pounded Yam', description: 'Rich melon seed soup cooked with spinach, assorted meats, and dried fish, served with smooth pounded yam.', price: 18.49, image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish15', name: 'Spicy Beef Suya Skewers', description: 'Grilled beef skewers coated in traditional Yaji spice (peanut and chili blend), served with sliced onions.', price: 12.99, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60' },
    { _id: 'dish16', name: 'Sweet Golden Puff Puff', description: 'Golden, fluffy fried dough balls, sweet and soft, a classic Nigerian street food snack.', price: 6.99, image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&auto=format&fit=crop&q=60' }
  ]
};

const mockRestaurants = [
  {
    _id: 'rest1',
    name: 'Nonna\'s Pizzeria',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviews: '124 reviews',
    address: '123 Roman Way, Food Town',
    description: 'Authentic stone-baked Italian pizza made with fresh heritage flour and imported ingredients.',
    lat: 37.7882,
    lng: -122.4324,
    dishes: mockDishes.nonna,
    category: 'Pizza'
  },
  {
    _id: 'rest2',
    name: 'Burger Craft',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    rating: 4.6,
    reviews: '85 reviews',
    address: '45 Grill Avenue, Food Town',
    description: 'Gourmet smashed burgers, house-made dipping sauces, and hand-cut fries.',
    lat: 37.7699,
    lng: -122.4468,
    dishes: mockDishes.burger,
    category: 'Burgers'
  },
  {
    _id: 'rest3',
    name: 'Sakura Zen',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: '140 reviews',
    address: '88 Blossom Road, Food Town',
    description: 'Fresh sushi, sashimi platters, and traditional Japanese dishes crafted by master chefs.',
    lat: 37.7833,
    lng: -122.4167,
    dishes: mockDishes.sakura,
    category: 'Sushi'
  },
  {
    _id: 'rest4',
    name: 'Green Garden Healthy Eats',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviews: '52 reviews',
    address: '12 Wellness Blvd, Food Town',
    description: 'Nutritious bowls, salads, and cold-pressed juices to fuel your day.',
    lat: 37.7649,
    lng: -122.4194,
    dishes: mockDishes.green,
    category: 'Healthy'
  },
  {
    _id: 'rest5',
    name: 'Naija Buka Cuisine',
    image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviews: '210 reviews',
    address: '90 Lagos Street, Food Town',
    description: 'Serving traditional, rich Nigerian buka flavors: smoky Jollof, delicious Egusi soup, and grilled suya meats.',
    lat: 37.7719,
    lng: -122.4294,
    dishes: mockDishes.nigerian,
    category: 'Nigerian'
  }
];

const mockFeatured = [
  {
    _id: 'feat1',
    name: 'Featured Items',
    description: 'Handpicked favorites in your city',
    restaurants: [mockRestaurants[0], mockRestaurants[2], mockRestaurants[1]]
  },
  {
    _id: 'feat2',
    name: 'Tasty Discounts',
    description: 'Get extra savings on your order!',
    restaurants: [mockRestaurants[1], mockRestaurants[3]]
  },
  {
    _id: 'feat3',
    name: 'Offers Near You',
    description: 'Fastest delivery times straight to your door',
    restaurants: [mockRestaurants[0], mockRestaurants[3], mockRestaurants[2]]
  }
];

// ----------------------------------------------------
// SERVICE API METHODS
// ----------------------------------------------------
export const getCategories = async () => {
  if (!isMockFirebase && database) {
    try {
      const snapshot = await get(ref(database, 'categories'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(key => ({ _id: key, ...data[key] }));
      }
    } catch (e) {
      console.warn("Failed to fetch categories from Firebase:", e);
    }
  }
  
  if (isMockSanity) {
    return mockCategories;
  }
  try {
    const query = `*[_type == "category"] { _id, name, image }`;
    return await client.fetch(query);
  } catch (error) {
    console.error("Sanity getCategories failed, using mock:", error);
    return mockCategories;
  }
};

export const getFeaturedRows = async () => {
  if (!isMockFirebase && database) {
    try {
      const restSnapshot = await get(ref(database, 'restaurants'));
      if (restSnapshot.exists()) {
        const restData = restSnapshot.val();
        const dbRestaurants = Object.keys(restData).map(key => ({ _id: key, ...restData[key] }));
        
        // Return default constructed featured rows using live database restaurants
        return [
          {
            _id: 'feat1',
            name: 'Featured Items',
            description: 'Handpicked favorites in your city',
            restaurants: dbRestaurants
          },
          {
            _id: 'feat2',
            name: 'Offers Near You',
            description: 'Fastest delivery times straight to your door',
            restaurants: dbRestaurants
          },
          {
            _id: 'feat3',
            name: 'Trending Restaurants',
            description: 'Top-rated spots this week',
            restaurants: dbRestaurants.filter((_, idx) => idx % 2 === 0)
          }
        ];
      }
    } catch (e) {
      console.warn("Failed to fetch featured rows from Firebase:", e);
    }
  }

  if (isMockSanity) {
    return mockFeatured;
  }
  try {
    const query = `*[_type == "featured"] {
      _id,
      name,
      description,
      restaurants[]-> {
        ...,
        dishes[]->,
        type-> { name }
      }
    }`;
    return await client.fetch(query);
  } catch (error) {
    console.error("Sanity getFeaturedRows failed, using mock:", error);
    return mockFeatured;
  }
};

export const getFeaturedRowById = async (id) => {
  if (!isMockFirebase && database) {
    try {
      const rows = await getFeaturedRows();
      return rows.find(r => r._id === id) || null;
    } catch (e) {
      console.warn("Failed to fetch featured row by ID from Firebase:", e);
    }
  }

  if (isMockSanity) {
    return mockFeatured.find(f => f._id === id) || null;
  }
  try {
    const query = `*[_type == "featured" && _id == $id][0] {
      _id,
      name,
      description,
      restaurants[]-> {
        ...,
        dishes[]->,
        type-> { name }
      }
    }`;
    return await client.fetch(query, { id });
  } catch (error) {
    console.error("Sanity getFeaturedRowById failed, using mock:", error);
    return mockFeatured.find(f => f._id === id) || null;
  }
};

export const getRestaurantsByCategory = async (categoryName) => {
  if (!isMockFirebase && database) {
    try {
      const restSnapshot = await get(ref(database, 'restaurants'));
      if (restSnapshot.exists()) {
        const restData = restSnapshot.val();
        const dbRestaurants = Object.keys(restData).map(key => ({ _id: key, ...restData[key] }));
        return dbRestaurants.filter(r => r.category === categoryName);
      }
    } catch (e) {
      console.warn("Failed to fetch restaurants by category from Firebase:", e);
    }
  }

  if (isMockSanity) {
    return mockRestaurants.filter(r => r.category === categoryName);
  }
  try {
    const query = `*[_type == "restaurant" && type->name == $categoryName] {
      ...,
      dishes[]->,
      type-> { name }
    }`;
    return await client.fetch(query, { categoryName });
  } catch (error) {
    console.error("Sanity getRestaurantsByCategory failed, using mock:", error);
    return mockRestaurants.filter(r => r.category === categoryName);
  }
};
