import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  getDocs,
  limit,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export type NotifType =
  | 'message'
  | 'booking-accepted'
  | 'booking-rejected'
  | 'booking-cancelled'
  | 'general';

export interface AppNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  createdAt: any;
  bookingId?: string;
  chatId?: string;
}

// 1. CREATE
export const createNotification = async (
  userId: string,
  data: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
) => {
  if (!userId) return;
  try {
    await addDoc(collection(db, 'notifications', userId, 'items'), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('createNotification failed:', e);
  }
};

// 2. SUBSCRIBE (Para lumabas sa listahan ng customer)
export const subscribeNotifications = (
  userId: string,
  cb: (n: AppNotification[]) => void
) => {
  if (!userId) {
    cb([]);
    return () => {};
  }
  return onSnapshot(
    query(
      collection(db, 'notifications', userId, 'items'),
      orderBy('createdAt', 'desc'),
      limit(50)
    ),
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: 'estimate' }) as Omit<AppNotification, 'id'>),
        }))
      );
    },
    (err) => {
      console.error('subscribeNotifications error:', err);
      cb([]);
    }
  );
};

// 3. MARK AS READ
export const markNotificationRead = async (userId: string, notifId: string) => {
  if (!userId || !notifId) return;
  try {
    await updateDoc(doc(db, 'notifications', userId, 'items', notifId), {
      read: true,
    });
  } catch (e) {
    console.error('markNotificationRead failed:', e);
  }
};

// 4. MARK ALL AS READ
export const markAllNotificationsRead = async (userId: string) => {
  if (!userId) return;
  try {
    const snap = await getDocs(collection(db, 'notifications', userId, 'items'));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      if (!d.data().read) batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (e) {
    console.error('markAllNotificationsRead failed:', e);
  }
};

// 5. DELETE
export const deleteNotification = async (userId: string, notifId: string) => {
  if (!userId || !notifId) return;
  try {
    await deleteDoc(doc(db, 'notifications', userId, 'items', notifId));
  } catch (e) {
    console.error('deleteNotification failed:', e);
  }
};

// ==========================================
// 6. HELPER FUNCTIONS PARA SA ADMIN
// ==========================================

export const notifyBookingAccepted = async (userId: string, bookingId: string, itemName: string) => {
  if (!userId) return;
  await createNotification(userId, {
    type: 'booking-accepted',
    title: 'Booking Accepted ✅',
    body: `Your booking for ${itemName} has been accepted. See you soon!`,
    bookingId,
  });
};

export const notifyBookingRejected = async (userId: string, bookingId: string, itemName: string, reason?: string) => {
  if (!userId) return;
  await createNotification(userId, {
    type: 'booking-rejected',
    title: 'Booking Rejected ❌',
    body: reason 
      ? `Your booking for ${itemName} was rejected. Reason: ${reason}` 
      : `Your booking for ${itemName} was rejected.`,
    bookingId,
  });
};

export const notifyBookingCancelled = async (userId: string, bookingId: string, itemName: string) => {
  if (!userId) return;
  await createNotification(userId, {
    type: 'booking-cancelled',
    title: 'Booking Cancelled 🚫',
    body: `Your booking for ${itemName} has been cancelled.`,
    bookingId,
  });
};