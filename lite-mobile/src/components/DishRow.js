import React, { useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BasketContext } from '../context/BasketContext';
import { urlFor } from '../services/dataService';

export default function DishRow({ id, name, description, price, imgUrl, restaurant }) {
  const [isPressed, setIsPressed] = useState(false);
  const { addDish, removeDish, forceAddDish, getDishCount } = useContext(BasketContext);
  
  const quantity = getDishCount(id);

  const handleAddItem = () => {
    const result = addDish({ _id: id, name, description, price, image: imgUrl }, restaurant);
    
    if (result && result.conflict) {
      Alert.alert(
        "Change Restaurant?",
        "Your basket contains items from another restaurant. Would you like to clear your basket and add this item?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Clear & Add", 
            onPress: () => forceAddDish({ _id: id, name, description, price, image: imgUrl }, restaurant) 
          }
        ]
      );
    }
  };

  const handleRemoveItem = () => {
    if (quantity > 0) {
      removeDish({ _id: id });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.rowContainer}
        onPress={() => setIsPressed(!isPressed)}
        activeOpacity={0.8}
      >
        <View style={styles.detailsContainer}>
          <Text style={styles.dishName}>{name}</Text>
          <Text style={styles.dishDescription} numberOfLines={2}>{description}</Text>
          <Text style={styles.dishPrice}>${price.toFixed(2)}</Text>
        </View>

        {imgUrl ? (
          <Image 
            source={{ uri: urlFor(imgUrl) }} 
            style={styles.dishImage} 
          />
        ) : null}
      </TouchableOpacity>

      {(isPressed || quantity > 0) ? (
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            onPress={handleRemoveItem} 
            disabled={quantity === 0}
            style={[styles.controlButton, quantity === 0 && styles.disabledButton]}
          >
            <Ionicons name="remove" size={20} color={quantity === 0 ? '#CCCCCC' : '#06C167'} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{quantity}</Text>

          <TouchableOpacity 
            onPress={handleAddItem}
            style={styles.controlButton}
          >
            <Ionicons name="add" size={20} color="#06C167" />
          </TouchableOpacity>
        </View>
      ) : null}
      
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  rowContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsContainer: {
    flex: 1,
    paddingRight: 16,
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  dishDescription: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 18,
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  dishImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F3F3',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  controlButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  disabledButton: {
    borderColor: '#F0F0F0',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 16,
  },
});
