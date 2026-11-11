import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  notifyBookingAccepted, 
  notifyBookingRejected, 
  notifyBookingCancelled 
} from './notifications';
import { createAdminNotification } from './adminNotifications';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancel-requested'
  | 'cancelled';

export type RefundStatus = 'to-refund' | 'refunded';

export interface Booking {
  id: string;
  userId: string;
  listingId: string;
  listingName: string;
  name: string;
  phone: string;
  date: string;
  adults: number | null;
  kids: number | null;
  cottage: { id: string; name: string; price: number } | null;
  total: number;
  paymentMethod: 'gcash' | 'maya' | 'bank';
  paymentType: 'down' | 'full';
  amountPaid: number;
  balance: number;
  referenceNo: string;
  paymentStatus: 'for-verification' | 'verified' | 'rejected';
  status: BookingStatus;
  refundStatus?: RefundStatus;
  refundAmount?: number;
  refundedAt?: any;
  createdAt: any;
  rejectReason?: string; // IDINAGDAG: Para maisave ang dahilan ng reject
}

const ref = (id: string) => doc(db, 'bookings', id);

export const subscribeBookings = (cb: (b: Booking[]) => void) =>
  onSnapshot(
    query(collection(db, 'bookings'), orderBy('createdAt', 'desc')),
    (snap) =>
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: 'estimate' }) as Omit<Booking, 'id'>),
        }))
      ),
    () => cb([])
  );

// Tanggapin ang booking at i-verify ang payment
export const acceptBooking = async (b: Booking) => {
  await updateDoc(ref(b.id), {
    status: 'confirmed',
    paymentStatus: 'verified',
    updatedAt: serverTimestamp(),
  });
  await notifyBookingAccepted(b.userId, b.id, b.listingName);
};

// I-reject ang booking: ibabalik ang bayad
// BINAGO: May 'reason' parameter na
export const rejectBooking = async (b: Booking, reason: string = '') => {
  await updateDoc(ref(b.id), {
    status: 'rejected',
    paymentStatus: 'rejected',
    refundStatus: 'to-refund',
    refundAmount: b.amountPaid,
    rejectReason: reason, // IDINAGDAG: Isi-save ang dahilan
    updatedAt: serverTimestamp(),
  });
  await notifyBookingRejected(b.userId, b.id, b.listingName, reason);
};

// Aprubahan ang cancellation request ng customer
export const approveCancellation = async (b: Booking) => {
  await updateDoc(ref(b.id), {
    status: 'cancelled',
    refundStatus: 'to-refund',
    refundAmount: b.amountPaid,
    updatedAt: serverTimestamp(),
  });
  await notifyBookingCancelled(b.userId, b.id, b.listingName);
};

// Hindi aprubahan ang cancellation: tuloy pa rin ang booking
export const declineCancellation = async (id: string) => {
  await updateDoc(ref(id), {
    status: 'confirmed',
    updatedAt: serverTimestamp(),
  });
};

// Naibalik na ang pera
export const markRefunded = async (id: string) => {
  await updateDoc(ref(id), {
    refundStatus: 'refunded',
    refundedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// IDINAGDAG: FUNCTION PARA SA CUSTOMER CANCEL REQUEST
// Tatawagin ito kapag ang customer ay nag-request ng cancel
export const requestCancelBooking = async (booking: Booking, reason: string) => {
  // 1. I-update ang booking status
  await updateDoc(ref(booking.id), {
    status: 'cancel-requested',
    cancelReason: reason,
    cancelRequestedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2. Ipadala ang Notification sa ADMIN
  await createAdminNotification({
    type: 'cancel',
    title: 'Cancellation Request',
    body: `${booking.name} wants to cancel their booking for ${booking.listingName}.`,
    link: '/admin/bookings',
  });
};