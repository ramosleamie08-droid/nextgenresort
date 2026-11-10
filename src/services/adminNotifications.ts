import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export interface AdminNotification {
  id: string;
  type: 'booking' | 'cancel' | 'message' | 'refund';
  title: string;
  body: string;
  read: boolean;
  link: string;
  createdAt: any;
}

export const createAdminNotification = async (data: Omit<AdminNotification, 'id' | 'read' | 'createdAt'>) => {
  try {
    await addDoc(collection(db, 'admin_notifications'), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to create admin notification:', error);
  }
};

// IDINAGDAG ANG onError PARAMETER
export const subscribeAdminNotifications = (
  cb: (notifs: AdminNotification[]) => void,
  onError?: (error: any) => void
) => {
  const q = query(collection(db, 'admin_notifications'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminNotification)));
    },
    (error) => {
      console.error("Snapshot error sa admin_notifications:", error);
      if (onError) onError(error);
    }
  );
};

export const markAdminNotifRead = async (id: string) => {
  await updateDoc(doc(db, 'admin_notifications', id), { read: true });
};

export const markAllAdminNotifsRead = async (notifications: AdminNotification[]) => {
  for (const n of notifications) {
    if (!n.read) {
      await updateDoc(doc(db, 'admin_notifications', n.id), { read: true });
    }
  }
};