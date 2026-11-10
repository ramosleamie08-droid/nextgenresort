import React from 'react';
import { IonContent, IonPage, IonButton } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <IonPage>
      <IonContent fullscreen className="landing-content">
        <div className="landing-wrapper">
          <h1 className="landing-title">NextGen Pascual Resort</h1>
          <p className="landing-tagline">Relax. Unwind. Experience paradise.</p>

          <IonButton
            expand="block"
            className="landing-btn"
            onClick={() => navigate('/login')}
          >
            Get Started
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;