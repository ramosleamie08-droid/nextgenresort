import React, { useEffect, useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { searchOutline } from 'ionicons/icons';
import { UserProfile, subscribeUsers } from '../../services/users';
import { isAdminEmail } from '../../data/admin';
import './AdminPages.css'; // SIGURADUHING NAKA-IMPORT ITO

const joined = (ts: any) =>
  ts?.toDate
    ? ts.toDate().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

const AdminGuests: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => subscribeUsers(setUsers), []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => !isAdminEmail(u.email))
      .filter(
        (u) =>
          !q ||
          (u.name ?? '').toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q) ||
          (u.phone ?? '').includes(q)
      );
  }, [users, search]);

  return (
    <div className="ap-wrap">
      <div className="ap-search">
        <IonIcon icon={searchOutline} />
        <input
          type="text"
          placeholder="Search name, email or number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="ap-sub ap-total">{shown.length} registered customer(s)</p>

      {/* TABLE STRUCTURE */}
      <div className="ap-guest-table">
        <div className="ap-guest-table-header">
          <span>Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Registered</span>
        </div>

        {shown.length === 0 ? (
          <div className="ap-empty">No customers found.</div>
        ) : (
          shown.map((u) => (
            <div className="ap-guest-table-row" key={u.id}>
              <div className="ap-guest-name">
                <div className="ap-guest-avatar">
                  {(u.name || u.email || 'C').charAt(0).toUpperCase()}
                </div>
                <strong>{u.name || 'No name'}</strong>
              </div>
              <div className="ap-guest-email">{u.email || '—'}</div>
              <div className="ap-guest-phone">{u.phone || '—'}</div>
              <div className="ap-guest-date">{joined(u.createdAt) || '—'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminGuests;