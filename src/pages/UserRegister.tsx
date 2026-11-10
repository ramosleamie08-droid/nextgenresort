import React, { useState } from 'react';
import { IonContent, IonPage, IonIcon, IonSpinner } from '@ionic/react';
import {
  personOutline,
  mailOutline,
  callOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import './UserLogin.css';

const UserRegister: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in your name, email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      // TODO: i-save ang phone sa Firestore kung kailangan
      navigate('/customer/home', { replace: true });
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
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
                Join
                <br />
                NextGen Pascual Resort
              </h1>
              <p className="lg-brand-tag">Create an account to book your stay.</p>
            </div>

            <div className="lg-form-side">
              <form className="lg-form" onSubmit={handleRegister} noValidate>
                <h2 className="lg-title">Create Account</h2>
                <p className="lg-subtitle">Sign up to get started.</p>

                <label className="lg-field">
                  <IonIcon icon={personOutline} className="lg-field-icon" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>

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
                  <IonIcon icon={callOutline} className="lg-field-icon" />
                  <input
                    type="tel"
                    placeholder="Phone Number (optional)"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                <label className="lg-field">
                  <IonIcon icon={lockClosedOutline} className="lg-field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="new-password"
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

                <label className="lg-field">
                  <IonIcon icon={lockClosedOutline} className="lg-field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>

                {error && <div className="lg-error">{error}</div>}

                <button type="submit" className="lg-submit" disabled={loading}>
                  {loading ? <IonSpinner name="crescent" /> : 'Create Account'}
                </button>

                <p className="lg-switch">
                  Already have an account?{' '}
                  <span onClick={() => navigate('/login')}>Log in</span>
                </p>
              </form>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default UserRegister;