import React, { useEffect, useRef, useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import {
  sunnyOutline,
  moonOutline,
  bedOutline,
  businessOutline,
  micOutline,
  calendarOutline,
  chatbubbleEllipsesOutline,
  mapOutline,
  chevronDownOutline,
  arrowForwardOutline,
  leafOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import './Home.css';

const CATEGORIES = [
  { label: 'Day Tours', desc: 'Enjoy the pool and cottages from 9am to 6pm.', icon: sunnyOutline, to: '/customer/home?cat=day' },
  { label: 'Night Tours', desc: 'Evening swimming and cottages from 6pm to 10pm.', icon: moonOutline, to: '/customer/home?cat=night' },
  { label: 'Rooms', desc: 'Airconditioned rooms for couples, families, and groups.', icon: bedOutline, to: '/customer/home?cat=rooms' },
  { label: 'Function Halls', desc: 'Spacious venues for birthdays, reunions, and events.', icon: businessOutline, to: '/customer/home?cat=halls' },
  { label: 'Extras', desc: 'Add videoke and more to make your stay better.', icon: micOutline, to: '/customer/home?cat=extras' },
];

const FEATURES = [
  { label: 'Book Online', desc: 'Reserve your date and pay with GCash, Maya, or bank.', icon: calendarOutline, to: '/customer/bookings' },
  { label: 'Chat with Us', desc: 'Message our admin anytime for questions and requests.', icon: chatbubbleEllipsesOutline, to: '/customer/chat' },
  { label: 'Find the Resort', desc: 'See the map and travel time from where you live.', icon: mapOutline, to: '/customer/map' },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const discoverRef = useRef<HTMLElement>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const go = (target: string) => {
    if (user) navigate(target);
    else navigate('/login');
  };

  const scrollToDiscover = () => {
    discoverRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <IonPage>
      <IonContent className="landing-content" fullscreen>
        {/* TOP BAR (STICKY) */}
        <header className="landing-nav">
          <div className="landing-nav-inner">
            <div className="landing-brand">
              <span className="landing-brand-logo">
                <IonIcon icon={leafOutline} />
              </span>
              <span className="landing-brand-text">
                <strong>Next Gen</strong>
                <em>Pascual Resort</em>
              </span>
            </div>

            <nav className="landing-links">
              <button type="button" onClick={scrollToDiscover}>Discover</button>
              <button type="button" onClick={() => go('/customer/home?cat=rooms')}>Rooms</button>
              <button type="button" onClick={() => go('/customer/home?cat=day')}>Day Tours</button>
              <button type="button" onClick={() => go('/customer/home?cat=night')}>Night Tours</button>
            </nav>

            <div className="landing-auth">
              {user ? (
                <button type="button" className="landing-pill landing-pill-solid" onClick={() => navigate('/customer/home')}>
                  My Account
                </button>
              ) : (
                <>
                  <button type="button" className="landing-pill" onClick={() => navigate('/login')}>
                    Log In
                  </button>
                  <button type="button" className="landing-pill landing-pill-solid" onClick={() => navigate('/register')}>
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="landing-wrapper">
          <h1 className="landing-title">NextGen Pascual Resort</h1>
          <p className="landing-tagline">Relax. Unwind. Experience paradise.</p>

          <div className="landing-cta">
            <button type="button" className="landing-btn-main" onClick={() => go('/customer/home')}>
              Get Started
            </button>
            <button type="button" className="landing-btn-outline" onClick={scrollToDiscover}>
              Discover
            </button>
          </div>

          <button type="button" className="landing-scroll" onClick={scrollToDiscover} aria-label="Scroll down">
            <IonIcon icon={chevronDownOutline} />
          </button>
        </section>

        {/* DISCOVER */}
        <section className="landing-section" ref={discoverRef}>
          <div className="landing-container">
            <span className="landing-eyebrow">Discover</span>
            <h2 className="landing-h2">Everything you need for your stay</h2>
            <p className="landing-lead">
              Browse our tours, rooms, and venues. {user ? '' : 'Log in to see full details and book.'}
            </p>

            <div className="landing-grid">
              {CATEGORIES.map((c) => (
                <button key={c.label} type="button" className="landing-card" onClick={() => go(c.to)}>
                  <span className="landing-card-icon">
                    <IonIcon icon={c.icon} />
                  </span>
                  <strong>{c.label}</strong>
                  <span className="landing-card-desc">{c.desc}</span>
                  <span className="landing-card-link">
                    Explore <IonIcon icon={arrowForwardOutline} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="landing-section landing-section-alt">
          <div className="landing-container">
            <span className="landing-eyebrow">Why book with us</span>
            <h2 className="landing-h2">Simple, fast, and all in one place</h2>

            <div className="landing-grid landing-grid-3">
              {FEATURES.map((f) => (
                <button key={f.label} type="button" className="landing-card landing-card-light" onClick={() => go(f.to)}>
                  <span className="landing-card-icon">
                    <IonIcon icon={f.icon} />
                  </span>
                  <strong>{f.label}</strong>
                  <span className="landing-card-desc">{f.desc}</span>
                  <span className="landing-card-link">
                    Open <IonIcon icon={arrowForwardOutline} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="landing-footer-section">
          <div className="landing-footer-content">
            <div className="footer-brand">
              <div className="landing-brand-logo" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <IonIcon icon={leafOutline} />
              </div>
              <h3>NextGen Pascual Resort</h3>
              <p>Your Journey, Our Passion.</p>
            </div>
            
            <div className="footer-info">
              <h4>Contact Us</h4>
              <p>📍 Victoria, Oriental Mindoro</p>
              <p>📞 +63 912 345 6789</p>
              <p>✉️ support@nextgenresort.com</p>
            </div>

            <div className="footer-info">
              <h4>Quick Links</h4>
              <p onClick={() => go('/customer/home')} style={{ cursor: 'pointer' }}>Book a Tour</p>
              <p onClick={() => go('/customer/chat')} style={{ cursor: 'pointer' }}>Chat with Admin</p>
              <p onClick={() => go('/customer/bookings')} style={{ cursor: 'pointer' }}>My Bookings</p>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} NextGen Pascual Resort. All rights reserved.</p>
          </div>
        </footer>
      </IonContent>
    </IonPage>
  );
};

export default Home;