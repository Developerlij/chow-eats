import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import { Plus, Coffee, Tag } from 'lucide-react';

export default function MenuManager() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestId, setSelectedRestId] = useState('');
  
  // New Dish Form State
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishImage, setDishImage] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const restRef = ref(database, 'restaurants');
    const unsubscribe = onValue(restRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setRestaurants(list);
        if (list.length > 0 && !selectedRestId) {
          setSelectedRestId(list[0].id);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedRestId]);

  const getSelectedRestaurant = () => {
    return restaurants.find(r => r.id === selectedRestId) || null;
  };

  const handleAddDish = async (e) => {
    e.preventDefault();
    const selectedRestaurant = getSelectedRestaurant();
    
    if (!selectedRestaurant) {
      setErrorMsg("Please select a valid restaurant first.");
      return;
    }
    if (!dishName || !dishPrice || !dishImage) {
      setErrorMsg("Please fill in Name, Price, and Image URL.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const newDish = {
      _id: `dish_${Date.now()}`,
      name: dishName,
      description: dishDesc,
      price: parseFloat(dishPrice) || 0,
      image: dishImage
    };

    // Make sure we append to existing dishes or initialize new array
    let currentDishes = [];
    if (selectedRestaurant.dishes) {
      if (Array.isArray(selectedRestaurant.dishes)) {
        currentDishes = [...selectedRestaurant.dishes];
      } else {
        // If stored as object list by firebase
        currentDishes = Object.values(selectedRestaurant.dishes);
      }
    }

    const updatedDishes = [...currentDishes, newDish];

    try {
      const dishesRef = ref(database, `restaurants/${selectedRestId}/dishes`);
      await set(dishesRef, updatedDishes);

      setSuccessMsg(`Food "${dishName}" uploaded successfully! It is live on the mobile app.`);
      setDishName('');
      setDishDesc('');
      setDishPrice('');
      setDishImage('');
    } catch (err) {
      setErrorMsg("Failed to add dish: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedRest = getSelectedRestaurant();
  const currentDishesList = selectedRest?.dishes 
    ? (Array.isArray(selectedRest.dishes) ? selectedRest.dishes : Object.values(selectedRest.dishes))
    : [];

  return (
    <div>
      <div className="charts-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Left Side: Upload Dish Form */}
        <div className="card">
          <div className="card-title">
            <span>Upload Food Item</span>
            <Coffee size={18} color="#06C167" />
          </div>

          <div className="form-group">
            <label>Select Restaurant</label>
            <select 
              className="form-control"
              value={selectedRestId}
              onChange={e => {
                setSelectedRestId(e.target.value);
                setSuccessMsg('');
                setErrorMsg('');
              }}
            >
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div style={{ height: '1px', backgroundColor: '#eee', margin: '20px 0' }} />

          {successMsg && <div style={{ padding: '12px', backgroundColor: '#E8F5E9', color: '#388E3C', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold' }}>{successMsg}</div>}
          {errorMsg && <div style={{ padding: '12px', backgroundColor: '#FFEBEE', color: '#D32F2F', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{errorMsg}</div>}

          <form onSubmit={handleAddDish}>
            <div className="form-group">
              <label>Food Item Name</label>
              <input type="text" className="form-control" value={dishName} onChange={e => setDishName(e.target.value)} placeholder="e.g. Pepperoni Pizza" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input type="text" className="form-control" value={dishDesc} onChange={e => setDishDesc(e.target.value)} placeholder="e.g. Spicy pepperoni and mozzarella" />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Price ($ USD)</label>
                <input type="number" step="0.01" className="form-control" value={dishPrice} onChange={e => setDishPrice(e.target.value)} placeholder="e.g. 14.99" />
              </div>

              <div className="form-group">
                <label>Food Image URL</label>
                <input type="text" className="form-control" value={dishImage} onChange={e => setDishImage(e.target.value)} placeholder="Unsplash image link" />
              </div>
            </div>

            <button type="submit" className="btn" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              {loading ? 'Uploading...' : 'Upload Food'}
            </button>
          </form>
        </div>

        {/* Right Side: Menu Items Table */}
        <div className="card">
          <div className="card-title">
            <span>Menu List: {selectedRest?.name || 'No Restaurant Selected'}</span>
            <Tag size={18} color="#666" />
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Dish Name</th>
                  <th>Description</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {currentDishesList.length > 0 ? (
                  currentDishesList.map((dish) => (
                    <tr key={dish._id}>
                      <td>
                        <img src={dish.image} alt={dish.name} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', backgroundColor: '#eee' }} />
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{dish.name}</td>
                      <td style={{ color: '#666', fontSize: '13px', maxWidth: '300px' }} numberOfLines={1}>{dish.description}</td>
                      <td style={{ fontWeight: '800', color: '#06C167' }}>${dish.price.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#999', padding: '32px' }}>
                      No food items added to this restaurant's menu yet. Fill out the form to upload your first food item!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
