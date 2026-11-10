import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonIcon, IonContent } from '@ionic/react';
import {
  homeOutline, calendarOutline, personOutline, mapOutline,
  menuOutline, locationOutline, notificationsOutline
} from 'ionicons/icons';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../firebase';
import { ensureUserProfile } from '../../services/users';
import { subscribeNotifications } from '../../services/notifications';

import CustomerMenu from '../../components/CustomerMenu';
import CustomerHome from './CustomerHome';
import CustomerChat from './CustomerChat';
import CustomerMap from './CustomerMap';
import MyBookings from './MyBookings';
import CustomerProfile from './CustomerProfile';
import CustomerNotifications from './CustomerNotifications';
import './CustomerLayout.css';

const tabBarStyle: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  height: 'calc(52px + min(env(safe-area-inset-bottom, 0px), 12px))',
  paddingBottom: 'min(env(safe-area-inset-bottom, 0px), 12px)',
  background: '#0b4b5e',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.15)',
  zIndex: 9999,
};

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  height: 52,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  padding: 0,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
  fontFamily: 'inherit',
});

const tabIconStyle: React.CSSProperties = { fontSize: 22, display: 'block' };
const tabLabelStyle: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, lineHeight: 1.1 };

const CustomerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  const currentPath = location.pathname;
  const isChat = currentPath.includes('/chat');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) ensureUserProfile(u).catch(() => undefined);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return undefined; }
    return subscribeNotifications(user.uid, (items) => {
      setUnreadCount(items.filter((i) => !i.read).length);
    });
  }, [user]);

  // Desktop o mobile
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Itago ang tabs habang nagta-type (bukas ang keyboard)
  useEffect(() => {
    const isField = (el: Element | null) =>
      !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');

    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target as Element)) setTyping(true);
    };

    const onFocusOut = () => {
      setTimeout(() => {
        if (!isField(document.activeElement)) setTyping(false);
      }, 100);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const NAV = [
    { label: 'Home', onClick: () => navigate('/customer/home') },
    { label: 'About', onClick: () => { navigate('/customer/home'); setTimeout(() => document.getElementById('ch-hero')?.scrollIntoView({ behavior: 'smooth' }), 100); } },
    { label: 'Day Tours', onClick: () => navigate('/customer/home?cat=day') },
    { label: 'Night Tours', onClick: () => navigate('/customer/home?cat=night') },
    { label: 'Rooms', onClick: () => navigate('/customer/home?cat=rooms') },
    { label: 'Functions', onClick: () => navigate('/customer/home?cat=halls') },
    { label: 'Extras', onClick: () => navigate('/customer/home?cat=extras') },
    { label: 'Location', onClick: () => navigate('/customer/map') },
    { label: 'Bookings', onClick: () => navigate('/customer/bookings') },
    { label: 'Profile', onClick: () => navigate('/customer/profile') },
  ];

  const showTabs = !isChat && !isDesktop && !typing;

  const tabs = [
    { label: 'Home', icon: homeOutline, to: '/customer/home', active: currentPath.includes('/home') },
    { label: 'Map', icon: mapOutline, to: '/customer/map', active: currentPath.includes('/map') },
    { label: 'Bookings', icon: calendarOutline, to: '/customer/bookings', active: currentPath.includes('/bookings') },
    { label: 'Profile', icon: personOutline, to: '/customer/profile', active: currentPath.includes('/profile') },
  ];

  return (
    <IonPage>
      <CustomerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <IonHeader className="ch-header">
        <IonToolbar className="ch-toolbar">
          <div className="ch-header-inner">
            <div className="ch-left">
              <button type="button" className="ch-icon-btn" onClick={() => setMenuOpen(true)}>
                <IonIcon icon={menuOutline} />
              </button>
              <div className="ch-location">
                <IonIcon icon={locationOutline} />
                <div>
                  <span className="ch-location-label">Location</span>
                  <strong>Victoria, Oriental Mindoro</strong>
                </div>
              </div>
            </div>

            <nav className="ch-nav">
              {NAV.map((n) => (
                <button key={n.label} type="button" onClick={n.onClick}>
                  {n.label}
                </button>
              ))}
            </nav>

            <div className="ch-actions">
              <button type="button" className="ch-icon-btn ch-bell" onClick={() => navigate('/customer/notifications')}>
                <IonIcon icon={notificationsOutline} />
                {unreadCount > 0 && <span className="ch-dot" />}
              </button>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className={isChat ? 'no-tabs' : 'with-tabs'}>
        <Routes>
          <Route path="home" element={<CustomerHome />} />
          <Route path="map" element={<CustomerMap />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="chat" element={<CustomerChat />} />
          <Route path="notifications" element={<CustomerNotifications />} />
          <Route index element={<Navigate to="home" replace />} />
        </Routes>
      </IonContent>

      {/* Bottom tabs: walang tabs sa Chat, sa desktop, at habang nagta-type */}
      {showTabs && (
        <div className="customer-tab-bar" style={tabBarStyle}>
          {tabs.map((t) => (
            <button
              key={t.to}
              type="button"
              className={t.active ? 'active' : ''}
              style={tabButtonStyle(t.active)}
              onClick={() => navigate(t.to)}
            >
              <IonIcon icon={t.icon} style={tabIconStyle} />
              <span style={tabLabelStyle}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </IonPage>
  );
};

export default CustomerLayout;