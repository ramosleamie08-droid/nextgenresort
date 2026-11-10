import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type ServiceStatus = 'available' | 'fully-booked';

export interface ServiceState {
  id: string;
  status: ServiceStatus;
  slots: number | null; // null = walang limit
}

export const DEFAULT_SERVICE = (id: string): ServiceState => ({
  id,
  status: 'available',
  slots: null,
});

export const subscribeServices = (
  cb: (m: Record<string, ServiceState>) => void,
  onError?: (code: string) => void
) =>
  onSnapshot(
    collection(db, 'services'),
    (snap) => {
      const map: Record<string, ServiceState> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as Partial<ServiceState>;
        map[d.id] = {
          id: d.id,
          status: data.status ?? 'available',
          slots: data.slots ?? null,
        };
      });
      cb(map);
    },
    (err) => {
      cb({});
      onError?.(err.code);
    }
  );

export const saveService = (id: string, patch: Partial<Omit<ServiceState, 'id'>>) =>
  setDoc(doc(db, 'services', id), { ...patch, updatedAt: serverTimestamp() }, { merge: true });