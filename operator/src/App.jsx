import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from './firebase';
import { 
  LayoutDashboard, 
  Coffee, 
  ShoppingCart, 
  ShieldAlert, 
  Apple,
  Lock
} from 'lucide-react';

// Import Screens
import Overview from './screens/Overview';
import MenuManager from './screens/MenuManager';
import OrdersManager from './screens/OrdersManager';
import GroceryManager from './screens/GroceryManager';

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [pendingCount, setPendingCount] = useState(0);
  
  // Dynamic Operator State
  const [allOperators, setAllOperators] = useState([]);
  const [activeOperatorId, setActiveOperatorId] = useState('op_01');
  const [operatorData, setOperatorData] = useState(null);

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
        
        // Find and set current active operator data
        const current = data[activeOperatorId];
        if (current) {
          setOperatorData(current);
        }
      } else {
        // Auto-seed default operators if node doesn't exist yet
        const seedOperators = {
          op_01: { id: 'op_01', name: 'Alex Rivera', role: 'Live Orders Manager', status: 'Active', ip: '192.168.1.104', permissions: { Overview: true, Menu: true, Grocery: false, Orders: true } },
          op_02: { id: 'op_02', name: 'Clara Oswald', role: 'Menu Coordinator', status: 'Active', ip: '192.168.1.112', permissions: { Overview: false, Menu: true, Grocery: false, Orders: false } },
          op_03: { id: 'op_03', name: 'Marcus Brody', role: 'Grocery Lead', status: 'Offline', ip: '192.168.1.95', permissions: { Overview: false, Menu: false, Grocery: true, Orders: false } },
          op_04: { id: 'op_04', name: 'Selina Kyle', role: 'Night Dispatcher', status: 'Active', ip: '192.168.1.48', permissions: { Overview: true, Menu: false, Grocery: false, Orders: true } }
        };
        set(operatorsRef, seedOperators);
      }
    });
    return () => unsubscribe();
  }, [activeOperatorId]);

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
            {/* Operator Switcher */}
            <select 
              value={activeOperatorId} 
              onChange={(e) => setActiveOperatorId(e.target.value)}
              style={{ 
                background: '#1E1E1E', 
                border: '1px solid #333', 
                color: '#FFF', 
                borderRadius: '6px', 
                padding: '6px 12px', 
                fontSize: '12.5px', 
                outline: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {allOperators.map(op => (
                <option key={op.id} value={op.id}>👤 {op.name} ({op.role})</option>
              ))}
            </select>
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
