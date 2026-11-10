import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
// IDINAGDAG ITO PARA SA NOTIFICATION
import { createAdminNotification } from './adminNotifications';

export type Sender = 'customer' | 'admin' | 'bot';

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  createdAt: any;
  clientCreatedAt?: number;
}

export interface ChatSummary {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  lastMessage: string;
  lastSender: Sender;
  updatedAt: any;
  unreadForAdmin: number;
  adminActiveAt?: any;
}

// Kung nakita/nag-reply ang admin sa loob ng oras na ito, hindi sasagot ang auto-reply
export const ADMIN_ACTIVE_MS = 90_000;
// Gaano kadalas i-update ng admin na "nandito pa ako" habang bukas ang chat
export const HEARTBEAT_MS = 30_000;

export const DEFAULT_REPLY =
  'Thank you for your message! Our admin will get back to you shortly.';

// Auto-reply (rule-based)
export const botReply = (text: string): string => {
  const t = text.toLowerCase();

  if (/(cancel|kansel|i-cancel)/.test(t)) {
    return "For cancellations, please go to 'My Bookings' and select 'Request Cancellation'. Our admin will review it.";
  }
  if (/(magkano|price|rate|how much|presyo)/.test(t)) {
    return "You can see all rates on the Home page. Tap 'View Details' on a listing to see the full price. Our admin will get back to you shortly.";
  }
  if (/(gcash|maya|bank|payment|downpayment|down payment|bayad)/.test(t)) {
    return 'We accept GCash, Maya and bank transfer. You can pay a 50% downpayment or the full amount when you book.';
  }
  if (/(book|reserve|reservation|magpa-book|mag-book)/.test(t)) {
    return "To book, open a listing on the Home page, tap 'View Details', then fill out the booking form.";
  }
  if (/(oras|time|open|hours|check in|check-in|check out|checkout)/.test(t)) {
    return 'Day tour is 9am - 6pm and night tour is 6pm - 10pm. Rooms are a 24 hrs stay.';
  }
  return DEFAULT_REPLY;
};

export const timeOf = (ts: any) =>
  ts?.toDate
    ? ts.toDate().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
    : '';

/* ---------------- Customer ---------------- */
export const sendCustomerMessage = async (user: User, text: string) => {
  const clean = text.trim();
  if (!clean) return;

  const chatRef = doc(db, 'chats', user.uid);
  const messages = collection(chatRef, 'messages');

  // Pangalan: Full Name ng account; kung wala, ang unang bahagi ng email
  const name =
    user.displayName?.trim() || (user.email ? user.email.split('@')[0] : 'Customer');

  // Basahin muna ang adminActiveAt BAGO mag-send (para sa auto-reply decision)
  let shouldAutoReply = true;
  try {
    const snap = await getDoc(chatRef);
    const activeAt = snap.data()?.adminActiveAt?.toMillis?.() ?? 0;
    shouldAutoReply = Date.now() - activeAt > ADMIN_ACTIVE_MS;
  } catch (e) {
    console.warn('Could not read adminActiveAt:', e);
  }

  try {
    await setDoc(
      chatRef,
      {
        userId: user.uid,
        userName: name,
        userEmail: user.email ?? '',
        lastMessage: clean,
        lastSender: 'customer',
        updatedAt: serverTimestamp(),
        unreadForAdmin: increment(1),
      },
      { merge: true }
    );

    await addDoc(messages, {
      sender: 'customer',
      text: clean,
      createdAt: serverTimestamp(),
      clientCreatedAt: Date.now(),
    });

    // IDINAGDAG: MAG-TRIGGER NG NOTIFICATION PARA SA ADMIN
    await createAdminNotification({
      type: 'message',
      title: 'New Message',
      body: `Message from ${name}: ${clean.slice(0, 40)}${clean.length > 40 ? '...' : ''}`,
      link: '/admin/messages',
    });

    if (shouldAutoReply) {
      await new Promise((r) => setTimeout(r, 900));
      await addDoc(messages, {
        sender: 'bot',
        text: botReply(clean),
        createdAt: serverTimestamp(),
        clientCreatedAt: Date.now(),
      });
    }
  } catch (e) {
    console.error('sendCustomerMessage failed:', e);
    throw e;
  }
};

/* ---------------- Admin ---------------- */
export const markSeen = (chatId: string) =>
  updateDoc(doc(db, 'chats', chatId), {
    unreadForAdmin: 0,
    adminActiveAt: serverTimestamp(),
  });

export const sendAdminMessage = async (chatId: string, text: string) => {
  const clean = text.trim();
  if (!clean) return;

  const chatRef = doc(db, 'chats', chatId);
  try {
    await addDoc(collection(chatRef, 'messages'), {
      sender: 'admin',
      text: clean,
      createdAt: serverTimestamp(),
      clientCreatedAt: Date.now(),
    });
    await updateDoc(chatRef, {
      lastMessage: clean,
      lastSender: 'admin',
      updatedAt: serverTimestamp(),
      adminActiveAt: serverTimestamp(),
      unreadForAdmin: 0,
    });
    console.log('✅ Admin message sent to chats/' + chatId + '/messages');
  } catch (e) {
    console.error('❌ sendAdminMessage failed:', e);
    throw e;
  }
};

/* ---------------- Subscriptions ---------------- */
export const subscribeMessages = (chatId: string, cb: (m: ChatMessage[]) => void) => {
  console.log('🔔 subscribeMessages:', chatId);
  return onSnapshot(
    query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')),
    (snap) => {
      console.log(
        `📨 ${snap.docs.length} messages sa chats/${chatId}/messages`,
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: 'estimate' }) as Omit<ChatMessage, 'id'>),
        }))
      );
    },
    (err) => {
      console.error('❌ subscribeMessages error:', err);
      cb([]);
    }
  );
};

export const subscribeChats = (cb: (c: ChatSummary[]) => void) => {
  console.log('🔔 subscribeChats');
  return onSnapshot(
    query(collection(db, 'chats'), orderBy('updatedAt', 'desc')),
    (snap) => {
      console.log(`💬 ${snap.docs.length} chats`);
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: 'estimate' }) as Omit<ChatSummary, 'id'>),
        }))
      );
    },
    (err) => {
      console.error('❌ subscribeChats error:', err);
      cb([]);
    }
  );
};