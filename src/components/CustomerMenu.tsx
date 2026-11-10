import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  homeOutline,
  mapOutline,
  calendarOutline,
  chatbubbleOutline,
  notificationsOutline,
  personOutline,
  logOutOutline,
  leafOutline,
} from 'ionicons/icons';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { subscribeNotifications } from '../services/notifications';
import './CustomerMenu.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerMenu: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return undefined;
    }
    return subscribeNotifications(user.uid, (items) => {
      setUnreadCount(items.filter((i) => !i.read).length);
    });
  }, [user]);

  const handleLogout = async () => {
    onClose();
    try {
      await signOut(auth);
      window.location.replace('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const goTo = (path: string) => {
    navigate(path);
    onClose();
  };

  const items = [
    { label: 'Home', path: '/customer/home', icon: homeOutline },
    { label: 'Map', path: '/customer/map', icon: mapOutline },
    { label: 'My Bookings', path: '/customer/bookings', icon: calendarOutline },
    { label: 'Chat', path: '/customer/chat', icon: chatbubbleOutline },
    { label: 'Notifications', path: '/customer/notifications', icon: notificationsOutline, badge: unreadCount },
    { label: 'Profile', path: '/customer/profile', icon: personOutline },
  ];

  const initial = (user?.displayName || user?.email || 'G').charAt(0).toUpperCase();

  return (
    <>
      <div className={`cmenu-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <aside className={`cmenu ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div className="cmenu-brand">
          <span className="cmenu-logo">
            <IonIcon icon={leafOutline} />
          </span>
          <span className="cmenu-brand-text">
            <strong>Next Gen</strong>
            <em>Pascual Resort</em>
          </span>
        </div>

        {user && (
          <div className="cmenu-user">
            <span className="cmenu-avatar">{initial}</span>
            <span className="cmenu-user-text">
              <strong>{user.displayName || 'Guest'}</strong>
              <em>{user.email}</em>
            </span>
          </div>
        )}

        <nav className="cmenu-list">
          {items.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`cmenu-item ${pathname.startsWith(item.path) ? 'active' : ''}`}
              onClick={() => goTo(item.path)}
            >
              <IonIcon icon={item.icon} />
              <span>{item.label}</span>
              {!!item.badge && item.badge > 0 && <span className="cmenu-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="cmenu-footer">
          <button type="button" className="cmenu-item cmenu-logout" onClick={handleLogout}>
            <IonIcon icon={logOutOutline} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default CustomerMenu;