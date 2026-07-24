import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js';
import { auth } from './firebase-config.js';

export function requireAuth(onUser) {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    onUser(user);
  });
}
