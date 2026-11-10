import React from 'react';
import { IonIcon } from '@ionic/react';
import {
  gridOutline,
  calendarOutline,
  constructOutline,
  peopleOutline,
  chatbubbleOutline,
  logOutOutline,
  leafOutline,
} from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './AdminMenu.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: gridOutline },
  { label: 'Manage Bookings', path: '/admin/bookings', icon: calendarOutline },
  { label: 'Manage Services', path: '/admin/services', icon: constructOutline },
  { label: 'Guest Records', path: '/admin/guests', icon: peopleOutline },
  { label: 'Messages', path: '/admin/messages', icon: chatbubbleOutline },
];

const AdminMenu: React.FC<Props> = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const logout = async () => {
    onClose();
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
    window.location.replace('/login');
  };

  return (
    <>
      <div className={`amenu-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <aside className={`amenu ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div className="amenu-brand">
          <span className="amenu-logo">
            <IonIcon icon={leafOutline} />
          </span>
          <span className="amenu-brand-text">
            <strong>Next Gen</strong>
            <em>Pascual Resort</em>
          </span>
        </div>

        <div className="amenu-role">Admin</div>

        <nav className="amenu-list">
          {ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`amenu-item ${pathname.startsWith(item.path) ? 'active' : ''}`}
              onClick={() => go(item.path)}
            >
              <IonIcon icon={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="amenu-footer">
          <button type="button" className="amenu-item amenu-logout" onClick={logout}>
            <IonIcon icon={logOutOutline} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminMenu;