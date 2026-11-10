import React, { useEffect, useRef, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { arrowBackOutline, headsetOutline, personOutline, sendOutline } from 'ionicons/icons';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import {
  ChatMessage,
  sendCustomerMessage,
  subscribeMessages,
  timeOf,
} from '../../services/chat';
import './CustomerChat.css';

const CustomerChat: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = subscribeMessages(user.uid, (m) => {
      setMessages(m);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || !user || sending) return;

    setError('');
    setText('');
    try {
      setSending(true);
      await sendCustomerMessage(user, clean);
    } catch (err) {
      console.error(err);
      setError('Could not send your message. Please try again.');
      setText(clean);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-container">
      {/* HEADER */}
      <div className="chat-header">
        <button type="button" onClick={() => navigate('/customer/home')} aria-label="Back">
          <IonIcon icon={arrowBackOutline} />
        </button>
        <h1>Messages</h1>
      </div>

      <div className="chat-sub">
        <IonIcon icon={headsetOutline} />
        NextGen Admin
      </div>

      {/* MESSAGES */}
      <div className="chat-messages">
        {!user ? (
          <div className="chat-empty">
            <p>Please log in to chat with our admin.</p>
            <button type="button" onClick={() => navigate('/login')}>Log In</button>
          </div>
        ) : loading ? (
          <div className="chat-empty"><IonSpinner name="crescent" /></div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <p>Hi! Send us a message and our admin will reply as soon as possible.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender === 'customer';
            return (
              <div key={m.id} className={`chat-row ${mine ? 'mine' : 'theirs'}`}>
                {!mine && (
                  <div className="chat-avatar">
                    <IonIcon icon={m.sender === 'bot' ? headsetOutline : personOutline} />
                  </div>
                )}
                <div className="chat-bubble">
                  {m.sender === 'bot' && <span className="chat-tag">Auto-reply</span>}
                  {m.sender === 'admin' && <span className="chat-tag">Admin</span>}
                  {m.text}
                  <span className="chat-time">{timeOf(m.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <div className="chat-error">{error}</div>}

      {/* INPUT */}
      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder={user ? 'Type a message...' : 'Log in to chat'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!user}
          maxLength={2000}
          enterKeyHint="send"
          autoComplete="off"
        />
        <button type="submit" disabled={!user || sending || !text.trim()} aria-label="Send">
          <IonIcon icon={sendOutline} />
        </button>
      </form>
    </div>
  );
};

export default CustomerChat;