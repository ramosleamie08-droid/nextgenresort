import React, { useEffect, useState } from 'react';
import { IonPage, IonIcon, IonSpinner } from '@ionic/react';
import { menuOutline } from 'ionicons/icons';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { isAdminEmail } from '../../data/admin';
import { menuController } from '../../utils/menuController';
import './AdminMessages.css';
import './AdminPages.css';

const AdminShell: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setIsAdmin(isAdminEmail(u?.email));
        setReady(true);
      }),
    []
  );

  if (!ready) {
    return (
      <IonPage>
        <div className="am-center">
          <IonSpinner name="crescent" />
        </div>
      </IonPage>
    );
  }

  if (!isAdmin) {
    return (
      <IonPage>
        <div className="am-center">
          <h2>Admin access only</h2>
          <p>Please log in with an admin account.</p>
          <button type="button" className="am-btn" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <header className="am-top">
        <button type="button" onClick={() => menuController.open('admin')} aria-label="Menu">
          <IonIcon icon={menuOutline} />
        </button>
        <h1>{title}</h1>
      </header>
      <div className="ap-content">{children}</div>
    </IonPage>
  );
};

export default AdminShell;