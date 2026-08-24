import { sendEmailVerification, signOut } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js';
import { auth } from './firebase-config.js';
import { requireAuth } from './auth-guard.js';
import { translateAuthError } from './auth-errors.js';

const emailAddressEl = document.getElementById('verify-email-address');
const errorEl = document.getElementById('verify-error');
const successEl = document.getElementById('verify-success');
const checkBtn = document.getElementById('verify-check-btn');
const resendBtn = document.getElementById('verify-resend-btn');
const logoutLink = document.getElementById('verify-logout-link');

requireAuth((user) => {
  if (user.emailVerified) {
    window.location.href = 'panel.html';
    return;
  }
  emailAddressEl.textContent = user.email;
});

function showError(message) {
  successEl.hidden = true;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function showSuccess(message) {
  errorEl.hidden = true;
  successEl.textContent = message;
  successEl.hidden = false;
}

checkBtn.addEventListener('click', async () => {
  errorEl.hidden = true;
  successEl.hidden = true;
  checkBtn.disabled = true;
  checkBtn.textContent = 'Comprobando...';

  try {
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      window.location.href = 'panel.html';
      return;
    }
    showError('Todavía no detectamos la verificación. Revisá tu casilla (y la carpeta de spam) y volvé a intentar.');
  } catch (err) {
    showError(translateAuthError(err));
  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = 'Ya verifiqué mi email';
  }
});

resendBtn.addEventListener('click', async () => {
  errorEl.hidden = true;
  successEl.hidden = true;
  resendBtn.disabled = true;
  resendBtn.textContent = 'Enviando...';

  try {
    await sendEmailVerification(auth.currentUser);
    showSuccess('Te reenviamos el email de verificación. Puede tardar unos minutos en llegar.');
  } catch (err) {
    showError(translateAuthError(err));
  } finally {
    resendBtn.disabled = false;
    resendBtn.textContent = 'Reenviar email de verificación';
  }
});

logoutLink.addEventListener('click', async (e) => {
  e.preventDefault();
  await signOut(auth);
  window.location.href = 'login.html';
});
