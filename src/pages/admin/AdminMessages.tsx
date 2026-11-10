import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import {
  arrowBackOutline,
  headsetOutline,
  personOutline,
  sendOutline,
} from 'ionicons/icons';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { isAdminEmail } from '../../data/admin';
import {
  ChatMessage,
  ChatSummary,
  HEARTBEAT_MS,
  markSeen,
  sendAdminMessage,
  subscribeChats,
  subscribeMessages,
  timeOf,
} from '../../services/chat';
import './AdminMessages.css';

// Sakop ang buong nakikitang lugar ng IonContent, kaya nakadikit ang input sa ilalim
const pageStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
};

const AdminMessages: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setReady(true);
      }),
    []
  );

  const isAdmin = isAdminEmail(user?.email);

  useEffect(() => {
    if (!isAdmin) return undefined;
    return subscribeChats(setChats);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !activeId) {
      setMessages([]);
      return undefined;
    }
    markSeen(activeId).catch((e) => console.warn('markSeen failed:', e));
    const unsub = subscribeMessages(activeId, setMessages);
    const beat = window.setInterval(() => {
      markSeen(activeId).catch(() => undefined);
    }, HEARTBEAT_MS);
    return () => {
      unsub();
      window.clearInterval(beat);
    };
  }, [isAdmin, activeId]);

  useEffect(() => {
    if (!activeId) return;
    const last = messages[messages.length - 1];
    if (last?.sender === 'customer') {
      markSeen(activeId).catch(() => undefined);
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeId]);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeId),
    [chats, activeId]
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || !activeId || sending) return;
    setError('');
    setText('');
    try {
      setSending(true);
      await sendAdminMessage(activeId, clean);
    } catch (err) {
      console.error(err);
      setError('Could not send. Please check your connection or permissions.');
      setText(clean);
    } finally {
      setSending(false);
    }
  };

  if (!ready) {
    return (
      <div style={pageStyle}>
        <div className="am-center"><IonSpinner name="crescent" /></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={pageStyle}>
        <div className="am-center">
          <h2>Admin access only</h2>
          <p>Please log in with an admin account.</p>
          <button type="button" className="am-btn" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <header className="am-top">
        <button type="button" onClick={() => navigate('/admin/dashboard')} aria-label="Back">
          <IonIcon icon={arrowBackOutline} />
        </button>
        <h1>Customer Messages</h1>
      </header>

      <div className={`am-body ${activeId ? 'has-thread' : ''}`}>
        <aside className="am-list">
          {chats.length === 0 ? (
            <p className="am-empty">No messages yet.</p>
          ) : (
            chats.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`am-item ${c.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <div className="am-avatar">{c.userName?.charAt(0).toUpperCase() || 'C'}</div>
                <div className="am-item-body">
                  <div className="am-item-top">
                    <strong>{c.userName || 'Customer'}</strong>
                    <span>{timeOf(c.updatedAt)}</span>
                  </div>
                  {c.userEmail && <div className="am-item-email">{c.userEmail}</div>}
                  <div className="am-item-last">
                    {c.lastSender === 'admin' ? 'You: ' : ''}
                    {c.lastMessage}
                  </div>
                </div>
                {c.unreadForAdmin > 0 && <span className="am-badge">{c.unreadForAdmin}</span>}
              </button>
            ))
          )}
        </aside>

        <section className="am-thread">
          {!activeId ? (
            <div className="am-placeholder">Select a conversation</div>
          ) : (
            <>
              <div className="am-thread-head">
                <button type="button" className="am-back" onClick={() => setActiveId(null)}>
                  <IonIcon icon={arrowBackOutline} />
                </button>
                <IonIcon icon={headsetOutline} className="am-head-icon" />
                <div className="am-head-info">
                  <strong className="am-head-name">{activeChat?.userName || 'Customer'}</strong>
                  {activeChat?.userEmail && (
                    <span className="am-head-email">{activeChat.userEmail}</span>
                  )}
                </div>
              </div>

              <div className="am-scroll" role="log" aria-live="polite">
                {messages.length === 0 && (
                  <div className="am-placeholder">No messages yet.</div>
                )}
                {messages.map((m) => {
                  const customer = m.sender === 'customer';
                  return (
                    <div key={m.id} className={`am-row ${customer ? 'left' : 'right'}`}>
                      {customer && (
                        <div className="am-mini-avatar">
                          <IonIcon icon={personOutline} />
                        </div>
                      )}
                      <div className={`am-bubble ${m.sender}`}>
                        {m.sender === 'bot' && <span className="am-tag">Auto-reply</span>}
                        {m.text}
                        <span className="am-time">{timeOf(m.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {error && <div className="am-error">{error}</div>}

              <form className="am-input" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Type a reply..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={2000}
                  enterKeyHint="send"
                  autoComplete="off"
                />
                <button type="submit" disabled={sending || !text.trim()} aria-label="Send">
                  <IonIcon icon={sendOutline} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminMessages;