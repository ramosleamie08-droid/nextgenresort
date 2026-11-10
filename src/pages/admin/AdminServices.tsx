import React, { useEffect, useState } from 'react';
import { IonIcon, IonToast } from '@ionic/react';
import { addOutline, removeOutline } from 'ionicons/icons';
import { LISTINGS } from '../../data/listings';
import { subscribeServices, updateServiceStatus, ServiceStatus } from '../../services/servicesService';
import './AdminPages.css';

const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Record<string, ServiceStatus>>({});
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  useEffect(() => {
    const unsub = subscribeServices(setServices);
    return unsub;
  }, []);

  const handleUpdate = async (id: string, newStatus: 'available' | 'fully-booked', newSlots: number | null) => {
    try {
      await updateServiceStatus(id, newStatus, newSlots);
      setToastMsg('Saved successfully!');
      setToastColor('success');
    } catch (e) {
      console.error(e);
      setToastMsg('Could not save. Please check your Firestore Rules.');
      setToastColor('danger');
    }
  };

  return (
    <div className="ap-wrap">
      <div className="ap-grid">
        {LISTINGS.map((l) => {
          const s = services[l.id] || { id: l.id, status: 'available', slots: null };
          const isFull = s.status === 'fully-booked';
          const slots = s.slots;

          return (
            <article className="ap-card" key={l.id}>
              <div className="ap-service-head">
                <img src={l.image} alt={l.name} className="ap-thumb" />
                <div>
                  <h3 className="ap-title">{l.name}</h3>
                  <span className="ap-sub">{l.label}</span>
                  <div>
                    <span className={`ap-pill ${isFull ? 'rejected' : 'confirmed'}`}>
                      {isFull ? 'Fully Booked' : 'Available'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ap-label">Status</div>
              <div className="ap-seg">
                <button
                  type="button"
                  className={!isFull ? 'active' : ''}
                  onClick={() => handleUpdate(l.id, 'available', slots)}
                >
                  Available
                </button>
                <button
                  type="button"
                  className={isFull ? 'active danger' : ''}
                  onClick={() => handleUpdate(l.id, 'fully-booked', slots)}
                >
                  Fully Booked
                </button>
              </div>

              <div className="ap-label">Slots left</div>
              <div className="ap-stepper">
                <button
                  type="button"
                  onClick={() => handleUpdate(l.id, s.status, slots === null ? 0 : Math.max(0, slots - 1))}
                  disabled={slots === null || slots === 0}
                  aria-label="Less"
                >
                  <IonIcon icon={removeOutline} />
                </button>
                <span>{slots === null ? 'No limit' : slots}</span>
                <button
                  type="button"
                  onClick={() => handleUpdate(l.id, s.status, slots === null ? 1 : slots + 1)}
                  aria-label="More"
                >
                  <IonIcon icon={addOutline} />
                </button>
                {slots !== null && (
                  <button 
                    type="button" 
                    className="ap-link" 
                    onClick={() => handleUpdate(l.id, s.status, null)}
                  >
                    No limit
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <IonToast
        isOpen={!!toastMsg}
        message={toastMsg}
        duration={2000}
        color={toastColor}
        onDidDismiss={() => setToastMsg('')}
      />
    </div>
  );
};

export default AdminServices;