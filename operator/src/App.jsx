import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';
import { 
  LayoutDashboard, 
  Coffee, 
  ShoppingCart, 
  ShieldAlert, 
  Apple
} from 'lucide-react';

// Import Screens
import Overview from './screens/Overview';
import MenuManager from './screens/MenuManager';
import OrdersManager from './screens/OrdersManager';
import GroceryManager from './screens/GroceryManager';

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [pendingCount, setPendingCount] = useState(0);

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

  const navigationItems = [
    { name: 'Overview', icon: LayoutDashboard, component: Overview, label: 'Live Dispatch Map' },
    { name: 'Menu', icon: Coffee, component: MenuManager, label: 'Food Manager' },
    { name: 'Grocery', icon: Apple, component: GroceryManager, label: 'Product Update' },
    { name: 'Orders', icon: ShoppingCart, component: OrdersManager, label: 'Live Orders' }
  ];

  const renderActiveScreen = () => {
    const activeItem = navigationItems.find(item => item.name === activeTab);
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
            {navigationItems.find(item => item.name === activeTab)?.label || 'Overview'}
          </h1>
          <div className="admin-badge">OPERATOR / STORE MANAGER</div>
        </header>

        <div className="main-content">
          {renderActiveScreen()}
        </div>
      </main>
    </div>
  );
}
