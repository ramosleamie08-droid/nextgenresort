import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonAlert,
} from '@ionic/react';
import {
  personOutline,
  mailOutline,
  callOutline,
  locationOutline,
  createOutline,
  trashOutline,
  saveOutline,
  closeOutline,
  cameraOutline,
} from 'ionicons/icons';
import { onAuthStateChanged, User, updateProfile, deleteUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { resizeImage } from '../../utils/avatar';
import './CustomerProfile.css';

const CustomerProfile: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  // Profile Data State
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState('');

  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete Account States
  const [hasPendingBooking, setHasPendingBooking] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setDisplayName(data.displayName || u.displayName || '');
            setPhone(data.phone || '');
            setAddress(data.address || '');
            setPhoto(data.photoURL || u.photoURL || '');
          } else {
            setDisplayName(u.displayName || '');
            setPhoto(u.photoURL || '');
          }

          // Check for pending bookings
          const bookingsRef = collection(db, 'bookings');
          const q = query(
            bookingsRef,
            where('userId', '==', u.uid),
            where('status', 'in', ['pending', 'confirmed'])
          );
          const bSnap = await getDocs(q);
          setHasPendingBooking(!bSnap.empty);
        } catch (e) {
          console.error('Failed to load profile', e);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    setErrorMsg('');
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file);
      await setDoc(doc(db, 'users', user.uid), { photoURL: dataUrl }, { merge: true });
      setPhoto(dataUrl);
      setSuccessMsg('Profile picture updated!');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    try {
      await updateProfile(user, { displayName });
      // setDoc + merge para gumana kahit wala pang document ang user
      await setDoc(
        doc(db, 'users', user.uid),
        { displayName, phone, address },
        { merge: true }
      );

      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await deleteUser(user);
      navigate('/login', { replace: true });
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') {
        setErrorMsg('Please log out and log in again before deleting your account for security reasons.');
      } else {
        setErrorMsg(e.message || 'Failed to delete account.');
      }
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="cp-content">
          <div className="cp-center"><IonSpinner name="crescent" /></div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="cp-content" fullscreen>
        <div className="cp-container">

          {/* AVATAR SECTION */}
          <div className="cp-card cp-avatar-card">
            <div className="cp-avatar-wrap">
              <div className="cp-avatar">
                {uploading ? (
                  <IonSpinner name="crescent" />
                ) : photo ? (
                  <img src={photo} alt="Profile" />
                ) : (
                  <IonIcon icon={personOutline} />
                )}
              </div>
              <button
                type="button"
                className="cp-avatar-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change profile picture"
              >
                <IonIcon icon={cameraOutline} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhoto}
              />
            </div>
            <h2>{displayName || 'Customer'}</h2>
            <p>{user?.email}</p>
          </div>

          {/* PERSONAL INFO SECTION */}
          <div className="cp-card">
            <div className="cp-card-header">
              <h3>Personal Information</h3>
              {!isEditing ? (
                <button type="button" className="cp-btn-edit" onClick={() => setIsEditing(true)}>
                  <IonIcon icon={createOutline} /> Edit
                </button>
              ) : (
                <div className="cp-edit-actions">
                  <button type="button" className="cp-btn-cancel" onClick={() => setIsEditing(false)}>
                    <IonIcon icon={closeOutline} />
                  </button>
                  <button type="button" className="cp-btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? <IonSpinner name="dots" /> : <IonIcon icon={saveOutline} />} Save
                  </button>
                </div>
              )}
            </div>

            <div className="cp-field">
              <label><IonIcon icon={personOutline} /> Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!isEditing}
                placeholder="Your Name"
              />
            </div>

            <div className="cp-field">
              <label><IonIcon icon={mailOutline} /> Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="cp-disabled"
              />
              <span className="cp-hint">Email cannot be changed.</span>
            </div>

            <div className="cp-field">
              <label><IonIcon icon={callOutline} /> Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
                placeholder="09xxxxxxxxx"
              />
            </div>

            <div className="cp-field">
              <label><IonIcon icon={locationOutline} /> Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!isEditing}
                placeholder="Your Address"
              />
            </div>
          </div>

          {/* DANGER ZONE SECTION */}
          <div className="cp-card cp-danger-zone">
            <h3>Account Actions</h3>
            <p>Once you delete your account, there is no going back. Please be certain.</p>

            <button
              type="button"
              className="cp-btn-delete"
              onClick={() => setShowDeleteAlert(true)}
              disabled={hasPendingBooking || saving}
            >
              <IonIcon icon={trashOutline} /> Delete Account
            </button>

            {hasPendingBooking && (
              <span className="cp-warning">
                ⚠️ You have pending bookings. Cannot delete account.
              </span>
            )}

            <button type="button" className="cp-btn-logout" onClick={handleLogout}>
              Log Out
            </button>
          </div>

        </div>
      </IonContent>

      <IonToast
        isOpen={!!successMsg}
        message={successMsg}
        duration={2500}
        color="success"
        onDidDismiss={() => setSuccessMsg('')}
      />
      <IonToast
        isOpen={!!errorMsg}
        message={errorMsg}
        duration={3500}
        color="danger"
        onDidDismiss={() => setErrorMsg('')}
      />

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Delete Account?"
        message="This will permanently remove your account and data. This action cannot be undone."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Delete', role: 'destructive', handler: handleDeleteAccount }
        ]}
      />
    </IonPage>
  );
};

export default CustomerProfile;