import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js';
import {
  collection, doc, getDocs, updateDoc, deleteDoc,
} from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';
import { ref as storageRef, deleteObject } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js';
import { auth, db, storage } from './firebase-config.js';
import { translateAuthError } from './auth-errors.js';

// Reemplazar por el email real del administrador de Propi. Ese mismo email
// tiene que existir como usuario en Firebase Authentication (creado a mano
// desde Authentication → Users → Add user) y coincidir con el que se usa en
// las reglas de seguridad de Firestore/Storage para el rol de admin.
const ADMIN_EMAIL = 'admin@propi.com';

const loginTopbarEl = document.getElementById('admin-login-topbar');
const loginViewEl = document.getElementById('admin-login-view');
const dashboardEl = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('admin-login-form');
const loginErrorEl = document.getElementById('admin-login-error');
const loginSubmitBtn = document.getElementById('admin-login-submit');
const userEmailEl = document.getElementById('admin-user-email');

let inmobiliarias = [];
let propiedades = [];

onAuthStateChanged(auth, (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    loginTopbarEl.hidden = true;
    loginViewEl.hidden = true;
    dashboardEl.hidden = false;
    userEmailEl.textContent = user.email;
    loadDashboard();
  } else {
    dashboardEl.hidden = true;
    loginTopbarEl.hidden = false;
    loginViewEl.hidden = false;
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErrorEl.hidden = true;

  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;

  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = 'Ingresando...';

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (credential.user.email !== ADMIN_EMAIL) {
      await signOut(auth);
      loginErrorEl.textContent = 'Esta cuenta no tiene acceso al panel de administración.';
      loginErrorEl.hidden = false;
    }
  } catch (err) {
    loginErrorEl.textContent = translateAuthError(err);
    loginErrorEl.hidden = false;
  } finally {
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = 'Ingresar';
  }
});

document.getElementById('admin-logout-btn').addEventListener('click', async () => {
  await signOut(auth);
});

async function loadDashboard() {
  const [inmobiliariasSnap, propiedadesSnap, contactosSnap] = await Promise.all([
    getDocs(collection(db, 'inmobiliarias')),
    getDocs(collection(db, 'propiedades')),
    getDocs(collection(db, 'contactos')),
  ]);

  inmobiliarias = inmobiliariasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  propiedades = propiedadesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  document.getElementById('stat-inmobiliarias').textContent = inmobiliarias.length;
  document.getElementById('stat-propiedades').textContent = propiedades.length;
  document.getElementById('stat-contactos').textContent = contactosSnap.size;

  renderInmobiliarias();
  renderPropiedades();
}

function formatFecha(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== 'function') return '—';
  return timestamp.toDate().toLocaleDateString('es-AR');
}

function buildStatusBadge(activo, activeLabel, inactiveLabel) {
  const span = document.createElement('span');
  span.className = activo ? 'admin-status admin-status-active' : 'admin-status admin-status-inactive';
  span.textContent = activo ? activeLabel : inactiveLabel;
  return span;
}

function renderInmobiliarias() {
  const tbody = document.getElementById('admin-inmobiliarias-body');
  const emptyEl = document.getElementById('admin-inmobiliarias-empty');
  tbody.innerHTML = '';
  emptyEl.hidden = inmobiliarias.length > 0;

  inmobiliarias.forEach((inmo) => {
    const cantidadPropiedades = propiedades.filter((p) => p.inmobiliariaId === inmo.id).length;
    const activa = inmo.activo !== false;

    const tr = document.createElement('tr');

    const tdEmail = document.createElement('td');
    tdEmail.textContent = inmo.email || '—';
    tr.appendChild(tdEmail);

    const tdFecha = document.createElement('td');
    tdFecha.textContent = formatFecha(inmo.creadoEn);
    tr.appendChild(tdFecha);

    const tdPropiedades = document.createElement('td');
    tdPropiedades.textContent = cantidadPropiedades;
    tr.appendChild(tdPropiedades);

    const tdEstado = document.createElement('td');
    tdEstado.appendChild(buildStatusBadge(activa, 'Activa', 'Desactivada'));
    tr.appendChild(tdEstado);

    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'admin-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'option-btn';
    toggleBtn.textContent = activa ? 'Desactivar' : 'Reactivar';
    toggleBtn.addEventListener('click', () => toggleInmobiliaria(inmo, activa));
    tdAcciones.appendChild(toggleBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'option-btn';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.addEventListener('click', () => deleteInmobiliaria(inmo));
    tdAcciones.appendChild(deleteBtn);

    tr.appendChild(tdAcciones);
    tbody.appendChild(tr);
  });
}

async function toggleInmobiliaria(inmo, currentlyActive) {
  try {
    await updateDoc(doc(db, 'inmobiliarias', inmo.id), { activo: !currentlyActive });
    await loadDashboard();
  } catch (err) {
    console.error(err);
    alert('Ocurrió un error al actualizar la inmobiliaria.');
  }
}

async function deletePropiedadCompleta(propiedad) {
  if (propiedad.fotos) {
    for (const foto of propiedad.fotos) {
      await deleteObject(storageRef(storage, foto.path)).catch(() => {});
    }
  }
  await deleteDoc(doc(db, 'propiedades', propiedad.id));
}

async function deleteInmobiliaria(inmo) {
  const confirmed = window.confirm(
    `¿Eliminar a "${inmo.nombre || inmo.email}"? Esto también borra todas sus propiedades publicadas. Esta acción no se puede deshacer.`,
  );
  if (!confirmed) return;

  try {
    const suyas = propiedades.filter((p) => p.inmobiliariaId === inmo.id);
    for (const propiedad of suyas) {
      await deletePropiedadCompleta(propiedad);
    }
    await deleteDoc(doc(db, 'inmobiliarias', inmo.id));
    await loadDashboard();
  } catch (err) {
    console.error(err);
    alert('Ocurrió un error al eliminar la inmobiliaria.');
  }
}

function renderPropiedades() {
  const tbody = document.getElementById('admin-propiedades-body');
  const emptyEl = document.getElementById('admin-propiedades-empty');
  tbody.innerHTML = '';
  emptyEl.hidden = propiedades.length > 0;

  propiedades.forEach((propiedad) => {
    const activa = propiedad.activo !== false;
    const currencyPrefix = propiedad.operacion === 'Alquilar' ? '$' : 'USD';

    const tr = document.createElement('tr');

    const tdInmo = document.createElement('td');
    tdInmo.textContent = propiedad.inmobiliariaNombre || '—';
    tr.appendChild(tdInmo);

    const tdZona = document.createElement('td');
    tdZona.textContent = propiedad.zona || '—';
    tr.appendChild(tdZona);

    const tdPrecio = document.createElement('td');
    tdPrecio.textContent = `${currencyPrefix} ${Number(propiedad.precio || 0).toLocaleString('es-AR')}`;
    tr.appendChild(tdPrecio);

    const tdEstado = document.createElement('td');
    tdEstado.appendChild(buildStatusBadge(activa, 'Activa', 'Dada de baja'));
    tr.appendChild(tdEstado);

    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'admin-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'option-btn';
    toggleBtn.textContent = activa ? 'Dar de baja' : 'Reactivar';
    toggleBtn.addEventListener('click', () => togglePropiedad(propiedad, activa));
    tdAcciones.appendChild(toggleBtn);

    tr.appendChild(tdAcciones);
    tbody.appendChild(tr);
  });
}

async function togglePropiedad(propiedad, currentlyActive) {
  try {
    await updateDoc(doc(db, 'propiedades', propiedad.id), { activo: !currentlyActive });
    await loadDashboard();
  } catch (err) {
    console.error(err);
    alert('Ocurrió un error al actualizar la propiedad.');
  }
}
