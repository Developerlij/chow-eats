import React, { useState, useEffect } from 'react';
import { database, auth } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Store, 
  Coffee, 
  ShoppingCart, 
  ShieldAlert, 
  Bike, 
  Users as UsersIcon, 
  Apple,
  Lock,
  Mail,
  LogOut,
  ShieldCheck
} from 'lucide-react';

// Import Screens
import Overview from './screens/Overview';
import Restaurants from './screens/Restaurants';
import MenuManager from './screens/MenuManager';
import OrdersManager from './screens/OrdersManager';
import Drivers from './screens/Drivers';
import Users from './screens/Users';
import GroceryManager from './screens/GroceryManager';

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');

  // Unified Firebase Auth States
  const [adminUser, setAdminUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Please fill in both fields.");
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError("Invalid admin credentials. Use unified login (e.g. test@chow.com / password123).");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out from the Admin Panel?")) {
      try {
        await signOut(auth);
        setActiveTab('Overview');
        setEmail('');
        setPassword('');
      } catch (err) {
        console.error("Sign out failed:", err);
      }
    }
  };

  const navigationItems = [
    { name: 'Overview', icon: LayoutDashboard, component: Overview, label: 'Dashboard' },
    { name: 'Restaurants', icon: Store, component: Restaurants, label: 'Restaurants' },
    { name: 'Menu', icon: Coffee, component: MenuManager, label: 'Menu Manager' },
    { name: 'Orders', icon: ShoppingCart, component: OrdersManager, label: 'Live Orders' },
    { name: 'Drivers', icon: Bike, component: Drivers, label: 'Manage Drivers' },
    { name: 'Users', icon: UsersIcon, component: Users, label: 'Customers' },
    { name: 'Grocery', icon: Apple, component: GroceryManager, label: 'Grocery Manager' }
  ];

  const renderActiveScreen = () => {
    const activeItem = navigationItems.find(item => item.name === activeTab);
    if (activeItem) {
      const ScreenComponent = activeItem.component;
      return <ScreenComponent />;
    }
    return <Overview />;
  };

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', color: '#666', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #06C167', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ fontWeight: 'bold' }}>Verifying Administrator session...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    /* ADMIN SIGN IN VIEW (UNIFIED Firebase Auth LOGIN) */
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', fontFamily: 'sans-serif' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', borderRadius: '16px', border: '1px solid #EEE' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(6, 193, 103, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
              <ShieldAlert size={28} color="#06C167" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>ChowEats Admin Portal</h2>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>Secure One-Time sign in for system managers</p>
          </div>

          {authError && (
            <div style={{ padding: '12px', backgroundColor: '#FFEBEE', color: '#D32F2F', borderRadius: '8px', marginBottom: '16px', fontSize: '13.5px', border: '1px solid rgba(211, 47, 47, 0.2)' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '6px' }}>Admin Email Address</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #CCC', padding: '2px 12px', borderRadius: '8px', backgroundColor: '#FFF' }}>
                <Mail size={16} color="#666" />
                <input 
                  type="email" 
                  className="form-control" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="e.g. admin@chow.com" 
                  style={{ border: 'none', paddingLeft: 0, outline: 'none' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '6px' }}>Password</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #CCC', padding: '2px 12px', borderRadius: '8px', backgroundColor: '#FFF' }}>
                <Lock size={16} color="#666" />
                <input 
                  type="password" 
                  className="form-control" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  style={{ border: 'none', paddingLeft: 0, outline: 'none' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn" 
              style={{ width: '100%', marginTop: '8px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
              disabled={authLoading}
            >
              {authLoading ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#F9F9F9', borderRadius: '8px', border: '1px solid #EFEFEF', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#888', fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Demo System Credentials</span>
            <code style={{ fontSize: '12px', color: '#06C167', fontWeight: 'bold' }}>test@chow.com / password123</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-section">
          <ShieldAlert size={28} color="#06C167" />
          <h2 className="logo-title">ChowEats</h2>
          <span className="logo-sub">Admin</span>
        </div>

        <nav className="nav-menu">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.name)}
              >
                <span className="nav-icon">
                  <IconComponent size={20} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#06C167' }} />
            <span style={{ fontSize: '13px', color: '#888' }}>Live Sync Active</span>
          </div>
          
          <button 
            onClick={handleLogout}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              width: '100%', 
              background: 'transparent', 
              border: 'none', 
              color: '#D32F2F', 
              cursor: 'pointer', 
              fontSize: '13px', 
              fontWeight: 'bold', 
              padding: '8px 4px',
              textAlign: 'left'
            }}
          >
            <LogOut size={16} />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="workspace">
        <header className="header">
          <h1 className="header-title">
            {navigationItems.find(item => item.name === activeTab)?.label || 'Overview'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13.5px', color: '#666', fontWeight: '500' }}>{adminUser.email}</span>
            <div className="admin-badge">SYSTEM ADMINISTRATOR</div>
          </div>
        </header>

        <div className="main-content">
          {renderActiveScreen()}
        </div>
      </main>
    </div>
  );
}
