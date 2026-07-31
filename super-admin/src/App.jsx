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
  ChevronRight,
  Key,
  Briefcase,
  Terminal,
  Package,
  Bell
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
import OperatorManager from './screens/OperatorManager';
import ERPConsole from './screens/ERPConsole';
import InventoryManager from './screens/InventoryManager';

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [pendingCount, setPendingCount] = useState(0);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [tCode, setTCode] = useState('');
  const [erpSubTab, setErpSubTab] = useState('fico');
  const [alerts, setAlerts] = useState([]);
  const [isAlertsDropdownOpen, setIsAlertsDropdownOpen] = useState(false);

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

    // Real-time low stock warnings subscription
    const alertsRef = ref(database, 'systemAlerts');
    const unsubscribeAlerts = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAlerts(Object.values(data));
      } else {
        setAlerts([]);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeAlerts();
    };
  }, []);

  const navigationItems = [
    { name: 'Overview', icon: LayoutDashboard, component: Overview, label: 'Dashboard' },
    { name: 'ERP', icon: Briefcase, component: ERPConsole, label: 'ERP Command Console' },
    { name: 'Analytics', icon: Cpu, component: SuperAnalytics, label: 'Executive Panel' },
    { name: 'Finance', icon: DollarSign, component: FinanceManager, label: 'Financials' },
    { name: 'Audit', icon: ShieldCheck, component: AuditManager, label: 'Audit Desk' },
    { name: 'Restaurants', icon: Store, component: Restaurants, label: 'Restaurants' },
    { name: 'Menu', icon: Coffee, component: MenuManager, label: 'Menu Manager' },
    { name: 'Orders', icon: ShoppingCart, component: OrdersManager, label: 'Live Orders' },
    { name: 'Drivers', icon: Bike, component: Drivers, label: 'Manage Drivers' },
    { name: 'Users', icon: UsersIcon, component: Users, label: 'Customers' },
    { name: 'Operators', icon: Key, component: OperatorManager, label: 'Operator Manager' },
    { name: 'Inventory', icon: Package, component: InventoryManager, label: 'Inventory Manager' },
    { name: 'Grocery', icon: Apple, component: GroceryManager, label: 'Grocery Manager' },
    { name: 'Promotions', icon: Ticket, component: PromotionsManager, label: 'Promotions' },
    { name: 'Disputes', icon: ShieldAlert, component: DisputesManager, label: 'Disputes Desk' },
    { name: 'Broadcast', icon: Send, component: BroadcastHub, label: 'Broadcast Hub' },
    { name: 'Health', icon: Activity, component: SystemHealth, label: 'System Health' }
  ];

  const handleTCodeSubmit = (e) => {
    e.preventDefault();
    if (!tCode.trim()) return;
    const command = tCode.trim().toUpperCase();
    
    // 1. Check ERP sub-modules
    if (command === '/FICO' || command === 'FB50') {
      setErpSubTab('fico');
      setActiveTab('ERP');
      alert("SAP T-Code Resolved: FB50 General Ledger (FICO Financials)");
    } else if (command === '/MM' || command === 'MM03') {
      setErpSubTab('mm');
      setActiveTab('ERP');
      alert("SAP T-Code Resolved: MM03 Materials Management (MM Inventory)");
    } else if (command === '/SD' || command === 'VA01') {
      setErpSubTab('sd');
      setActiveTab('ERP');
      alert("SAP T-Code Resolved: VA01 Sales & Distribution (SD SLA Dispatch)");
    } else if (command === '/HCM' || command === 'PA30') {
      setErpSubTab('hcm');
      setActiveTab('ERP');
      alert("SAP T-Code Resolved: PA30 HR Shift Roster (HCM Human Capital)");
    } else if (command === '/GRC' || command === 'SU01') {
      setErpSubTab('grc');
      setActiveTab('ERP');
      alert("SAP T-Code Resolved: SU01 Security & Governance (GRC Desk)");
    } 
    // 2. Check main navigation items
    else {
      const matchedItem = navigationItems.find(item => 
        `/${item.name.toUpperCase()}` === command || 
        item.label.toUpperCase() === command ||
        (command === 'OV01' && item.name === 'Overview') ||
        (command === 'FI01' && item.name === 'Finance') ||
        (command === 'AU01' && item.name === 'Audit') ||
        (command === 'RE01' && item.name === 'Restaurants') ||
        (command === 'ME01' && item.name === 'Menu') ||
        (command === 'OR01' && item.name === 'Orders') ||
        (command === 'DR01' && item.name === 'Drivers') ||
        (command === 'US01' && item.name === 'Users') ||
        (command === 'OP01' && item.name === 'Operators') ||
        (command === 'IV01' && item.name === 'Inventory') ||
        (command === 'GR01' && item.name === 'Grocery') ||
        (command === 'PR01' && item.name === 'Promotions') ||
        (command === 'DI01' && item.name === 'Disputes') ||
        (command === 'BR01' && item.name === 'Broadcast') ||
        (command === 'HE01' && item.name === 'Health') ||
        (command === 'AN01' && item.name === 'Analytics')
      );

      if (matchedItem) {
        setActiveTab(matchedItem.name);
        alert(`SAP T-Code Resolved: Switched to ${matchedItem.label}`);
      } else {
        alert(`Unknown SAP T-Code: "${command}". Try '/FICO', '/MM', '/SD', '/Orders', '/Finance', etc.`);
      }
    }
    setTCode('');
  };

  const renderActiveScreen = () => {
    const activeItem = navigationItems.find(item => item.name === activeTab);
    if (activeItem) {
      const ScreenComponent = activeItem.component;
      if (activeItem.name === 'ERP') {
        return <ScreenComponent subTab={erpSubTab} setSubTab={setErpSubTab} />;
      }
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

          {/* Global SAP Command Center Bar */}
          <form onSubmit={handleTCodeSubmit} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '400px', marginLeft: '20px', marginRight: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#121212', border: '1px solid #333', borderRadius: '4px', padding: '2px 8px', flex: 1 }}>
              <Terminal size={14} color="#06C167" />
              <input 
                type="text" 
                value={tCode}
                onChange={(e) => setTCode(e.target.value)}
                placeholder="T-Code (e.g. /FICO, /Orders, /Finance)"
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#06C167', fontSize: '12px', fontFamily: 'monospace', outline: 'none', padding: '4px 0' }}
              />
            </div>
            <button 
              type="submit" 
              className="action-btn-small action-btn-primary" 
              style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}
            >
              EXECUTE
            </button>
          </form>

          {/* Glowing Alerts Bell System */}
          <div style={{ position: 'relative', marginRight: '15px' }}>
            <button
              onClick={() => setIsAlertsDropdownOpen(!isAlertsDropdownOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: alerts.length > 0 ? '#D32F2F' : '#888',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                borderRadius: '50%',
                backgroundColor: alerts.length > 0 ? 'rgba(211, 47, 47, 0.1)' : 'transparent',
                boxShadow: alerts.length > 0 ? '0 0 10px rgba(211, 47, 47, 0.3)' : 'none'
              }}
              title="System Alerts"
            >
              <Bell size={20} />
              {alerts.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '0px',
                  right: '0px',
                  backgroundColor: '#D32F2F',
                  color: '#FFF',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '15px',
                  height: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Dropdown Card */}
            {isAlertsDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '40px',
                right: '0px',
                width: '320px',
                backgroundColor: '#1E1E1E',
                border: '1px solid #333',
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                zIndex: 999,
                padding: '12px',
                maxHeight: '380px',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#FFF' }}>⚠️ Low Stock Warnings ({alerts.length})</span>
                  <button 
                    onClick={() => setIsAlertsDropdownOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Close
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#121212', borderLeft: '3px solid #D32F2F', padding: '8px', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#FF9800', fontWeight: 'bold', fontSize: '11.5px' }}>{alert.title}</span>
                          <span style={{ color: '#666', fontSize: '9px' }}>{alert.timestamp?.split(', ')[1]}</span>
                        </div>
                        <p style={{ color: '#DDD', fontSize: '11px', margin: 0 }}>{alert.message}</p>
                        <button
                          onClick={() => { setActiveTab('Inventory'); setIsAlertsDropdownOpen(false); }}
                          style={{ alignSelf: 'flex-end', background: 'transparent', border: 'none', color: '#06C167', fontSize: '10.5px', fontWeight: 'bold', cursor: 'pointer', padding: '2px 0 0 0' }}
                        >
                          Resolve in Inventory &rarr;
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#888', padding: '16px 0', fontSize: '12px' }}>
                      No inventory alerts. All items healthy!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="admin-badge" style={{ backgroundColor: '#9C27B0', color: '#FFF' }}>SUPER ADMINISTRATOR</div>
        </header>

        <div className="main-content">
          {renderActiveScreen()}
        </div>
      </main>
    </div>
  );
}
