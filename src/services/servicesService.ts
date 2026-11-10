import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface ServiceStatus {
  id: string;
  status: 'available' | 'fully-booked';
  slots: number | null; // null = No limit
}

export const subscribeServices = (cb: (data: Record<string, ServiceStatus>) => void) => {
  return onSnapshot(
    doc(db, 'settings', 'services'), 
    (snap) => {
      if (snap.exists()) {
        cb(snap.data() as Record<string, ServiceStatus>);
      } else {
        cb({});
      }
    }, 
    (err) => {
      console.error('Error fetching services:', err);
      cb({});
    }
  );
};

export const updateServiceStatus = async (
  serviceId: string, 
  status: 'available' | 'fully-booked', 
  slots: number | null
) => {
  const ref = doc(db, 'settings', 'services');
  await setDoc(ref, {
    [serviceId]: { id: serviceId, status, slots, updatedAt: serverTimestamp() }
  }, { merge: true });
};