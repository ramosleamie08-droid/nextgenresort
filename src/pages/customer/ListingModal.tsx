import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonModal, IonContent, IonIcon, IonSpinner, IonButton } from '@ionic/react';
import {
  closeOutline, personOutline, callOutline, calendarOutline,
  addOutline, removeOutline, star, starOutline,
  checkmarkCircleOutline, closeCircleOutline,
  printOutline, downloadOutline,
} from 'ionicons/icons';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { Listing, formatPeso } from '../../data/listings';
import { PAYMENT_METHODS, PaymentMethod, PaymentType } from '../../data/payment';
import { createAdminNotification } from '../../services/adminNotifications';
import html2pdf from 'html2pdf.js';
import './ListingModal.css';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

const Stars: React.FC<{ value: number; size?: number }> = ({ value, size = 16 }) => (
  <span className="lm-stars" style={{ fontSize: size }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <IonIcon key={n} icon={n <= Math.round(value) ? star : starOutline} />
    ))}
  </span>
);

const Counter: React.FC<{
  label: string; hint?: string; value: number; min: number; canAdd: boolean; onChange: (n: number) => void;
}> = ({ label, hint, value, min, canAdd, onChange }) => (
  <div className="lm-counter-row">
    <div>
      <strong>{label}</strong>
      {hint && <small>{hint}</small>}
    </div>
    <div className="lm-counter">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Less ${label}`}>
        <IonIcon icon={removeOutline} />
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={!canAdd} aria-label={`More ${label}`}>
        <IonIcon icon={addOutline} />
      </button>
    </div>
  </div>
);

const todayStr = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const formatDate = (ts: any) => {
  const d = ts?.toDate ? ts.toDate() : null;
  return d ? d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Just now';
};

const Details: React.FC<{ listing: Listing; onClose: () => void; isFullyBooked: boolean }> = ({ listing, onClose, isFullyBooked }) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);

  const [name, setName] = useState(auth.currentUser?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [optionId, setOptionId] = useState('');
  const [payType, setPayType] = useState<PaymentType>('down');
  const [payMethod, setPayMethod] = useState<PaymentMethod | ''>('');
  
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState('');
  const [bookDone, setBookDone] = useState(false);

  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showRefInput, setShowRefInput] = useState(false);
  const [gcashRef, setGcashRef] = useState('');
  
  const [savedBookingId, setSavedBookingId] = useState('');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // PARA SA RECEIPT MODAL
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u?.displayName) setName((prev) => prev || u.displayName || '');
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), where('listingId', '==', listing.id));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }));
      list.sort((a, b) => (b.createdAt?.seconds ?? Infinity) - (a.createdAt?.seconds ?? Infinity));
      setReviews(list);
    }, () => setReviews([]));
  }, [listing.id]);

  const average = useMemo(
    () => (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0),
    [reviews]
  );

  const showGuests = listing.category !== 'extras';
  const headcount = adults + kids;
  const canAdd = listing.maxGuests ? headcount < listing.maxGuests : true;
  const kidPrice = listing.kidPrice ?? listing.price;

  const option = listing.options?.find((o) => o.id === optionId);
  const adultsCost = listing.perPerson ? adults * listing.price : 0;
  const kidsCost = listing.perPerson ? kids * kidPrice : 0;
  const base = listing.perPerson ? 0 : listing.price;
  const total = base + adultsCost + kidsCost + (option?.price ?? 0);
  const payNow = payType === 'down' ? Math.ceil(total / 2) : total;
  const balance = total - payNow;
  const selectedPay = PAYMENT_METHODS.find((p) => p.id === payMethod);

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setBookError('');

    if (!user) return setBookError('Please log in to book.');
    if (!name.trim()) return setBookError('Please enter your full name.');
    if (!/^(09|\+639)\d{9}$/.test(phone.replace(/\s|-/g, '')))
      return setBookError('Enter a valid mobile number.');
    if (!date) return setBookError('Please choose your booking date.');
    if (showGuests && adults < 1) return setBookError('At least 1 adult is required.');
    if (listing.options && !option) return setBookError('Please choose a cottage.');
    if (!payMethod) return setBookError('Please choose a mode of payment.');

    setShowPaymentDetails(true);
  };

  const handleShowRefInput = () => {
    setShowRefInput(true);
  };

  const handleConfirmPayment = async () => {
    if (!gcashRef.trim()) {
      return setBookError(`Please enter your ${selectedPay?.label} reference number.`);
    }

    try {
      setBooking(true);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const docRef = await addDoc(collection(db, 'bookings'), {
        userId: user!.uid,
        listingId: listing.id,
        listingName: listing.name,
        name: name.trim(),
        phone: phone.replace(/\s|-/g, ''),
        date,
        adults: showGuests ? adults : null,
        kids: showGuests ? kids : null,
        cottage: option ? { id: option.id, name: option.name, price: option.price } : null,
        total,
        paymentMethod: payMethod,
        paymentType: payType,
        amountPaid: payNow,
        balance,
        referenceNo: gcashRef.trim(),
        paymentStatus: 'for-verification',
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setSavedBookingId(docRef.id);

      await createAdminNotification({
        type: 'booking',
        title: 'New Booking to Verify!',
        body: `${name.trim()} paid via ${selectedPay?.label}. Ref: ${gcashRef.trim()}`,
        link: '/admin/bookings',
      });

      setBookDone(true);
      setShowRefInput(false);
    } catch (err) {
      console.error(err);
      setBookError('Could not send your booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  // PRINT FUNCTION (Gagamitin sa loob ng Receipt Modal)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !receiptRef.current) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${savedBookingId}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 40px; max-width: 400px; margin: 0 auto; color: #333; }
            .header { text-align: center; border-bottom: 2px dashed #0b4b5e; padding-bottom: 16px; margin-bottom: 16px; }
            .header h1 { margin: 0; font-size: 1.4rem; color: #0b4b5e; }
            .header p { margin: 4px 0; font-size: 0.85rem; }
            .row { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 4px 0; }
            .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
            .footer { text-align: center; margin-top: 24px; font-size: 0.8rem; color: #666; border-top: 1px dashed #ccc; padding-top: 12px; }
          </style>
        </head>
        <body>
          ${receiptRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // DOWNLOAD PDF FUNCTION (MAY TYPE FIX)
  const handleDownload = () => {
    if (!receiptRef.current) return;
    
    const opt = {
      margin: 10,
      filename: `Receipt_${savedBookingId.slice(0, 8)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 }, // <-- FIX DITO
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const } // <-- FIX DITO
    };

    html2pdf().set(opt).from(receiptRef.current).save();
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!user) return setReviewError('Please log in to leave a review.');
    if (rating < 1) return setReviewError('Please choose a star rating.');
    if (comment.trim().length < 3) return setReviewError('Please write a short comment.');

    try {
      setPosting(true);
      await addDoc(collection(db, 'reviews'), {
        listingId: listing.id,
        userId: user.uid,
        userName: user.displayName || name.trim() || 'Guest',
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      setRating(0);
      setComment('');
    } catch {
      setReviewError('Could not post your review.');
    } finally {
      setPosting(false);
    }
  };

  // UI: PAYMENT QR AND REF INPUT
  if (showPaymentDetails && !bookDone) {
    return (
      <IonContent className="lm-content">
        <button type="button" className="lm-close" onClick={onClose} aria-label="Close">
          <IonIcon icon={closeOutline} />
        </button>

        <div className="lm-layout" style={{ display: 'block', maxWidth: '500px', margin: '0 auto' }}>
          <div className="lm-card" style={{ marginTop: '40px', textAlign: 'center' }}>
            
            {!showRefInput ? (
              <>
                <h2 style={{ color: '#0b4b5e' }}>Complete Your Payment</h2>
                <p style={{ color: '#64748b' }}>Scan the QR or send to the account below.</p>

                <div style={{ background: '#fff', display: 'inline-block', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${selectedPay?.accountNo}`} 
                    alt="Payment QR" 
                    style={{ width: '180px', height: '180px' }}
                  />
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b4b5e' }}>{selectedPay?.accountName}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e53e3e', margin: '8px 0' }}>{selectedPay?.accountNo}</div>
                <div style={{ fontSize: '1rem', color: '#64748b', marginBottom: '24px' }}>
                  Amount to pay: <b style={{ color: '#0b4b5e', fontSize: '1.2rem' }}>{formatPeso(payNow)}</b>
                </div>

                <button 
                  type="button" 
                  className="lm-submit" 
                  onClick={handleShowRefInput}
                  style={{ background: '#0b4b5e', color: '#fff', height: '56px' }}
                >
                  I have paid via {selectedPay?.label}
                </button>
              </>
            ) : (
              <>
                <h2 style={{ color: '#0b4b5e' }}>Enter {selectedPay?.label} Reference</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                  Please enter the reference number from your {selectedPay?.label} receipt.
                </p>

                <div className="lm-field" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <input 
                    type="text" 
                    placeholder="e.g. 1234 5678 9012" 
                    value={gcashRef} 
                    onChange={(e) => setGcashRef(e.target.value)}
                    style={{ fontSize: '1.2rem', textAlign: 'center', letterSpacing: '2px' }}
                  />
                </div>

                {bookError && <div className="lm-error">{bookError}</div>}

                <button 
                  type="button" 
                  className="lm-submit" 
                  onClick={handleConfirmPayment} 
                  disabled={booking}
                  style={{ background: '#0b4b5e', color: '#fff', height: '56px' }}
                >
                  {booking ? <IonSpinner name="crescent" /> : 'Submit Payment'}
                </button>

                <button 
                  type="button" 
                  onClick={() => setShowRefInput(false)} 
                  style={{ background: 'transparent', border: 'none', color: '#64748b', marginTop: '16px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Go back to QR
                </button>
              </>
            )}
          </div>
        </div>
      </IonContent>
    );
  }

  // UI: SUCCESS SCREEN
  if (bookDone) {
    return (
      <IonContent className="lm-content">
        <div className="lm-layout" style={{ display: 'block', maxWidth: '500px', margin: '0 auto', marginTop: '40px' }}>
          <div className="lm-done" style={{ textAlign: 'center' }}>
            <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '64px', color: '#2ab88a' }} />
            <h3>Booking Confirmed!</h3>
            <p>
              Your payment of <b>{formatPeso(payNow)}</b> via <b>{selectedPay?.label}</b> is now awaiting admin verification.
              <br />
              We will notify you once confirmed.
            </p>

            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', marginTop: 16, padding: '14px',
                background: '#2ab88a', color: '#fff',
                border: 'none', borderRadius: 12,
                fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              <IonIcon icon={printOutline} /> View & Print Receipt
            </button>

            <button type="button" className="lm-submit" onClick={onClose} style={{ marginTop: 12, background: '#0b4b5e' }}>
              Done
            </button>
          </div>
        </div>

        {/* RECEIPT MODAL */}
        <IonModal isOpen={showReceipt} onDidDismiss={() => setShowReceipt(false)}>
          <div style={{ padding: '20px', background: '#f4f7f8', height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, color: '#0b4b5e' }}>Receipt Preview</h2>
              <IonButton fill="clear" onClick={() => setShowReceipt(false)}>
                <IonIcon icon={closeOutline} slot="icon-only" />
              </IonButton>
            </div>

            {/* RECEIPT CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
              <div 
                ref={receiptRef}
                style={{
                  background: '#fff', padding: '40px', maxWidth: '400px', width: '100%',
                  fontFamily: "'Courier New', monospace", color: '#333',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', height: 'fit-content'
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '2px dashed #0b4b5e', paddingBottom: '16px', marginBottom: '16px' }}>
                  <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0b4b5e' }}>NextGen Pascual Resort</h1>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>Victoria, Oriental Mindoro</p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>Booking Receipt</p>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Receipt No:</span><strong>{savedBookingId.slice(0, 8).toUpperCase()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Date Issued:</span><strong>{new Date().toLocaleString('en-PH')}</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }}></div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Customer:</span><strong>{name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Contact:</span><strong>{phone}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Booking Date:</span><strong>{date}</strong>
                  </div>
                  {showGuests && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                      <span>Guests:</span><strong>{adults} Adults, {kids} Kids</strong>
                    </div>
                  )}
                  {option && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                      <span>Cottage:</span><strong>{option.name}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Service:</span><strong>{listing.name}</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }}></div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Total Amount:</span><strong>₱{total.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Paid Now:</span><strong>₱{payNow.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Balance:</span><strong>₱{balance.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Payment Mode:</span><strong>{payMethod.toUpperCase()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0' }}>
                    <span>Reference No:</span><strong>{gcashRef}</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #ccc', margin: '12px 0' }}></div>

                <div style={{ background: '#fff4d6', color: '#b45309', padding: '8px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', margin: '12px 0' }}>
                  PAYMENT FOR VERIFICATION
                </div>

                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.8rem', color: '#666', borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
                  <p style={{ margin: '4px 0' }}>Thank you for booking with us!</p>
                  <p style={{ margin: '4px 0' }}>Please present this receipt upon arrival.</p>
                  <p style={{ margin: '4px 0' }}>support@nextgenresort.com</p>
                </div>
              </div>
            </div>

            {/* BUTTONS PARA SA PRINT AT DOWNLOAD */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingBottom: '20px' }}>
              <button
                onClick={handlePrint}
                style={{
                  flex: 1, padding: '16px', background: '#0b4b5e', color: '#fff',
                  border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <IonIcon icon={printOutline} /> Print
              </button>
              <button
                onClick={handleDownload}
                style={{
                  flex: 1, padding: '16px', background: '#2ab88a', color: '#fff',
                  border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <IonIcon icon={downloadOutline} /> Download PDF
              </button>
            </div>
          </div>
        </IonModal>
      </IonContent>
    );
  }

  // UI: DEFAULT BOOKING FORM
  return (
    <IonContent className="lm-content">
      <button type="button" className="lm-close" onClick={onClose} aria-label="Close">
        <IonIcon icon={closeOutline} />
      </button>

      <div className="lm-layout">
        <div className="lm-left">
          <img src={listing.image} alt={listing.name} className="lm-image" />
          <span className="lm-cat">{listing.label}</span>
          <h2 className="lm-title">{listing.name}</h2>

          <div className="lm-rating-line">
            <Stars value={average} />
            <span>{reviews.length ? `${average.toFixed(1)} (${reviews.length})` : 'No reviews yet'}</span>
            <strong className="lm-price">{listing.priceText}</strong>
          </div>

          <p className="lm-desc">{listing.description}</p>

          <div className="lm-tags">
            {listing.tags.map((t) => (
              <span key={t}><IonIcon icon={checkmarkCircleOutline} /> {t}</span>
            ))}
          </div>

          {isFullyBooked ? (
            <div className="lm-fully-booked-alert">
              <IonIcon icon={closeCircleOutline} />
              <h3>Fully Booked</h3>
              <p>Sorry, this service is currently fully booked.</p>
            </div>
          ) : (
            <form className="lm-card" onSubmit={handleProceedToPayment} noValidate>
              <h3 className="lm-card-title">Book this</h3>

              <label className="lm-label">Full Name</label>
              <div className="lm-field">
                <IonIcon icon={personOutline} />
                <input type="text" placeholder="e.g. Juan Dela Cruz" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <label className="lm-label">Contact Number</label>
              <div className="lm-field">
                <IonIcon icon={callOutline} />
                <input type="tel" placeholder="e.g. 09123456789" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <label className="lm-label">Date of Booking</label>
              <div className="lm-field">
                <IonIcon icon={calendarOutline} />
                <input type="date" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              {showGuests && (
                <>
                  <label className="lm-label">Guests{listing.maxGuests ? ` (max ${listing.maxGuests})` : ''}</label>
                  <div className="lm-counters">
                    <Counter label="Adults" hint={listing.perPerson ? `${formatPeso(listing.price)} each` : undefined} value={adults} min={1} canAdd={canAdd} onChange={setAdults} />
                    <Counter label="Kids" hint={listing.perPerson ? `${formatPeso(kidPrice)} each` : undefined} value={kids} min={0} canAdd={canAdd} onChange={setKids} />
                  </div>
                </>
              )}

              {listing.options && (
                <>
                  <label className="lm-label">Select Cottage (Required)</label>
                  <div className="lm-field">
                    <select value={optionId} onChange={(e) => setOptionId(e.target.value)}>
                      <option value="">Choose a cottage...</option>
                      {listing.options.map((o) => (
                        <option key={o.id} value={o.id}>{o.name} ({formatPeso(o.price)})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <label className="lm-label">Payment Option</label>
              <div className="lm-pay-types">
                <button type="button" className={`lm-pay-card ${payType === 'down' ? 'active' : ''}`} onClick={() => setPayType('down')}>
                  <span>Downpayment (50%)</span>
                  <strong>{formatPeso(Math.ceil(total / 2))}</strong>
                </button>
                <button type="button" className={`lm-pay-card ${payType === 'full' ? 'active' : ''}`} onClick={() => setPayType('full')}>
                  <span>Full Payment</span>
                  <strong>{formatPeso(total)}</strong>
                </button>
              </div>

              <label className="lm-label">Mode of Payment (Required)</label>
              <div className="lm-methods">
                {PAYMENT_METHODS.map((p) => (
                  <button key={p.id} type="button" className={`lm-method ${payMethod === p.id ? 'active' : ''}`} onClick={() => setPayMethod(p.id)}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="lm-breakdown">
                {listing.perPerson && (
                  <>
                    <div><span>Adults ({adults} x {formatPeso(listing.price)})</span><span>{formatPeso(adultsCost)}</span></div>
                    <div><span>Kids ({kids} x {formatPeso(kidPrice)})</span><span>{formatPeso(kidsCost)}</span></div>
                  </>
                )}
                {!listing.perPerson && (
                  <div><span>{listing.name}</span><span>{formatPeso(base)}</span></div>
                )}
                {option && (
                  <div><span>{option.name}</span><span>{formatPeso(option.price)}</span></div>
                )}
                <div className="lm-breakdown-total"><span>Total</span><strong>{formatPeso(total)}</strong></div>
                <div className="lm-breakdown-now"><span>Pay now ({payType === 'down' ? '50%' : 'full'})</span><strong>{formatPeso(payNow)}</strong></div>
                {balance > 0 && (
                  <div><span>Balance (pay at the resort)</span><span>{formatPeso(balance)}</span></div>
                )}
              </div>

              {bookError && <div className="lm-error">{bookError}</div>}

              <button type="submit" className="lm-submit">
                Proceed to Payment · {formatPeso(payNow)}
              </button>
            </form>
          )}
        </div>

        <div className="lm-right">
          <h3 className="lm-section">Customer Reviews</h3>
          <div className="lm-summary">
            <div className="lm-avg">{reviews.length ? average.toFixed(1) : '–'}</div>
            <div>
              <Stars value={average} size={20} />
              <div className="lm-count">{reviews.length} review{reviews.length === 1 ? '' : 's'}</div>
            </div>
          </div>

          <form className="lm-card" onSubmit={handleReview} noValidate>
            <h3 className="lm-card-title">Leave a review</h3>
            <div className="lm-rate-input">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                  <IonIcon icon={n <= rating ? star : starOutline} />
                </button>
              ))}
            </div>
            <textarea className="lm-textarea" rows={3} placeholder={user ? 'Share your experience...' : 'Log in to leave a review'} value={comment} onChange={(e) => setComment(e.target.value)} disabled={!user} />
            {reviewError && <div className="lm-error">{reviewError}</div>}
            <button type="submit" className="lm-submit lm-submit-outline" disabled={posting || !user}>
              {posting ? <IonSpinner name="crescent" /> : 'Post Review'}
            </button>
          </form>

          <div className="lm-reviews">
            {reviews.length === 0 ? (
              <p className="lm-empty">Be the first to review this.</p>
            ) : (
              reviews.map((r) => (
                <div className="lm-review" key={r.id}>
                  <div className="lm-avatar">{r.userName?.charAt(0).toUpperCase() || 'G'}</div>
                  <div className="lm-review-body">
                    <div className="lm-review-top">
                      <strong>{r.userName}</strong>
                      <span>{formatDate(r.createdAt)}</span>
                    </div>
                    <Stars value={r.rating} size={13} />
                    <p>{r.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </IonContent>
  );
};

interface Props {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  isFullyBooked?: boolean;
}

const ListingModal: React.FC<Props> = ({ listing, isOpen, onClose, isFullyBooked = false }) => (
  <IonModal isOpen={isOpen} onDidDismiss={onClose} className="lm-modal">
    {listing && <Details key={listing.id} listing={listing} onClose={onClose} isFullyBooked={isFullyBooked} />}
  </IonModal>
);

export default ListingModal;