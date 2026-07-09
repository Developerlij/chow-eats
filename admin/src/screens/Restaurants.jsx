import React, { useState, useEffect } from 'react';
import { database, storage } from '../firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { Plus, Store, Navigation, Upload } from 'lucide-react';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Pizza');
  const [image, setImage] = useState('');
  const [lat, setLat] = useState('37.7749');
  const [lng, setLng] = useState('-122.4194');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress('Uploading...');
    setErrorMsg('');
    
    try {
      const { ref: sRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const fileRef = sRef(storage, `restaurants/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      setImage(downloadUrl);
      setUploadProgress('Upload success!');
    } catch (err) {
      console.warn("Firebase Storage failed, trying base64 fallback:", err);
      // Fallback: Read file locally as Base64 Data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setUploadProgress('Local upload ready (Base64)!');
      };
      reader.readAsDataURL(file);
    }
  };

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
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    if (!name || !address || !image) {
      setErrorMsg("Please fill in Name, Address, and Image URL.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const newRestaurant = {
      name,
      description,
      address,
      category,
      image,
      lat: parseFloat(lat) || 37.7749,
      lng: parseFloat(lng) || -122.4194,
      rating: 4.5,
      reviews: "1 review",
      dishes: []
    };

    try {
      const restRef = ref(database, 'restaurants');
      const newRestRef = push(restRef);
      // Set the generated ID inside the object itself
      newRestaurant._id = newRestRef.key;
      await set(newRestRef, newRestaurant);

      setSuccessMsg("Restaurant added successfully! It will instantly appear on the customer app.");
      // Reset form fields
      setName('');
      setDescription('');
      setAddress('');
      setImage('');
    } catch (err) {
      setErrorMsg("Failed to add restaurant: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="charts-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Left Side: Add Restaurant Form */}
        <div className="card">
          <div className="card-title">
            <span>Add Restaurant</span>
            <Store size={18} color="#06C167" />
          </div>

          {successMsg && <div style={{ padding: '12px', backgroundColor: '#E8F5E9', color: '#388E3C', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold' }}>{successMsg}</div>}
          {errorMsg && <div style={{ padding: '12px', backgroundColor: '#FFEBEE', color: '#D32F2F', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{errorMsg}</div>}

          <form onSubmit={handleAddRestaurant}>
            <div className="form-group">
              <label>Restaurant Name</label>
              <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nonna's Pizzeria" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input type="text" className="form-control" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Authentic stone-baked pizza" />
            </div>

            <div className="form-group">
              <label>Address</label>
              <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 123 Roman Way, Food Town" />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Pizza">Pizza</option>
                  <option value="Burgers">Burgers</option>
                  <option value="Sushi">Sushi</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Nigerian">Nigerian</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Restaurant Image</span>
                  {uploadProgress && <span style={{ fontSize: '12px', color: '#06C167', fontWeight: 'bold' }}>{uploadProgress}</span>}
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* File Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed #444', padding: '10px', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                    <Upload size={16} color="#666" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      style={{ fontSize: '13px', cursor: 'pointer' }}
                    />
                  </div>
                  
                  {/* Manual URL Input */}
                  <input 
                    type="text" 
                    className="form-control" 
                    value={image} 
                    onChange={e => setImage(e.target.value)} 
                    placeholder="Or paste an image URL here directly..." 
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Latitude</label>
                <input type="text" className="form-control" value={lat} onChange={e => setLat(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Longitude</label>
                <input type="text" className="form-control" value={lng} onChange={e => setLng(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              <Plus size={16} style={{ marginRight: '6px' }} />
              {loading ? 'Creating...' : 'Create Restaurant'}
            </button>
          </form>
        </div>

        {/* Right Side: Restaurants List */}
        <div className="card">
          <div className="card-title">Active Restaurants</div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Rating</th>
                  <th>Address</th>
                  <th>Location (Lat/Lng)</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.length > 0 ? (
                  restaurants.map((rest) => (
                    <tr key={rest.id}>
                      <td>
                        <img src={rest.image} alt={rest.name} style={{ width: '50px', height: '40px', borderRadius: '6px', objectFit: 'cover', backgroundColor: '#eee' }} />
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{rest.name}</td>
                      <td>
                        <span style={{ padding: '4px 8px', backgroundColor: '#F0F0F0', borderRadius: '4px', fontSize: '12px' }}>
                          {rest.category}
                        </span>
                      </td>
                      <td>⭐ {rest.rating} ({rest.reviews})</td>
                      <td>{rest.address}</td>
                      <td>
                        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', color: '#666' }}>
                          <Navigation size={12} style={{ marginRight: '4px' }} />
                          {rest.lat.toFixed(4)}, {rest.lng.toFixed(4)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                      No restaurants configured in database yet. The mobile app is running on local fallbacks. Add your first restaurant!
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
