import React from 'react';
import { IonPage, IonIcon } from '@ionic/react';
import { menuOutline } from 'ionicons/icons';
import { menuController } from '../../utils/menuController';
import './AdminMessages.css';

const AdminPlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <IonPage>
    <header className="am-top">
      <button type="button" onClick={() => menuController.open('admin')} aria-label="Menu">
        <IonIcon icon={menuOutline} />
      </button>
      <h1>{title}</h1>
    </header>

    <div className="am-center">
      <h2>{title}</h2>
      <p>This page is coming soon.</p>
    </div>
  </IonPage>
);

export default AdminPlaceholder;