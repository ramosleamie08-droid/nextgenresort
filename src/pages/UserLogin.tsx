import React, { useState } from 'react';
import { IonContent, IonPage, IonIcon, IonSpinner } from '@ionic/react';
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';
import { homeFor } from '../data/admin';
import './UserLogin.css';

const UserLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate(homeFor(auth.currentUser?.email), { replace: true });
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError('Incorrect email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setError('');
    setInfo('');
    setLoading(true);

    const provider = new GoogleAuthProvider();
    
    signInWithPopup(auth, provider)
      .then((result) => {
        navigate(homeFor(result.user.email), { replace: true });
      })
      .catch((err: any) => {
        console.error('Google login error:', err);
        
        if (err?.code === 'auth/popup-closed-by-user') {
          setError('Sign-in cancelled.');
        } else if (err?.code === 'auth/popup-blocked') {
          setError('Popup blocked. Please allow popups for this site.');
        } else if (err?.code === 'auth/operation-not-allowed') {
          setError('Google sign-in is not enabled. Please enable it in Firebase Console.');
        } else if (err?.code === 'auth/unauthorized-domain') {
          setError('Domain not authorized. Add localhost to Firebase Auth settings.');
        } else {
          setError(err?.message || 'Google sign-in failed. Please try again.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleForgot = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('Enter your email first, then tap "Forgot password?".');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Password reset link sent. Check your email.');
    } catch {
      setError('Could not send reset email. Check the address.');
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen scrollY className="lg-content">
        <div className="lg-bg">
          <div className="lg-overlay" />

          <div className="lg-card">
            <div className="lg-brand">
              <span className="lg-badge">Resort Booking</span>
              <h1 className="lg-brand-title">
                Welcome to
                <br />
                NextGen Pascual Resort
              </h1>
              <p className="lg-brand-tag">Relax. Unwind. Experience paradise.</p>
            </div>

            <div className="lg-form-side">
              <form className="lg-form" onSubmit={handleLogin} noValidate>
                <h2 className="lg-title">Welcome Back</h2>
                <p className="lg-subtitle">Please log in to your account.</p>

                <label className="lg-field">
                  <IonIcon icon={mailOutline} className="lg-field-icon" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label className="lg-field">
                  <IonIcon icon={lockClosedOutline} className="lg-field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="lg-eye"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                  </button>
                </label>

                <div className="lg-forgot-row">
                  <button type="button" className="lg-forgot" onClick={handleForgot}>
                    Forgot password?
                  </button>
                </div>

                {error && <div className="lg-error">{error}</div>}
                {info && <div className="lg-info">{info}</div>}

                <button type="submit" className="lg-submit" disabled={loading}>
                  {loading ? <IonSpinner name="crescent" /> : 'Log In'}
                </button>

                <div className="lg-divider">
                  <span>Or log in with</span>
                </div>

                <div className="lg-social">
                  <button type="button" className="lg-google-btn" onClick={handleGoogle}>
                    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
                      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/>
                      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>

                <p className="lg-switch">
                  Don&apos;t have an account?{' '}
                  <span onClick={() => navigate('/register')}>Sign up</span>
                </p>
              </form>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default UserLogin;