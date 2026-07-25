import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { 
  Boxes, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ShoppingCart,
  Edit2,
  Save,
  Trash2,
  Package
} from 'lucide-react';

export default function InventoryManager() {
  const [activeTab, setActiveTab] = useState('food'); // 'food' or 'groceries'
  const [restaurants, setRestaurants] = useState([]);
  const [groceryProducts, setGroceryProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingStock, setEditingStock] = useState(0);

  // Load database nodes
  useEffect(() => {
    // 1. Load restaurants & food menu items
    const restRef = ref(database, 'restaurants');
    const unsubscribeRest = onValue(restRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRestaurants(Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })));
      } else {
        setRestaurants([]);
      }
    });

    // 2. Load grocery products
    const groceryRef = ref(database, 'groceryProducts');
    const unsubscribeGrocery = onValue(groceryRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGroceryProducts(Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })));
      } else {
        setGroceryProducts([]);
      }
    });

    return () => {
      unsubscribeRest();
      unsubscribeGrocery();
    };
  }, []);

  // Extract all dishes across all restaurants
  const allDishes = [];
  restaurants.forEach(rest => {
    const dishesList = rest.dishes 
      ? (Array.isArray(rest.dishes) ? rest.dishes : Object.values(rest.dishes))
      : [];
    dishesList.forEach((dish, index) => {
      allDishes.push({
        ...dish,
        restaurantId: rest.id,
        restaurantName: rest.name,
        index // original array index for updates
      });
    });
  });

  // Filter items based on search query
  const filteredDishes = allDishes.filter(dish => 
    dish.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroceries = groceryProducts.filter(prod => 
    prod.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Low stock selector (stock < 10)
  const lowStockDishes = allDishes.filter(d => (d.stock !== undefined ? d.stock : 99) < 10);
  const lowStockGroceries = groceryProducts.filter(g => (g.stock !== undefined ? g.stock : 99) < 10);

  // Toggle food dish availability status
  const handleToggleDishAvailability = async (dish) => {
    const isCurrentlyAvailable = dish.available !== false;
    const targetPath = `restaurants/${dish.restaurantId}/dishes/${dish.index}`;
    try {
      await update(ref(database, targetPath), {
        available: !isCurrentlyAvailable
      });
      alert(`Availability status updated for "${dish.name}"`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Adjust food dish stock level
  const handleSaveDishStock = async (dish) => {
    const targetPath = `restaurants/${dish.restaurantId}/dishes/${dish.index}`;
    try {
      await update(ref(database, targetPath), {
        stock: parseInt(editingStock) || 0
      });
      setEditingId(null);
      alert(`Stock level for "${dish.name}" adjusted successfully!`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Toggle grocery product availability status
  const handleToggleGroceryAvailability = async (prod) => {
    const isCurrentlyAvailable = prod.available !== false;
    const targetPath = `groceryProducts/${prod.id}`;
    try {
      await update(ref(database, targetPath), {
        available: !isCurrentlyAvailable
      });
      alert(`Availability status updated for "${prod.name}"`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Adjust grocery product stock level
  const handleSaveGroceryStock = async (prod) => {
    const targetPath = `groceryProducts/${prod.id}`;
    try {
      await update(ref(database, targetPath), {
        stock: parseInt(editingStock) || 0
      });
      setEditingId(null);
      alert(`Stock level for "${prod.name}" adjusted successfully!`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search and stats bar */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input 
            type="text" 
            placeholder="Search inventory items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: '#1A1A1A', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '10px 12px 10px 38px', outline: 'none', fontSize: '13.5px' }}
          />
        </div>

        {/* Tab triggers */}
        <div style={{ display: 'flex', gap: '8px', background: '#1A1A1A', padding: '4px', borderRadius: '8px', border: '1px solid #333' }}>
          <button
            onClick={() => { setActiveTab('food'); setSearchQuery(''); }}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px', background: activeTab === 'food' ? '#06C167' : 'transparent', color: activeTab === 'food' ? '#FFF' : '#aaa' }}
          >
            🍔 Food Menu ({allDishes.length})
          </button>
          <button
            onClick={() => { setActiveTab('groceries'); setSearchQuery(''); }}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px', background: activeTab === 'groceries' ? '#06C167' : 'transparent', color: activeTab === 'groceries' ? '#FFF' : '#aaa' }}
          >
            🍎 Groceries ({groceryProducts.length})
          </button>
          <button
            onClick={() => { setActiveTab('lowStock'); setSearchQuery(''); }}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12.5px', background: activeTab === 'lowStock' ? '#D32F2F' : 'transparent', color: activeTab === 'lowStock' ? '#FFF' : '#aaa' }}
          >
            ⚠️ Low Stock Warnings ({lowStockDishes.length + lowStockGroceries.length})
          </button>
        </div>
      </div>

      {/* Main Grid display */}
      <div className="card" style={{ padding: '20px' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Boxes size={20} color="#06C167" />
          <span style={{ textTransform: 'capitalize' }}>{activeTab} Inventory Control Ledger</span>
        </div>

        <div className="table-responsive" style={{ marginTop: '15px' }}>
          
          {/* FOOD DISHES TABLE */}
          {activeTab === 'food' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Dish image</th>
                  <th>Dish Name</th>
                  <th>Restaurant</th>
                  <th>Price</th>
                  <th>Availability</th>
                  <th>Stock Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDishes.length > 0 ? (
                  filteredDishes.map((dish) => {
                    const isAvailable = dish.available !== false;
                    const stockVal = dish.stock !== undefined ? dish.stock : 99;
                    const isEditing = editingId === dish._id;
                    return (
                      <tr key={dish._id}>
                        <td>
                          <img src={dish.image} alt={dish.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#FFF' }}>{dish.name}</td>
                        <td style={{ fontSize: '13px' }}>{dish.restaurantName}</td>
                        <td>#{dish.price.toFixed(2)}</td>
                        <td>
                          <button
                            onClick={() => handleToggleDishAvailability(dish)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 'bold', color: isAvailable ? '#388E3C' : '#D32F2F' }}
                          >
                            {isAvailable ? <CheckCircle size={15} /> : <XCircle size={15} />}
                            {isAvailable ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>
                        <td>
                          {isEditing ? (
                            <input 
                              type="number"
                              value={editingStock}
                              onChange={(e) => setEditingStock(e.target.value)}
                              style={{ width: '70px', background: '#121212', border: '1px solid #444', color: '#FFF', borderRadius: '4px', padding: '4px 6px', outline: 'none' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: stockVal < 10 ? '#D32F2F' : '#FFF' }}>
                              {stockVal} units
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <button 
                              className="action-btn-small action-btn-primary" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px' }}
                              onClick={() => handleSaveDishStock(dish)}
                            >
                              <Save size={13} />
                              Save
                            </button>
                          ) : (
                            <button 
                              className="action-btn-small" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#333', color: '#FFF' }}
                              onClick={() => { setEditingId(dish._id); setEditingStock(stockVal); }}
                            >
                              <Edit2 size={13} />
                              Adjust
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                      No food dishes matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* GROCERY PRODUCTS TABLE */}
          {activeTab === 'groceries' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Product image</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Availability</th>
                  <th>Stock Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroceries.length > 0 ? (
                  filteredGroceries.map((prod) => {
                    const isAvailable = prod.available !== false;
                    const stockVal = prod.stock !== undefined ? prod.stock : 99;
                    const isEditing = editingId === prod.id;
                    return (
                      <tr key={prod.id}>
                        <td>
                          <img src={prod.image} alt={prod.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#FFF' }}>{prod.name}</td>
                        <td style={{ fontSize: '13px' }}>{prod.category}</td>
                        <td>#{prod.price.toFixed(2)}</td>
                        <td>
                          <button
                            onClick={() => handleToggleGroceryAvailability(prod)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 'bold', color: isAvailable ? '#388E3C' : '#D32F2F' }}
                          >
                            {isAvailable ? <CheckCircle size={15} /> : <XCircle size={15} />}
                            {isAvailable ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>
                        <td>
                          {isEditing ? (
                            <input 
                              type="number"
                              value={editingStock}
                              onChange={(e) => setEditingStock(e.target.value)}
                              style={{ width: '70px', background: '#121212', border: '1px solid #444', color: '#FFF', borderRadius: '4px', padding: '4px 6px', outline: 'none' }}
                            />
                          ) : (
                            <span style={{ fontWeight: 'bold', color: stockVal < 10 ? '#D32F2F' : '#FFF' }}>
                              {stockVal} units
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <button 
                              className="action-btn-small action-btn-primary" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px' }}
                              onClick={() => handleSaveGroceryStock(prod)}
                            >
                              <Save size={13} />
                              Save
                            </button>
                          ) : (
                            <button 
                              className="action-btn-small" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#333', color: '#FFF' }}
                              onClick={() => { setEditingId(prod.id); setEditingStock(stockVal); }}
                            >
                              <Edit2 size={13} />
                              Adjust
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                      No grocery items matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* LOW STOCK WARNINGS TABLE */}
          {activeTab === 'lowStock' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Item Name</th>
                  <th>Merchant / Category</th>
                  <th>Current Stock</th>
                  <th>Replenishment Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockDishes.length > 0 || lowStockGroceries.length > 0 ? (
                  <>
                    {/* Low stock food items */}
                    {lowStockDishes.map((dish) => (
                      <tr key={dish._id}>
                        <td><span className="status-badge" style={{ backgroundColor: '#2196F3', color: '#FFF', borderColor: 'transparent' }}>FOOD</span></td>
                        <td style={{ fontWeight: 'bold', color: '#FFF' }}>{dish.name}</td>
                        <td style={{ fontSize: '13px' }}>{dish.restaurantName}</td>
                        <td style={{ color: '#D32F2F', fontWeight: 'bold' }}>{dish.stock !== undefined ? dish.stock : 99} units</td>
                        <td>
                          <button 
                            className="action-btn-small action-btn-primary"
                            onClick={() => { setEditingId(dish._id); setEditingStock(dish.stock || 0); }}
                          >
                            Replenish
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Low stock grocery items */}
                    {lowStockGroceries.map((prod) => (
                      <tr key={prod.id}>
                        <td><span className="status-badge" style={{ backgroundColor: '#4CAF50', color: '#FFF', borderColor: 'transparent' }}>GROCERY</span></td>
                        <td style={{ fontWeight: 'bold', color: '#FFF' }}>{prod.name}</td>
                        <td style={{ fontSize: '13px' }}>{prod.category}</td>
                        <td style={{ color: '#D32F2F', fontWeight: 'bold' }}>{prod.stock !== undefined ? prod.stock : 99} units</td>
                        <td>
                          <button 
                            className="action-btn-small action-btn-primary"
                            onClick={() => { setEditingId(prod.id); setEditingStock(prod.stock || 0); }}
                          >
                            Replenish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                      All systems green! No items currently fall below minimum inventory thresholds.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

        </div>
      </div>

    </div>
  );
}
