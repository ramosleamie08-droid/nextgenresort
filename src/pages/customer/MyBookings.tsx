import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonModal,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonLabel,
  IonTextarea,
} from '@ionic/react';
import {
  calendarOutline,
  cashOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  banOutline,
} from 'ionicons/icons';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './MyBookings.css';

interface Booking {
  id: string;
  listingName?: string;
  itemName?: string;
  date: string;
  total?: number;
  totalPrice?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'cancel-requested' | 'rejected';
  cancelReason?: string;
}

const CANCEL_REASONS = [
  'Change of plans',
  'Found a better option',
  'Schedule conflict',
  'Weather forecast is bad',
  'Booked by mistake',
  'Others',
];

const MyBookings: React.FC = () => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setBookings([]);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'bookings'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Booking[];
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBookings(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const openCancelModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedReason('');
    setOtherReason('');
    setIsModalOpen(true);
  };

  const handleRequestCancel = async () => {
    if (!selectedBooking) return;
    if (!selectedReason) return setToastMsg('Please select a reason.');
    if (selectedReason === 'Others' && !otherReason.trim()) return setToastMsg('Please type your reason.');

    setSubmitting(true);
    try {
      const finalReason = selectedReason === 'Others' ? otherReason.trim() : selectedReason;
      await updateDoc(doc(db, 'bookings', selectedBooking.id), {
        status: 'cancel-requested',
        cancelReason: finalReason,
        cancelRequestedAt: serverTimestamp(),
      });
      setToastMsg('Cancellation requested. Waiting for admin approval.');
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      setToastMsg('Failed to request cancellation.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return <span className="mb-badge badge-pending"><IonIcon icon={hourglassOutline} /> Pending</span>;
      case 'confirmed': return <span className="mb-badge badge-accepted"><IonIcon icon={checkmarkCircleOutline} /> Confirmed</span>;
      case 'cancel-requested': return <span className="mb-badge badge-cancel-req"><IonIcon icon={banOutline} /> Cancel Requested</span>;
      case 'cancelled': return <span className="mb-badge badge-cancelled"><IonIcon icon={closeCircleOutline} /> Cancelled</span>;
      case 'rejected': return <span className="mb-badge badge-cancel-req"><IonIcon icon={closeCircleOutline} /> Rejected</span>;
      default: return <span className="mb-badge badge-pending">{status}</span>;
    }
  };

  return (
    <>
      <IonContent className="mb-content" fullscreen>
        <div className="mb-wrapper">
          
          <div className="mb-top-bar">
            <h2>My Bookings</h2>
          </div>

          {loading ? (
            <div className="mb-center"><IonSpinner name="crescent" /></div>
          ) : bookings.length === 0 ? (
            <div className="mb-empty">
              <IonIcon icon={calendarOutline} />
              <h2>No bookings yet</h2>
              <p>Your booked reservations will appear here.</p>
            </div>
          ) : (
            <div className="mb-list">
              {bookings.map((b) => {
                const title = b.listingName || b.itemName || 'Resort Booking';
                const price = b.total || b.totalPrice || 0;

                return (
                  <div key={b.id} className="mb-card">
                    <div className="mb-card-head">
                      <h3>{title}</h3>
                      {getStatusBadge(b.status)}
                    </div>

                    <div className="mb-details">
                      <div className="mb-detail-row">
                        <IonIcon icon={calendarOutline} />
                        <span>{b.date || 'Date not set'}</span>
                      </div>
                      <div className="mb-detail-row">
                        <IonIcon icon={cashOutline} />
                        <span>Total: ₱{price.toLocaleString()}</span>
                      </div>
                    </div>

                    {b.cancelReason && (
                      <div className="mb-reason">
                        <strong>Reason:</strong> {b.cancelReason}
                      </div>
                    )}

                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <div className="mb-actions">
                        <button 
                          type="button" 
                          className="mb-btn-cancel"
                          onClick={() => openCancelModal(b)}
                        >
                          Request Cancellation
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </IonContent>

      {/* CANCEL MODAL */}
      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)} className="mb-modal">
        <div className="mb-modal-content">
          <div className="mb-modal-head">
            <h2>Cancel Booking</h2>
            <p>Please tell us why you want to cancel this booking.</p>
          </div>
          <IonRadioGroup value={selectedReason} onIonChange={(e) => setSelectedReason(e.detail.value)} className="mb-radio-group">
            {CANCEL_REASONS.map((reason) => (
              <IonItem key={reason} lines="none" className="mb-radio-item">
                <IonRadio slot="start" value={reason} />
                <IonLabel>{reason}</IonLabel>
              </IonItem>
            ))}
          </IonRadioGroup>

          {selectedReason === 'Others' && (
            <div className="mb-other-input">
              <IonTextarea placeholder="Please specify your reason here..." value={otherReason} onIonChange={(e) => setOtherReason(e.detail.value || '')} rows={3} autoGrow />
            </div>
          )}

          <div className="mb-modal-actions">
            <button type="button" className="mb-btn-secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Nevermind
            </button>
            <button type="button" className="mb-btn-primary" onClick={handleRequestCancel} disabled={submitting || !selectedReason}>
              {submitting ? <IonSpinner name="dots" /> : 'Submit Request'}
            </button>
          </div>
        </div>
      </IonModal>

      <IonToast
        isOpen={!!toastMsg}
        message={toastMsg}
        duration={3000}
        color={toastMsg.includes('Failed') || toastMsg.includes('select') || toastMsg.includes('type') ? 'danger' : 'success'}
        onDidDismiss={() => setToastMsg('')}
      />
    </>
  );
};

export default MyBookings;