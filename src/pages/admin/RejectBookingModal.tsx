import React, { useState } from 'react';
import { IonModal, IonContent, IonButton, IonIcon } from '@ionic/react';
import { closeOutline, alertCircleOutline } from 'ionicons/icons';

interface RejectBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  bookingDetails: string;
}

const REJECT_REASONS = [
  { id: 'fully-booked', label: 'Fully booked / No available rooms' },
  { id: 'invalid-payment', label: 'Invalid payment / Reference not found' },
  { id: 'incomplete', label: 'Incomplete guest details' },
  { id: 'double', label: 'Double booking detected' },
];

const RejectBookingModal: React.FC<RejectBookingModalProps> = ({ isOpen, onClose, onConfirm, bookingDetails }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    let finalReason = selectedReason;
    
    // Kung may tinype sa custom reason, idagdag natin sa final reason
    if (customReason.trim() !== '') {
      if (selectedReason) {
        // Hanapin yung label ng napiling reason
        const selectedLabel = REJECT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
        finalReason = `${selectedLabel}: ${customReason.trim()}`;
      } else {
        finalReason = customReason.trim();
      }
    }

    if (!finalReason) {
      alert('Please select a reason or type a message.');
      return;
    }

    onConfirm(finalReason);
    
    // Reset
    setSelectedReason('');
    setCustomReason('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="reject-modal">
      <IonContent className="ion-padding" style={{ '--background': '#f8f9fa' } as any}>
        <div style={{ padding: '10px', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0, color: '#333', fontSize: '22px', fontWeight: 700 }}>Reject Booking</h2>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
              <IonIcon icon={closeOutline} style={{ fontSize: '28px', color: '#666' }} />
            </button>
          </div>

          {/* Warning Box */}
          <div style={{ 
            backgroundColor: '#fff3cd', 
            borderLeft: '4px solid #ffc107', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <IonIcon icon={alertCircleOutline} style={{ color: '#856404', fontSize: '20px', marginTop: '2px' }} />
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404', fontWeight: 600 }}>
                Rejecting: {bookingDetails}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#856404' }}>
                The customer will be notified and a refund will be required.
              </p>
            </div>
          </div>

          {/* Reasons List */}
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: '#333' }}>Select a reason:</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
            {REJECT_REASONS.map((reason) => (
              <button
                key={reason.id}
                type="button"
                onClick={() => setSelectedReason(reason.id)}
                style={{
                  padding: '12px 15px',
                  borderRadius: '8px',
                  border: selectedReason === reason.id ? '2px solid #d9534f' : '1px solid #ddd',
                  backgroundColor: selectedReason === reason.id ? '#fdf2f2' : '#ffffff',
                  color: selectedReason === reason.id ? '#d9534f' : '#333',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: selectedReason === reason.id ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {reason.label}
              </button>
            ))}
          </div>

          {/* TEXT BOX - Laging Nakikita */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
              Additional Message (Optional):
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Type a message to the customer here..."
              rows={3}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', 
                border: '1px solid #ddd', fontSize: '14px', resize: 'none',
                backgroundColor: '#fff'
              }}
            />
          </div>

          {/* Spacer */}
          <div style={{ flexGrow: 1 }}></div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <IonButton 
              expand="block" 
              fill="outline" 
              color="medium" 
              onClick={handleClose} 
              style={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </IonButton>
            <IonButton 
              expand="block" 
              color="danger" 
              onClick={handleConfirm} 
              style={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
            >
              Confirm Reject
            </IonButton>
          </div>
          
        </div>
      </IonContent>
    </IonModal>
  );
};

export default RejectBookingModal;