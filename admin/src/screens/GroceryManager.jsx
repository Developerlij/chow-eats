import React, { useState, useEffect } from 'react';
import { database, storage } from '../firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { Plus, Tag, Apple, Upload, Trash2, Layers } from 'lucide-react';

export default function GroceryManager() {
  // Category management state
  const [categories, setCategories] = useState([]);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('leaf-outline');
  const [catColor, setCatColor] = useState('#E8F5E9');

  // Product management state
  const [products, setProducts] = useState([]);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodImage, setProdImage] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'categories'

  // Load lists from Realtime Database
  useEffect(() => {
    const catsRef = ref(database, 'groceryCategories');
    const unsubscribeCats = onValue(catsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setCategories(list);
        if (list.length > 0 && !prodCat) {
          setProdCat(list[0].name);
        }
      } else {
        setCategories([]);
      }
    });

    const prodsRef = ref(database, 'groceryProducts');
    const unsubscribeProds = onValue(prodsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setProducts(list);
      } else {
        setProducts([]);
      }
    });

    return () => {
      unsubscribeCats();
      unsubscribeProds();
    };
  }, [prodCat]);

  // Handle local image file selector
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress('Processing...');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      setProdImage(reader.result);
      setUploadProgress('Ready (local)!');

      try {
        const { ref: sRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const fileRef = sRef(storage, `groceries/${Date.now()}_${file.name}`);
        
        setUploadProgress('Uploading...');
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        setProdImage(downloadUrl);
        setUploadProgress('Cloud upload success!');
      } catch (err) {
        console.warn("Storage upload failed, keeping base64 fallback:", err);
        setUploadProgress('Ready (local)!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName) {
      setErrorMsg("Please fill in Category Name.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const newCat = {
      name: catName,
      icon: catIcon,
      color: catColor
    };

    try {
      const catsRef = ref(database, 'groceryCategories');
      const newCatRef = push(catsRef);
      await set(newCatRef, newCat);
      setSuccessMsg(`Category "${catName}" added successfully.`);
      setCatName('');
    } catch (err) {
      setErrorMsg("Failed to add category: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const catRef = ref(database, `groceryCategories/${id}`);
        await remove(catRef);
        setSuccessMsg(`Category "${name}" deleted successfully.`);
      } catch (err) {
        setErrorMsg("Failed to delete category: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodImage || !prodCat) {
      setErrorMsg("Please fill in Name, Price, Category, and choose an Image.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const newProd = {
      name: prodName,
      description: prodDesc,
      price: parseFloat(prodPrice) || 0,
      category: prodCat,
      image: prodImage
    };

    try {
      const prodsRef = ref(database, 'groceryProducts');
      const newProdRef = push(prodsRef);
      await set(newProdRef, newProd);
      setSuccessMsg(`Grocery item "${prodName}" added successfully!`);
      // Reset form fields
      setProdName('');
      setProdDesc('');
      setProdPrice('');
      setProdImage('');
      setUploadProgress('');
    } catch (err) {
      setErrorMsg("Failed to add product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const prodRef = ref(database, `groceryProducts/${id}`);
        await remove(prodRef);
        setSuccessMsg(`Grocery item "${name}" deleted successfully.`);
      } catch (err) {
        setErrorMsg("Failed to delete product: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      {/* Messages */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>{successMsg}</div>
      )}
      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{errorMsg}</div>
      )}

      {/* Screen Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button 
          onClick={() => { setActiveTab('products'); setErrorMsg(''); setSuccessMsg(''); }}
          className="btn"
          style={{ 
            backgroundColor: activeTab === 'products' ? '#06C167' : 'transparent',
            color: activeTab === 'products' ? '#FFF' : '#333',
            border: activeTab === 'products' ? 'none' : '1px solid #CCC',
            borderRadius: '20px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            width: 'auto'
          }}
        >
          <Apple size={16} style={{ marginRight: '6px' }} />
          Manage Products
        </button>
        <button 
          onClick={() => { setActiveTab('categories'); setErrorMsg(''); setSuccessMsg(''); }}
          className="btn"
          style={{ 
            backgroundColor: activeTab === 'categories' ? '#06C167' : 'transparent',
            color: activeTab === 'categories' ? '#FFF' : '#333',
            border: activeTab === 'categories' ? 'none' : '1px solid #CCC',
            borderRadius: '20px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            width: 'auto'
          }}
        >
          <Layers size={16} style={{ marginRight: '6px' }} />
          Manage Categories
        </button>
      </div>

      {activeTab === 'products' ? (
        /* MANAGE GROCERY PRODUCTS */
        <div className="charts-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
          {/* Left: Add Product Form */}
          <div className="card">
            <div className="card-title">Add Grocery Product</div>
            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label>Product Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={prodName} 
                  onChange={e => setProdName(e.target.value)} 
                  placeholder="e.g. Organic Bananas" 
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  value={prodDesc} 
                  onChange={e => setProdDesc(e.target.value)} 
                  placeholder="e.g. Bunch of 5-6 fresh bananas" 
                  style={{ height: '70px', resize: 'none' }}
                />
              </div>

              <div className="form-group">
                <label>Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  value={prodPrice} 
                  onChange={e => setProdPrice(e.target.value)} 
                  placeholder="e.g. 2.99" 
                />
              </div>

              <div className="form-group">
                <label>Category Group</label>
                <select 
                  className="form-control" 
                  value={prodCat} 
                  onChange={e => setProdCat(e.target.value)}
                >
                  {categories.length > 0 ? (
                    categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                  ) : (
                    <>
                      <option value="Fresh Produce">Fresh Produce</option>
                      <option value="Dairy & Eggs">Dairy & Eggs</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Snacks">Snacks</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Product Image</span>
                  {uploadProgress && <span style={{ color: '#06C167', fontSize: '11px' }}>{uploadProgress}</span>}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed #CCC', padding: '8px', borderRadius: '6px', backgroundColor: '#FAFAFA', marginBottom: '8px' }}>
                  <Upload size={16} color="#666" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '13px' }} />
                </div>
                <input 
                  type="text" 
                  className="form-control" 
                  value={prodImage} 
                  onChange={e => setProdImage(e.target.value)} 
                  placeholder="Or paste food image URL..." 
                  style={{ fontSize: '12px' }}
                />
              </div>

              <button type="submit" className="btn" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                {loading ? 'Adding...' : 'Add Grocery Item'}
              </button>
            </form>
          </div>

          {/* Right: Products List */}
          <div className="card">
            <div className="card-title">
              <span>Active Grocery Products ({products.length})</span>
              <Apple size={18} color="#06C167" />
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((prod) => (
                      <tr key={prod.id}>
                        <td>
                          <img src={prod.image} alt={prod.name} style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover', backgroundColor: '#eee' }} />
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{prod.name}</td>
                        <td>
                          <span style={{ padding: '4px 8px', backgroundColor: '#F0F0F0', borderRadius: '4px', fontSize: '12px' }}>
                            {prod.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: '800', color: '#06C167' }}>${prod.price.toFixed(2)}</td>
                        <td style={{ color: '#666', fontSize: '13px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.description}
                        </td>
                        <td>
                          <button 
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                            title="Delete Product"
                          >
                            <Trash2 size={16} color="#D32F2F" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                        No grocery products configured in database yet. Add your first item!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* MANAGE GROCERY CATEGORIES */
        <div className="charts-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
          {/* Left: Add Category Form */}
          <div className="card">
            <div className="card-title">Add Category Group</div>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label>Category Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                  placeholder="e.g. Organic Greens" 
                />
              </div>

              <div className="form-group">
                <label>Ionicons Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={catIcon} 
                  onChange={e => setCatIcon(e.target.value)} 
                  placeholder="e.g. leaf-outline" 
                />
              </div>

              <div className="form-group">
                <label>Badge Color (HEX/RGB)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="color" 
                    value={catColor} 
                    onChange={e => setCatColor(e.target.value)} 
                    style={{ width: '40px', height: '40px', border: '1px solid #CCC', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
                  />
                  <input 
                    type="text" 
                    className="form-control" 
                    value={catColor} 
                    onChange={e => setCatColor(e.target.value)} 
                    placeholder="#E8F5E9" 
                  />
                </div>
              </div>

              <button type="submit" className="btn" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
                <Plus size={16} style={{ marginRight: '6px' }} />
                {loading ? 'Adding...' : 'Add Category'}
              </button>
            </form>
          </div>

          {/* Right: Categories List */}
          <div className="card">
            <div className="card-title">
              <span>Active Categories ({categories.length})</span>
              <Layers size={18} color="#06C167" />
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Preview Color</th>
                    <th>Category Name</th>
                    <th>Icon Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <tr key={cat.id}>
                        <td>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: cat.color, border: '1px solid #CCC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            ✓
                          </div>
                        </td>
                        <td style={{ fontWeight: 'bold' }}>{cat.name}</td>
                        <td style={{ fontFamily: 'monospace', color: '#666' }}>{cat.icon}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                            title="Delete Category"
                          >
                            <Trash2 size={16} color="#D32F2F" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                        No categories found in database. Using local default list fallback on client app.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
