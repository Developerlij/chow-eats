import React, { useState } from 'react';
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
                {item.label}
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
