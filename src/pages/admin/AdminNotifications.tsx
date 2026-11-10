import React, { useEffect, useState } from 'react';
import { IonContent, IonIcon, IonSpinner } from '@ionic/react';
import { 
  calendarOutline, closeCircleOutline, chatbubbleEllipsesOutline, 
  walletOutline, checkmarkDoneOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { 
  AdminNotification, 
  subscribeAdminNotifications, 
  markAdminNotifRead,
  markAllAdminNotifsRead
} from '../../services/adminNotifications';
import './AdminPages.css';

const AdminNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeAdminNotifications(
      (data) => {
        setNotifs(data);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        setErrorMsg('Could not load notifications. Check Firestore Rules.');
      }
    );
    return unsub;
  }, []);

  const handleClick = async (n: AdminNotification) => {
    if (!n.read) await markAdminNotifRead(n.id);
    navigate(n.link);
  };

  const getIcon = (type: string) => {
    if (type === 'booking') return calendarOutline;
    if (type === 'cancel') return closeCircleOutline;
    if (type === 'message') return chatbubbleEllipsesOutline;
    return walletOutline;
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <IonContent className="admin-page-content">
      <div className="ap-wrap" style={{ paddingTop: 16 }}>
        
        {/* HEADER PARA SA NOTIFICATIONS PAGE (WALANG BACK BUTTON) */}
        <div className="ap-notif-header">
          <h2 style={{ margin: 0, color: '#0b4b5e', fontSize: '1.4rem', fontWeight: 800 }}>
            Notifications
          </h2>

          {unreadCount > 0 && (
            <button 
              onClick={() => markAllAdminNotifsRead(notifs)}
              className="ap-mark-all-btn"
            >
              <IonIcon icon={checkmarkDoneOutline} /> Mark all read
            </button>
          )}
        </div>

        {/* LISTAHAN */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : errorMsg ? (
          <div className="ap-empty" style={{ color: 'red' }}>{errorMsg}</div>
        ) : notifs.length === 0 ? (
          <div className="ap-empty">No notifications yet.</div>
        ) : (
          <div>
            {notifs.map(n => (
              <div 
                key={n.id} 
                className={`ap-notif-card ${n.read ? 'read' : 'unread'}`}
                onClick={() => handleClick(n)}
              >
                <div className="ap-notif-icon">
                  <IonIcon icon={getIcon(n.type)} />
                </div>
                <div className="ap-notif-body">
                  <div className="ap-notif-title">
                    {n.title} 
                    {!n.read && <span className="ap-dot" />}
                  </div>
                  <div className="ap-notif-text">{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </IonContent>
  );
};

export default AdminNotifications;