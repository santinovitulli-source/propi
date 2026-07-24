import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAGxs7CeXA0SkDapDVk1s9tcN44X5DHfe4',
  authDomain: 'propi-5ccf9.firebaseapp.com',
  projectId: 'propi-5ccf9',
  storageBucket: 'propi-5ccf9.firebasestorage.app',
  messagingSenderId: '633271350628',
  appId: '1:633271350628:web:7f9864f337cd32dad47671',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
