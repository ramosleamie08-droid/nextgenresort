import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import {
  homeOutline, constructOutline, chatbubbleEllipsesOutline,
  notificationsOutline, menuOutline, logOutOutline
} from 'ionicons/icons';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../../firebase';
import { isAdminEmail } from '../../data/admin';
import { subscribeAdminNotifications, AdminNotification } from '../../services/adminNotifications';

import AdminMenu from '../../components/AdminMenu';
import AdminDashboard from './AdminDashboard';
import AdminBookings from './AdminBookings';
import AdminServices from './AdminServices';
import AdminGuests from './AdminGuests';
import AdminMessages from './AdminMessages';
import AdminNotifications from './AdminNotifications';
import './AdminPages.css';
import './AdminMessages.css';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const isMessages = path.includes('/messages');

  const isHome =
    path.includes('/dashboard') || path.includes('/bookings') || path.includes('/guests');

  const [authReady, setAuthReady] = useState(false);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [notifs, setNotifs] = useState<AdminNotification[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const allowed = !!adminUser && isAdminEmail(adminUser.email);

  // Guard: kailangang naka-login at admin
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setAdminUser(u);
        setAuthReady(true);
        if (!u || !isAdminEmail(u.email)) navigate('/login', { replace: true });
      }),
    [navigate]
  );

  useEffect(() => {
    if (!allowed) return undefined;
    const unsub = subscribeAdminNotifications((data) => {
      setNotifs(data);
    });
    return unsub;
  }, [allowed]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // PALITAN ITO: /login na lang para gumana sa Vercel
      window.location.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // GUARD: dapat nasa ibaba ng lahat ng hooks
  if (!authReady || !allowed) return null;

  const desktopLinks = [
    { label: 'Home', to: '/admin/dashboard', active: path.includes('/dashboard') },
    { label: 'Bookings', to: '/admin/bookings', active: path.includes('/bookings') },
    { label: 'Services', to: '/admin/services', active: path.includes('/services') },
    { label: 'Guests', to: '/admin/guests', active: path.includes('/guests') },
    { label: 'Chat', to: '/admin/messages', active: path.includes('/messages') },
  ];

  return (
    <IonPage>
      <AdminMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className={`admin-top-header ${isMessages ? 'hide-on-mobile' : ''}`}>
        <div className="admin-header-inner">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-menu-btn hide-on-desktop"
              onClick={() => setMenuOpen(true)}
            >
              <IonIcon icon={menuOutline} />
            </button>
            <h1 className="admin-header-title">NextGen Pascual Resort</h1>
          </div>

          <nav className="admin-top-nav">
            {desktopLinks.map((l) => (
              <button
                key={l.to}
                type="button"
                className={l.active ? 'active' : ''}
                onClick={() => navigate(l.to)}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="admin-header-right">
            <button
              type="button"
              className="admin-bell-btn"
              onClick={() => navigate('/admin/notifications')}
              aria-label="Notifications"
            >
              <IonIcon icon={notificationsOutline} />
              {unreadCount > 0 && <span className="admin-dot" />}
            </button>

            <button
              type="button"
              className="admin-logout-btn hide-on-mobile"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <IonIcon icon={logOutOutline} />
            </button>
          </div>
        </div>
      </header>

      <IonContent id="main" className={`admin-page-content ${isMessages ? 'is-messages' : ''}`}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="guests" element={<AdminGuests />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Routes>
      </IonContent>

      {!isMessages && !path.includes('/notifications') && (
        <nav className="admin-bottom-tabs">
          <button
            type="button"
            className={isHome ? 'active' : ''}
            onClick={() => navigate('/admin/dashboard')}
          >
            <IonIcon icon={homeOutline} />
            <span>Home</span>
          </button>
          <button
            type="button"
            className={path.includes('/services') ? 'active' : ''}
            onClick={() => navigate('/admin/services')}
          >
            <IonIcon icon={constructOutline} />
            <span>Services</span>
          </button>
          <button type="button" onClick={() => navigate('/admin/messages')}>
            <IonIcon icon={chatbubbleEllipsesOutline} />
            <span>Chat</span>
          </button>
        </nav>
      )}
    </IonPage>
  );
};

export default AdminLayout;