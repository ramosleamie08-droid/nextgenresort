import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";     

const firebaseConfig = {
  apiKey: "AIzaSyCvyCIBoKgWDn7Yf3D2tSII8WJLJ79XVw0",
  authDomain: "nextgen-pascual-resort.firebaseapp.com",
  projectId: "nextgen-pascual-resort",
  storageBucket: "nextgen-pascual-resort.firebasestorage.app",
  messagingSenderId: "449106145594",
  appId: "1:449106145594:web:e991eec219ebf11846a003",
  measurementId: "G-NG2BYQNPNW"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();