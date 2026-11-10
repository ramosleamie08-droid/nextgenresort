import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonIcon, IonContent, IonLabel
} from '@ionic/react';
import {
  homeOutline, calendarOutline, personOutline,
  menuOutline, locationOutline, notificationsOutline
} from 'ionicons/icons';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../../firebase';
import { ensureUserProfile } from '../../services/users';
import { subscribeNotifications } from '../../services/notifications';

import CustomerMenu from '../../components/CustomerMenu';
import CustomerHome from './CustomerHome';
import CustomerChat from './CustomerChat';
import MyBookings from './MyBookings';
import CustomerProfile from './CustomerProfile';
import CustomerNotifications from './CustomerNotifications';
import './CustomerLayout.css';

const CustomerLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        document.body.classList.add('keyboard-is-open');
      }
    };

    const onFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        const stillTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        if (!stillTyping) document.body.classList.remove('keyboard-is-open');
      }, 100);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.body.classList.remove('keyboard-is-open');
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // IDINAGDAG ANG /nextgenresort/ PARA SA GITHUB PAGES
      window.location.replace('/nextgenresort/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const NAV = [
    { label: 'Home', onClick: () => navigate('/customer/home') },
    { label: 'About', onClick: () => { navigate('/customer/home'); setTimeout(() => document.getElementById('ch-hero')?.scrollIntoView({ behavior: 'smooth' }), 100); } },
    { label: 'Day Tours', onClick: () => navigate('/customer/home?cat=day') },
    { label: 'Night Tours', onClick: () => navigate('/customer/home?cat=night') },
    { label: 'Rooms', onClick: () => navigate('/customer/home?cat=rooms') },
    { label: 'Functions', onClick: () => navigate('/customer/home?cat=halls') },
    { label: 'Extras', onClick: () => navigate('/customer/home?cat=extras') },
    { label: 'Bookings', onClick: () => navigate('/customer/bookings') },
    { label: 'Profile', onClick: () => navigate('/customer/profile') },
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
          <Route path="bookings" element={<MyBookings />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="chat" element={<CustomerChat />} />
          <Route path="notifications" element={<CustomerNotifications />} />
          <Route index element={<Navigate to="home" replace />} />
        </Routes>
      </IonContent>

      {!isChat && (
        <div className="customer-tab-bar">
          <button
            type="button"
            className={currentPath.includes('/home') ? 'active' : ''}
            onClick={() => navigate('/customer/home')}
          >
            <IonIcon icon={homeOutline} />
            <IonLabel>Home</IonLabel>
          </button>
          <button
            type="button"
            className={currentPath.includes('/bookings') ? 'active' : ''}
            onClick={() => navigate('/customer/bookings')}
          >
            <IonIcon icon={calendarOutline} />
            <IonLabel>Bookings</IonLabel>
          </button>
          <button
            type="button"
            className={currentPath.includes('/profile') ? 'active' : ''}
            onClick={() => navigate('/customer/profile')}
          >
            <IonIcon icon={personOutline} />
            <IonLabel>Profile</IonLabel>
          </button>
        </div>
      )}
    </IonPage>
  );
};

export default CustomerLayout;