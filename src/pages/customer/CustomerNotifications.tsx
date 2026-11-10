import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/react';
import {
  arrowBackOutline,
  checkmarkDoneOutline,
  notificationsOutline,
  trashOutline,
  checkmarkCircleOutline, // Idinagdag
  closeCircleOutline, // Idinagdag
  chatbubbleEllipsesOutline, // Idinagdag
} from 'ionicons/icons';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import {
  AppNotification,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from '../../services/notifications';
import './CustomerNotifications.css';

// Helper para sa icons
const getIcon = (type: string) => {
  if (type.includes('accepted')) return checkmarkCircleOutline;
  if (type.includes('rejected') || type.includes('cancelled')) return closeCircleOutline;
  if (type.includes('message')) return chatbubbleEllipsesOutline;
  return notificationsOutline;
};

const CustomerNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Naka-subscribe ito sa tamang path: notifications/{uid}/items
    const unsub = subscribeNotifications(user.uid, (data) => {
      setItems(data);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const unreadCount = items.filter((i) => !i.read).length;

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    await deleteNotification(user.uid, id);
  };

  const handleClick = async (n: AppNotification) => {
    if (!user) return;
    if (!n.read) await markNotificationRead(user.uid, n.id);
    
    // Kung may booking ID, dalhin sa bookings page
    if (n.bookingId) {
      navigate('/customer/bookings');
    }
  };

  return (
    <IonPage>
      <header className="cn-header">
        <button type="button" onClick={() => navigate('/customer/home')} aria-label="Back">
          <IonIcon icon={arrowBackOutline} />
        </button>
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button type="button" className="cn-markall" onClick={handleMarkAll}>
            <IonIcon icon={checkmarkDoneOutline} />
          </button>
        )}
      </header>

      <IonContent className="cn-content">
        {loading ? (
          <div className="cn-empty">
            <IonSpinner name="crescent" />
          </div>
        ) : items.length === 0 ? (
          <div className="cn-empty">
            <IonIcon icon={notificationsOutline} className="cn-empty-icon" />
            <p>No notifications yet.</p>
            <span>We'll let you know when something happens.</span>
          </div>
        ) : (
          <div className="cn-list">
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`cn-item ${n.read ? 'read' : 'unread'}`}
                onClick={() => handleClick(n)}
              >
                <div className="cn-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                  <IonIcon icon={getIcon(n.type)} />
                </div>
                <div className="cn-body">
                  <div className="cn-title">
                    {n.title}
                    {!n.read && <span className="cn-dot" />}
                  </div>
                  <div className="cn-text">{n.body}</div>
                  <div className="cn-time">
                    {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : 'Just now'}
                  </div>
                </div>
                <button type="button" className="cn-delete" onClick={(e) => handleDelete(e, n.id)}>
                  <IonIcon icon={trashOutline} />
                </button>
              </button>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CustomerNotifications;