import React, { useState, useEffect } from 'react';
import { ref, onValue, set, update } from 'firebase/database';
import { database } from './firebase';
import { 
  LayoutDashboard, 
  Coffee, 
  ShoppingCart, 
  ShieldAlert, 
  Apple,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react';

// Import Screens
import Overview from './screens/Overview';
import MenuManager from './screens/MenuManager';
import OrdersManager from './screens/OrdersManager';
import GroceryManager from './screens/GroceryManager';

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [pendingCount, setPendingCount] = useState(0);
  
  // Auth and Operator State
  const [allOperators, setAllOperators] = useState([]);
  const [activeOperatorId, setActiveOperatorId] = useState(localStorage.getItem('operatorId') || '');
  const [operatorData, setOperatorData] = useState(null);

  // Login Form States
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Form States
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('Live Orders Manager');

  // 1. Fetch live orders pending count
  useEffect(() => {
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList = Object.keys(data).map(key => data[key]);
        const count = orderList.filter(o => 
          o.status === 'Pending' || 
          o.status === 'Preparing' || 
          o.status === 'Preparing Order'
        ).length;
        setPendingCount(count);
      } else {
        setPendingCount(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch active operator profile and all operators list from Firebase Realtime Database
  useEffect(() => {
    const operatorsRef = ref(database, 'operators');
    const unsubscribe = onValue(operatorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setAllOperators(list);
        
        if (activeOperatorId) {
          const current = data[activeOperatorId];
          if (current) {
            setOperatorData(current);
          } else {
            setOperatorData(null);
          }
        } else {
          setOperatorData(null);
        }
      } else {
        const seedOperators = {
          op_01: { id: 'op_01', name: 'Alex Rivera', username: 'alex', password: 'password', role: 'Live Orders Manager', status: 'Active', verified: true, permissions: { Overview: true, Menu: true, Grocery: false, Orders: true } },
          op_02: { id: 'op_02', name: 'Clara Oswald', username: 'clara', password: 'password', role: 'Menu Coordinator', status: 'Active', verified: true, permissions: { Overview: false, Menu: true, Grocery: false, Orders: false } },
          op_03: { id: 'op_03', name: 'Marcus Brody', username: 'marcus', password: 'password', role: 'Grocery Lead', status: 'Offline', verified: true, permissions: { Overview: false, Menu: false, Grocery: true, Orders: false } },
          op_04: { id: 'op_04', name: 'Selina Kyle', username: 'selina', password: 'password', role: 'Night Dispatcher', status: 'Active', verified: true, permissions: { Overview: true, Menu: false, Grocery: false, Orders: true } }
        };
        set(operatorsRef, seedOperators);
      }
    });
    return () => unsubscribe();
  }, [activeOperatorId]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      alert("Please enter username and password.");
      return;
    }
    const op = allOperators.find(o => o.username?.toLowerCase() === loginUsername.toLowerCase());
    if (!op || op.password !== loginPassword) {
      alert("Invalid username or password.");
      return;
    }
    if (!op.verified) {
      alert("Your account is pending verification by the System Administrator. Access denied.");
      return;
    }

    localStorage.setItem('operatorId', op.id);
    setActiveOperatorId(op.id);
    setOperatorData(op);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signupName || !signupUsername || !signupPassword) {
      alert("Please fill in all fields.");
      return;
    }
    const exists = allOperators.some(o => o.username?.toLowerCase() === signupUsername.toLowerCase());
    if (exists) {
      alert("Username already taken. Please choose another one.");
      return;
    }

    const opId = 'op_' + Math.random().toString(36).substring(2, 9);
    const newOperator = {
      id: opId,
      name: signupName,
      username: signupUsername,
      password: signupPassword,
      role: signupRole,
      verified: false, // Default is false, needs admin verification!
      status: 'Pending Verification',
      permissions: {
        Overview: true,
        Menu: true,
        Grocery: false,
        Orders: true
      }
    };

    try {
      await set(ref(database, `operators/${opId}`), newOperator);
      alert("Registration successful! Your profile is pending verification by the Admin. You can log in once verified.");
      setIsSignUp(false);
      setSignupName('');
      setSignupUsername('');
      setSignupPassword('');
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('operatorId');
    setActiveOperatorId('');
    setOperatorData(null);
  };

  const navigationItems = [
    { name: 'Overview', icon: LayoutDashboard, component: Overview, label: 'Live Dispatch Map' },
    { name: 'Menu', icon: Coffee, component: MenuManager, label: 'Food Manager' },
    { name: 'Grocery', icon: Apple, component: GroceryManager, label: 'Product Update' },
    { name: 'Orders', icon: ShoppingCart, component: OrdersManager, label: 'Live Orders' }
  ];

  // 3. Dynamically filter navigation links based on permissions from Firebase RTDB
  const getFilteredNavigationItems = () => {
    if (!operatorData || !operatorData.permissions) return navigationItems; // fallback
    return navigationItems.filter(item => !!operatorData.permissions[item.name]);
  };

  const filteredNavigationItems = getFilteredNavigationItems();

  // 4. Auto-redirect to first available allowed module tab if permissions change
  useEffect(() => {
    if (filteredNavigationItems.length > 0) {
      const isAllowed = filteredNavigationItems.some(item => item.name === activeTab);
      if (!isAllowed) {
        setActiveTab(filteredNavigationItems[0].name);
      }
    }
  }, [operatorData, filteredNavigationItems]);

  const renderActiveScreen = () => {
    // If no permissions are active, display warning page
    if (filteredNavigationItems.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', textAlign: 'center', padding: '40px', color: '#999' }}>
          <Lock size={64} color="#D32F2F" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#FFF', fontSize: '20px', fontWeight: 'bold' }}>Terminal Access Suspended</h2>
          <p style={{ fontSize: '14px', maxWidth: '400px', marginTop: '8px', lineHeight: '20px' }}>
            Your administrator has temporarily suspended all operator module permissions for this terminal profile. Please contact the main disputes office to restore access.
          </p>
        </div>
      );
    }

    const activeItem = filteredNavigationItems.find(item => item.name === activeTab);
    if (activeItem) {
      const ScreenComponent = activeItem.component;
      return <ScreenComponent />;
    }
    return <Overview />;
  };

  if (!activeOperatorId || !operatorData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#121212',
        color: '#FFF',
        padding: '20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: '#1A1A1A',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <ShieldAlert size={48} color="#06C167" />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>ChowEats Operator Portal</h2>
            <span style={{ fontSize: '12px', color: '#888' }}>
              {isSignUp ? "Operator Terminal Registration" : "Terminal Authentication Required"}
            </span>
          </div>

          {isSignUp ? (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Full Name</label>
                <input 
                  type="text" 
                  value={signupName} 
                  onChange={(e) => setSignupName(e.target.value)}
                  style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '10px 12px', outline: 'none' }}
                  placeholder="e.g. Alex Rivera"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Desired Username</label>
                <input 
                  type="text" 
                  value={signupUsername} 
                  onChange={(e) => setSignupUsername(e.target.value)}
                  style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '10px 12px', outline: 'none' }}
                  placeholder="Username"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Password</label>
                <input 
                  type="password" 
                  value={signupPassword} 
                  onChange={(e) => setSignupPassword(e.target.value)}
                  style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '10px 12px', outline: 'none' }}
                  placeholder="Password"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Designated Role</label>
                <select 
                  value={signupRole} 
                  onChange={(e) => setSignupRole(e.target.value)}
                  style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '10px 12px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Live Orders Manager">Live Orders Manager</option>
                  <option value="Menu Coordinator">Menu Coordinator</option>
                  <option value="Grocery Lead">Grocery Lead</option>
                  <option value="Night Dispatcher">Night Dispatcher</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="action-btn-small action-btn-primary" 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <UserPlus size={16} />
                Register Operator Terminal
              </button>

              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: '#06C167', fontSize: '13px', cursor: 'pointer', outline: 'none', marginTop: '4px' }}
                onClick={() => setIsSignUp(false)}
              >
                Already have an account? Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Operator Username</label>
                <input 
                  type="text" 
                  value={loginUsername} 
                  onChange={(e) => setLoginUsername(e.target.value)}
                  style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '10px 12px', outline: 'none' }}
                  placeholder="Username"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Password</label>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: '100%', background: '#1E1E1E', border: '1px solid #333', color: '#FFF', borderRadius: '6px', padding: '10px 12px', outline: 'none' }}
                  placeholder="Password"
                />
              </div>

              <button 
                type="submit" 
                className="action-btn-small action-btn-primary" 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <LogIn size={16} />
                Authenticate Terminal
              </button>

              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: '#06C167', fontSize: '13px', cursor: 'pointer', outline: 'none', marginTop: '4px' }}
                onClick={() => setIsSignUp(true)}
              >
                Register a new operator profile
              </button>
            </form>
          )}
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
          <span className="logo-sub">Operator Panel</span>
        </div>

        <nav className="nav-menu">
          {filteredNavigationItems.map((item) => {
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
                <span className="nav-label-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                  <span>{item.label}</span>
                  {item.name === 'Orders' && pendingCount > 0 && (
                    <span className="number-ribbon" style={{ 
                      backgroundColor: '#D32F2F', 
                      color: '#FFFFFF', 
                      fontSize: '10px', 
                      fontWeight: 'extrabold', 
                      borderRadius: '10px', 
                      padding: '2px 7px', 
                      marginLeft: '6px',
                      display: 'inline-block',
                      lineHeight: '1.2'
                    }}>
                      {pendingCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#06C167' }} />
            <span style={{ fontSize: '13px', color: '#888' }}>Live Sync Active</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="workspace">
        <header className="header">
          <h1 className="header-title">
            {filteredNavigationItems.find(item => item.name === activeTab)?.label || 'Overview'}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#ccc', fontWeight: 'bold' }}>
              👤 {operatorData?.name} ({operatorData?.role})
            </span>
            <button 
              className="action-btn-small"
              style={{ padding: '6px 12px', background: '#D32F2F', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={handleLogout}
            >
              Log Out
            </button>
            <div className="admin-badge">OPERATOR / STORE MANAGER</div>
          </div>
        </header>

        <div className="main-content">
          {renderActiveScreen()}
        </div>
      </main>
    </div>
  );
}
