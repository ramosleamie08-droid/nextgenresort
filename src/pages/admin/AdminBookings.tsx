import React, { useEffect, useMemo, useState } from 'react';
import { IonToast } from '@ionic/react';
import {
  Booking,
  acceptBooking,
  approveCancellation,
  declineCancellation,
  markRefunded,
  rejectBooking,
  subscribeBookings,
} from '../../services/bookings';
import { formatPeso } from '../../data/listings';
import RejectBookingModal from './RejectBookingModal'; // <-- IDINAGDAG
import './AdminPages.css';

type Filter = 'all' | 'pending' | 'cancel' | 'confirmed' | 'refunds';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancel', label: 'Cancel Requests' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'refunds', label: 'Refunds' },
];

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  'cancel-requested': 'Cancel Requested',
  cancelled: 'Cancelled',
};

const PAY_LABEL: Record<string, string> = { gcash: 'GCash', maya: 'Maya', bank: 'Bank' };

const PAY_STATUS: Record<string, string> = {
  'for-verification': 'For verification',
  verified: 'Verified',
  rejected: 'Rejected',
};

const matches = (b: Booking, f: Filter) => {
  if (f === 'pending') return b.status === 'pending';
  if (f === 'cancel') return b.status === 'cancel-requested';
  if (f === 'confirmed') return b.status === 'confirmed';
  if (f === 'refunds') return b.refundStatus === 'to-refund';
  return true;
};

const prettyDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const stamp = (ts: any) =>
  ts?.toDate
    ? ts.toDate().toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');

  // IDINAGDAG: States para sa Reject Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState<Booking | null>(null);

  useEffect(() => subscribeBookings(setBookings), []);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, pending: 0, cancel: 0, confirmed: 0, refunds: 0 };
    bookings.forEach((b) => {
      (Object.keys(c) as Filter[]).forEach((k) => {
        if (matches(b, k)) c[k] += 1;
      });
    });
    return c;
  }, [bookings]);

  const shown = bookings.filter((b) => matches(b, filter));

  const run = async (id: string, fn: () => Promise<any>, confirmMsg?: string, successMsgText?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError('');
    setBusy(id);
    try {
      await fn();
      if (successMsgText) {
        setSuccessMsg(successMsgText);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Action failed. Please try again.');
    } finally {
      setBusy('');
    }
  };

  // IDINAGDAG: Function para i-process ang rejection galing sa Modal
  const handleRejectConfirm = async (reason: string) => {
    if (!bookingToReject) return;
    
    setIsRejectModalOpen(false);
    
    await run(
      bookingToReject.id,
      () => rejectBooking(bookingToReject, reason), // Pansinin: may 'reason' na ipinapasa
      undefined, 
      'Booking rejected and customer notified.'
    );
    
    setBookingToReject(null);
  };

  return (
    <div className="ap-wrap" style={{ padding: '16px' }}>
      <div className="ap-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`ap-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {counts[f.key] > 0 && <span className="ap-count">{counts[f.key]}</span>}
          </button>
        ))}
      </div>

      {error && <div className="ap-error">{error}</div>}

      {shown.length === 0 ? (
        <p className="ap-empty">No bookings here.</p>
      ) : (
        <div className="ap-grid">
          {shown.map((b) => (
            <article className="ap-card" key={b.id}>
              <div className="ap-card-head">
                <div>
                  <h3 className="ap-title">{b.listingName}</h3>
                  <span className="ap-sub">Booked {stamp(b.createdAt)}</span>
                </div>
                <span className={`ap-pill ${b.status}`}>{STATUS_LABEL[b.status] ?? b.status}</span>
              </div>

              <div className="ap-rows">
                <div>
                  <span>Customer</span>
                  <strong>{b.name}</strong>
                </div>
                <div>
                  <span>Contact</span>
                  <strong>{b.phone}</strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>{prettyDate(b.date)}</strong>
                </div>
                {b.adults !== null && (
                  <div>
                    <span>Guests</span>
                    <strong>
                      {b.adults} adult{b.adults === 1 ? '' : 's'}, {b.kids ?? 0} kid
                      {(b.kids ?? 0) === 1 ? '' : 's'}
                    </strong>
                  </div>
                )}
                {b.cottage && (
                  <div>
                    <span>Cottage</span>
                    <strong>{b.cottage.name}</strong>
                  </div>
                )}
                <div>
                  <span>Total</span>
                  <strong>{formatPeso(b.total)}</strong>
                </div>
              </div>

              <div className="ap-box">
                <div className="ap-box-title">Payment</div>
                <div className="ap-rows">
                  <div>
                    <span>Mode</span>
                    <strong>{PAY_LABEL[b.paymentMethod] ?? b.paymentMethod}</strong>
                  </div>
                  <div>
                    <span>Option</span>
                    <strong>{b.paymentType === 'down' ? 'Downpayment (50%)' : 'Full payment'}</strong>
                  </div>
                  <div>
                    <span>Paid</span>
                    <strong>{formatPeso(b.amountPaid)}</strong>
                  </div>
                  {b.balance > 0 && (
                    <div>
                      <span>Balance</span>
                      <strong>{formatPeso(b.balance)}</strong>
                    </div>
                  )}
                  <div>
                    <span>Reference No.</span>
                    <strong>{b.referenceNo}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{PAY_STATUS[b.paymentStatus] ?? b.paymentStatus}</strong>
                  </div>
                </div>
              </div>

              {b.refundStatus === 'to-refund' && (
                <div className="ap-box ap-refund">
                  <div className="ap-box-title">Refund needed</div>
                  <p>
                    Return <b>{formatPeso(b.refundAmount ?? b.amountPaid)}</b> to <b>{b.name}</b> via{' '}
                    <b>{PAY_LABEL[b.paymentMethod]}</b> ({b.phone}).
                  </p>
                  <button
                    type="button"
                    className="ap-btn ap-btn-primary"
                    disabled={busy === b.id}
                    onClick={() =>
                      run(
                        b.id, 
                        () => markRefunded(b.id), 
                        'Mark this payment as refunded?',
                        'Payment marked as refunded.'
                      )
                    }
                  >
                    Mark as Refunded
                  </button>
                </div>
              )}

              {b.refundStatus === 'refunded' && (
                <div className="ap-box ap-refunded">
                  Refunded {formatPeso(b.refundAmount ?? b.amountPaid)} {stamp(b.refundedAt)}
                </div>
              )}

              {b.status === 'pending' && (
                <div className="ap-actions">
                  <button
                    type="button"
                    className="ap-btn ap-btn-primary"
                    disabled={busy === b.id}
                    onClick={() =>
                      run(
                        b.id, 
                        () => acceptBooking(b), 
                        undefined, 
                        'Booking accepted!'
                      )
                    }
                  >
                    Accept
                  </button>
                  
                  {/* BINAGO: onClick para buksan ang Modal imbes na window.confirm */}
                  <button
                    type="button"
                    className="ap-btn ap-btn-danger"
                    disabled={busy === b.id}
                    onClick={() => {
                      setBookingToReject(b);
                      setIsRejectModalOpen(true);
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}

              {b.status === 'cancel-requested' && (
                <div className="ap-actions">
                  <button
                    type="button"
                    className="ap-btn ap-btn-danger"
                    disabled={busy === b.id}
                    onClick={() =>
                      run(
                        b.id,
                        () => approveCancellation(b),
                        'Approve the cancellation? The payment will need to be refunded.',
                        'Cancellation approved.'
                      )
                    }
                  >
                    Approve Cancellation
                  </button>
                  <button
                    type="button"
                    className="ap-btn ap-btn-ghost"
                    disabled={busy === b.id}
                    onClick={() =>
                      run(
                        b.id, 
                        () => declineCancellation(b.id),
                        undefined,
                        'Cancellation declined.'
                      )
                    }
                  >
                    Decline Request
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* IDINAGDAG: Reject Modal Component */}
      <RejectBookingModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setBookingToReject(null);
        }}
        onConfirm={handleRejectConfirm}
        bookingDetails={bookingToReject ? `${bookingToReject.listingName} - ${bookingToReject.name}` : ''}
      />

      <IonToast
        isOpen={!!successMsg}
        message={successMsg}
        duration={2000}
        color="success"
        onDidDismiss={() => setSuccessMsg('')}
      />
      <IonToast
        isOpen={!!error}
        message={error}
        duration={3000}
        color="danger"
        onDidDismiss={() => setError('')}
      />
    </div>
  );
};

export default AdminBookings;