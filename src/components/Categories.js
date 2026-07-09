import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  View 
} from 'react-native';

export default function Categories({ categories, activeCategory, onSelectCategory }) {
  if (!categories || categories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {categories.map((category) => {
        const isActive = activeCategory === category.name;
        
        return (
          <TouchableOpacity 
            key={category._id} 
            style={[styles.categoryCard]}
            onPress={() => onSelectCategory(isActive ? null : category.name)}
          >
            <View style={[
              styles.imageContainer, 
              isActive && styles.activeImageContainer
            ]}>
              <Image 
                source={{ uri: category.image }} 
                style={styles.categoryImage} 
              />
            </View>
            <Text style={[
              styles.categoryName, 
              isActive && styles.activeCategoryName
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 18,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F3F3',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeImageContainer: {
    borderColor: '#06C167',
    backgroundColor: '#E6FAF0',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  categoryName: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  activeCategoryName: {
    color: '#1A1A1A',
    fontWeight: 'bold',
  },
});
