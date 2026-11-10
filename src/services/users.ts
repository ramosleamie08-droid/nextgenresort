import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: any;
}

// Tinatawag sa Register page
export const saveUserProfile = (
  uid: string,
  data: { name: string; email: string; phone?: string }
) =>
  setDoc(
    doc(db, 'users', uid),
    {
      uid,
      name: data.name,
      email: data.email,
      phone: data.phone ?? '',
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

// Para sa mga account na wala pang profile (Google login, lumang account)
export const ensureUserProfile = async (user: User) => {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    uid: user.uid,
    name: user.displayName?.trim() || '',
    email: user.email ?? '',
    phone: '',
    createdAt: serverTimestamp(),
  });
};

export const subscribeUsers = (cb: (u: UserProfile[]) => void) =>
  onSnapshot(
    query(collection(db, 'users'), orderBy('createdAt', 'desc')),
    (snap) =>
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: 'estimate' }) as Omit<UserProfile, 'id'>),
        }))
      ),
    () => cb([])
  );