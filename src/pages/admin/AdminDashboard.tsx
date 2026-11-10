import React, { useEffect, useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  timeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  walletOutline,
  cashOutline,
  peopleOutline,
  chatbubbleOutline,
  constructOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { LISTINGS, formatPeso } from '../../data/listings';
import { isAdminEmail } from '../../data/admin';
import { Booking, subscribeBookings } from '../../services/bookings';
import { UserProfile, subscribeUsers } from '../../services/users';
import { ChatSummary, subscribeChats } from '../../services/chat';
import { ServiceState, subscribeServices } from '../../services/services';
import './AdminPages.css';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  'cancel-requested': 'Cancel Requested',
  cancelled: 'Cancelled',
};

const todayStr = () => {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const prettyDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// No AdminShell and no IonPage here: AdminLayout already provides the page.
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [services, setServices] = useState<Record<string, ServiceState>>({});

  useEffect(() => {
    const offs = [
      subscribeBookings(setBookings),
      subscribeUsers(setUsers),
      subscribeChats(setChats),
      subscribeServices(setServices),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  const stats = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const toRefund = bookings.filter((b) => b.refundStatus === 'to-refund');

    return {
      pending: bookings.filter((b) => b.status === 'pending').length,
      confirmed: confirmed.length,
      cancelRequests: bookings.filter((b) => b.status === 'cancel-requested').length,
      refundCount: toRefund.length,
      refundAmount: toRefund.reduce((s, b) => s + (b.refundAmount ?? b.amountPaid), 0),
      collected: confirmed
        .filter((b) => b.paymentStatus === 'verified')
        .reduce((s, b) => s + b.amountPaid, 0),
      balance: confirmed.reduce((s, b) => s + b.balance, 0),
      customers: users.filter((u) => !isAdminEmail(u.email)).length,
      unread: chats.reduce((s, c) => s + (c.unreadForAdmin || 0), 0),
      fullyBooked: LISTINGS.filter((l) => services[l.id]?.status === 'fully-booked').length,
    };
  }, [bookings, users, chats, services]);

  const upcoming = useMemo(() => {
    const today = todayStr();
    return bookings
      .filter((b) => b.status === 'confirmed' && b.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [bookings]);

  const recent = bookings.slice(0, 5);

  const cards = [
    { label: 'Pending bookings', value: stats.pending, icon: timeOutline, tone: 'amber', to: '/admin/bookings' },
    { label: 'Cancel requests', value: stats.cancelRequests, icon: alertCircleOutline, tone: 'orange', to: '/admin/bookings' },
    { label: 'Confirmed bookings', value: stats.confirmed, icon: checkmarkCircleOutline, tone: 'green', to: '/admin/bookings' },
    { label: `Refunds to return (${formatPeso(stats.refundAmount)})`, value: stats.refundCount, icon: walletOutline, tone: 'red', to: '/admin/bookings' },
    { label: 'Payments collected', value: formatPeso(stats.collected), icon: cashOutline, tone: 'teal', to: '/admin/bookings' },
    { label: 'Balance to collect', value: formatPeso(stats.balance), icon: cashOutline, tone: 'blue', to: '/admin/bookings' },
    { label: 'Registered customers', value: stats.customers, icon: peopleOutline, tone: 'teal', to: '/admin/guests' },
    { label: 'Unread messages', value: stats.unread, icon: chatbubbleOutline, tone: 'blue', to: '/admin/messages' },
    { label: `Fully booked (of ${LISTINGS.length})`, value: stats.fullyBooked, icon: constructOutline, tone: 'red', to: '/admin/services' },
  ];

  return (
    <div className="ap-wrap" style={{ padding: '16px' }}>
      <h2 className="ap-welcome">Welcome back, Admin</h2>
      <p className="ap-sub ap-welcome-sub">Here is what is happening at the resort.</p>

      <div className="ap-stats">
        {cards.map((c) => (
          <button key={c.label} type="button" className="ap-stat" onClick={() => navigate(c.to)}>
            <span className={`ap-stat-icon ${c.tone}`}>
              <IonIcon icon={c.icon} />
            </span>
            <span className="ap-stat-num">{c.value}</span>
            <span className="ap-stat-label">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="ap-panels">
        <section className="ap-panel">
          <h3>Upcoming bookings</h3>
          {upcoming.length === 0 ? (
            <p className="ap-empty ap-empty-sm">No upcoming confirmed bookings.</p>
          ) : (
            upcoming.map((b) => (
              <div className="ap-list-item" key={b.id}>
                <div>
                  <strong>{b.name}</strong>
                  <span>{b.listingName}</span>
                </div>
                <div className="ap-list-right">
                  <strong>{prettyDate(b.date)}</strong>
                  <span>{formatPeso(b.total)}</span>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="ap-panel">
          <h3>Recent bookings</h3>
          {recent.length === 0 ? (
            <p className="ap-empty ap-empty-sm">No bookings yet.</p>
          ) : (
            recent.map((b) => (
              <div className="ap-list-item" key={b.id}>
                <div>
                  <strong>{b.name}</strong>
                  <span>{b.listingName}</span>
                </div>
                <span className={`ap-pill ${b.status}`}>{STATUS_LABEL[b.status] ?? b.status}</span>
              </div>
            ))
          )}
          <button type="button" className="ap-btn ap-btn-ghost ap-view-all" onClick={() => navigate('/admin/bookings')}>
            View all bookings
          </button>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;