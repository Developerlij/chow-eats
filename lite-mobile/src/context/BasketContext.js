import React, { createContext, useState, useEffect } from 'react';

export const BasketContext = createContext();

export const BasketProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]); // Array of { dish, quantity }
  
  // Active Order Tracking State (for Footer Countdown)
  const [orderActive, setOrderActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [activeOrderRestaurant, setActiveOrderRestaurant] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);

  useEffect(() => {
    let interval;
    if (orderActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // Ticks every 1 second in real time
    }
    return () => clearInterval(interval);
  }, [orderActive, timeLeft]);

  const startOrderTracking = (restDetails, orderId) => {
    setActiveOrderRestaurant(restDetails);
    setActiveOrderId(orderId);
    setOrderActive(true);
    setTimeLeft(1500); // 25 minutes (10 mins prep + 15 mins delivery)
  };

  const cancelOrderTracking = () => {
    setOrderActive(false);
    setTimeLeft(1500);
    setActiveOrderRestaurant(null);
    setActiveOrderId(null);
  };

  const addDish = (dish, targetRestaurant) => {
    // If we're starting a basket or switching to a new restaurant when basket is empty
    if (!restaurant || items.length === 0) {
      setRestaurant(targetRestaurant);
      setItems([{ dish, quantity: 1 }]);
      return { success: true };
    }

    // Check if adding from the same restaurant
    if (restaurant._id !== targetRestaurant._id) {
      // Return a status indicating a restaurant mismatch so the screen can ask to clear
      return { success: false, conflict: true };
    }

    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.dish._id === dish._id);
      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      } else {
        return [...prevItems, { dish, quantity: 1 }];
      }
    });
    return { success: true };
  };

  const removeDish = (dish) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.dish._id === dish._id);
      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        if (newItems[existingItemIndex].quantity > 1) {
          newItems[existingItemIndex].quantity -= 1;
          return newItems;
        } else {
          // Remove item
          const filtered = newItems.filter((item) => item.dish._id !== dish._id);
          // If basket becomes empty, clear restaurant too
          if (filtered.length === 0) {
            setRestaurant(null);
          }
          return filtered;
        }
      }
      return prevItems;
    });
  };

  const forceAddDish = (dish, targetRestaurant) => {
    setRestaurant(targetRestaurant);
    setItems([{ dish, quantity: 1 }]);
  };

  const clearBasket = () => {
    setItems([]);
    setRestaurant(null);
  };

  // Helper calculations
  const getBasketTotal = () => {
    return items.reduce((total, item) => total + item.dish.price * item.quantity, 0);
  };

  const getBasketCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const getDishCount = (dishId) => {
    const item = items.find((item) => item.dish._id === dishId);
    return item ? item.quantity : 0;
  };

  return (
    <BasketContext.Provider value={{
      restaurant,
      items,
      addDish,
      removeDish,
      forceAddDish,
      clearBasket,
      getBasketTotal,
      getBasketCount,
      getDishCount,
      // Tracking fields
      orderActive,
      timeLeft,
      activeOrderRestaurant,
      activeOrderId,
      setActiveOrderId,
      startOrderTracking,
      cancelOrderTracking
    }}>
      {children}
    </BasketContext.Provider>
  );
};
