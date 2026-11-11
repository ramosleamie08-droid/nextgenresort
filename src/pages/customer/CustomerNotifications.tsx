import React, { useEffect, useMemo, useState } from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/react';
import {
  arrowBackOutline,
  checkmarkDoneOutline,
  notificationsOutline,
  trashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  chatbubbleEllipsesOutline,
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

type Kind = 'accepted' | 'rejected' | 'cancelled' | 'message' | 'general';

const getKind = (type: string): Kind => {
  if (type.includes('accepted')) return 'accepted';
  if (type.includes('rejected')) return 'rejected';
  if (type.includes('cancelled')) return 'cancelled';
  if (type.includes('message')) return 'message';
  return 'general';
};

const getIcon = (kind: Kind) => {
  if (kind === 'accepted') return checkmarkCircleOutline;
  if (kind === 'rejected' || kind === 'cancelled') return closeCircleOutline;
  if (kind === 'message') return chatbubbleEllipsesOutline;
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
    const unsub = subscribeNotifications(user.uid, (data) => {
      setItems(data);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);

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
    if (n.bookingId) {
      navigate('/customer/bookings');
    }
  };

  const formatDate = (n: AppNotification) => {
    const d = n.createdAt?.toDate ? n.createdAt.toDate() : null;
    if (!d) return { date: 'Just now', time: '' };
    return {
      date: d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  return (
    <IonPage>
      <header className="cn-header">
        <button type="button" onClick={() => navigate('/customer/home')} aria-label="Back">
          <IonIcon icon={arrowBackOutline} />
        </button>
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button type="button" className="cn-markall" onClick={handleMarkAll} aria-label="Mark all as read">
            <IonIcon icon={checkmarkDoneOutline} />
          </button>
        )}
      </header>

      <IonContent className="cn-content">
        <div className="cn-wrap">
          <div className="cn-pagehead">
            <div>
              <h2>Notifications</h2>
              <span className="cn-count">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </span>
            </div>
            {unreadCount > 0 && (
              <button type="button" className="cn-markall-btn" onClick={handleMarkAll}>
                <IonIcon icon={checkmarkDoneOutline} /> Mark all as read
              </button>
            )}
          </div>

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
              {items.map((n) => {
                const kind = getKind(n.type);
                const { date, time } = formatDate(n);
                return (
                  <div
                    key={n.id}
                    className={`cn-item kind-${kind} ${n.read ? 'read' : 'unread'}`}
                    onClick={() => handleClick(n)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="cn-icon">
                      <IonIcon icon={getIcon(kind)} />
                    </div>
                    <div className="cn-body">
                      <div className="cn-title">
                        {n.title}
                        {!n.read && <span className="cn-dot" />}
                      </div>
                      <div className="cn-text">{n.body}</div>
                      <div className="cn-time">
                        {date} {time && `· ${time}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cn-delete"
                      onClick={(e) => handleDelete(e, n.id)}
                      aria-label="Delete notification"
                    >
                      <IonIcon icon={trashOutline} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CustomerNotifications;