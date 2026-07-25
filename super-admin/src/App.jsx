import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';
import { 
  LayoutDashboard, 
  Store, 
  Coffee, 
  ShoppingCart, 
  ShieldAlert, 
  Bike, 
  Users as UsersIcon, 
  Apple,
  Ticket,
  Send,
  Activity,
  DollarSign,
  ShieldCheck,
  Cpu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Import Screens
import Overview from './screens/Overview';
import Restaurants from './screens/Restaurants';
import MenuManager from './screens/MenuManager';
import OrdersManager from './screens/OrdersManager';
import Drivers from './screens/Drivers';
import Users from './screens/Users';
import GroceryManager from './screens/GroceryManager';
import PromotionsManager from './screens/PromotionsManager';
import DisputesManager from './screens/DisputesManager';
import BroadcastHub from './screens/BroadcastHub';
import SystemHealth from './screens/SystemHealth';
import FinanceManager from './screens/FinanceManager';
import AuditManager from './screens/AuditManager';
import SuperAnalytics from './screens/SuperAnalytics';

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [pendingCount, setPendingCount] = useState(0);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

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
    { name: 'Overview', icon: LayoutDashboard, component: Overview, label: 'Dashboard' },
    { name: 'Analytics', icon: Cpu, component: SuperAnalytics, label: 'Executive Panel' },
    { name: 'Finance', icon: DollarSign, component: FinanceManager, label: 'Financials' },
    { name: 'Audit', icon: ShieldCheck, component: AuditManager, label: 'Audit Desk' },
    { name: 'Restaurants', icon: Store, component: Restaurants, label: 'Restaurants' },
    { name: 'Menu', icon: Coffee, component: MenuManager, label: 'Menu Manager' },
    { name: 'Orders', icon: ShoppingCart, component: OrdersManager, label: 'Live Orders' },
    { name: 'Drivers', icon: Bike, component: Drivers, label: 'Manage Drivers' },
    { name: 'Users', icon: UsersIcon, component: Users, label: 'Customers' },
    { name: 'Grocery', icon: Apple, component: GroceryManager, label: 'Grocery Manager' },
    { name: 'Promotions', icon: Ticket, component: PromotionsManager, label: 'Promotions' },
    { name: 'Disputes', icon: ShieldAlert, component: DisputesManager, label: 'Disputes Desk' },
    { name: 'Broadcast', icon: Send, component: BroadcastHub, label: 'Broadcast Hub' },
    { name: 'Health', icon: Activity, component: SystemHealth, label: 'System Health' }
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
      <aside className={`sidebar ${isSidebarMinimized ? 'minimized' : ''}`}>
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <ShieldAlert size={28} color="#06C167" style={{ flexShrink: 0 }} />
          {!isSidebarMinimized && (
            <>
              <h2 className="logo-title">ChowEats</h2>
              <span className="logo-sub" style={{ color: '#06C167', fontWeight: 'bold' }}>Super Admin</span>
            </>
          )}
          <button 
            onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: isSidebarMinimized ? '0px' : 'auto',
              marginTop: isSidebarMinimized ? '10px' : '0px',
              transition: 'all 0.2s ease',
            }}
            title={isSidebarMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
          >
            {isSidebarMinimized ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
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
                title={isSidebarMinimized ? item.label : ""}
              >
                <span className="nav-icon" style={{ position: 'relative' }}>
                  <IconComponent size={20} />
                  {isSidebarMinimized && item.name === 'Orders' && pendingCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#D32F2F',
                      border: '1.5px solid var(--bg-dark-sidebar)'
                    }} />
                  )}
                </span>
                {!isSidebarMinimized && (
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
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarMinimized ? 'center' : 'flex-start', gap: '8px', padding: '8px 0' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#06C167', flexShrink: 0 }} />
            {!isSidebarMinimized && <span style={{ fontSize: '13px', color: '#888' }}>Live Sync Active</span>}
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="workspace">
        <header className="header">
          <h1 className="header-title">
            {navigationItems.find(item => item.name === activeTab)?.label || 'Overview'}
          </h1>
          <div className="admin-badge" style={{ backgroundColor: '#9C27B0', color: '#FFF' }}>SUPER ADMINISTRATOR</div>
        </header>

        <div className="main-content">
          {renderActiveScreen()}
        </div>
      </main>
    </div>
  );
}
