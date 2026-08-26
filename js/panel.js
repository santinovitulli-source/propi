import { signOut } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js';
import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';
import {
  ref as storageRef, uploadBytes, getDownloadURL, deleteObject,
} from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js';
import { auth, db, storage } from './firebase-config.js';
import { requireAuth } from './auth-guard.js';
import { OPERACIONES, TIPOS_PROPIEDAD, ZONAS, AMBIENTES, CONDICIONES } from './property-constants.js';

const PROPERTY_PHOTO_ICON = `<svg viewBox="0 0 64 64" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 28L32 10L56 28" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 24V54H50V24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="27" y="36" width="10" height="18" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
</svg>`;

const gridEl = document.getElementById('properties-grid');
const emptyEl = document.getElementById('panel-empty');
const overlayEl = document.getElementById('property-form-overlay');
const formEl = document.getElementById('property-form');
const formTitleEl = document.getElementById('form-title');
const formErrorEl = document.getElementById('form-error');
const submitBtn = document.getElementById('form-submit-btn');
const photosInput = document.getElementById('f-fotos');
const previewsEl = document.getElementById('photo-previews');
const condicionesEl = document.getElementById('f-condiciones');

const selectors = {
  operacion: document.getElementById('f-operacion'),
  tipo: document.getElementById('f-tipo'),
  zona: document.getElementById('f-zona'),
  ambientes: document.getElementById('f-ambientes'),
};

let currentUser = null;
let currentProperties = [];
let editingId = null;
let existingPhotos = [];
let removedPhotos = [];
let newFiles = [];

function fillSelect(select, options) {
  options.forEach((opt) => {
    const el = document.createElement('option');
    el.value = opt;
    el.textContent = opt;
    select.appendChild(el);
  });
}

fillSelect(selectors.operacion, OPERACIONES);
fillSelect(selectors.tipo, TIPOS_PROPIEDAD);
fillSelect(selectors.zona, ZONAS);
fillSelect(selectors.ambientes, AMBIENTES);

CONDICIONES.forEach((cond) => {
  const label = document.createElement('label');
  label.className = 'checkbox-option';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = cond;
  label.append(checkbox, document.createTextNode(cond));
  condicionesEl.appendChild(label);
});

requireAuth(async (user) => {
  if (!user.emailVerified) {
    window.location.href = 'verificar-email.html';
    return;
  }

  const profileSnap = await getDoc(doc(db, 'inmobiliarias', user.uid));
  const profile = profileSnap.exists() ? profileSnap.data() : null;

  if (profile && profile.activo === false) {
    document.getElementById('panel-deactivated').hidden = false;
    document.getElementById('panel-main-content').hidden = true;
    return;
  }

  currentUser = user;
  document.getElementById('panel-user').textContent = user.displayName || user.email;
  loadProperties();
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});

async function loadProperties() {
  const q = query(collection(db, 'propiedades'), where('inmobiliariaId', '==', currentUser.uid));
  const snapshot = await getDocs(q);
  currentProperties = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderProperties();
}

function renderProperties() {
  gridEl.innerHTML = '';
  emptyEl.hidden = currentProperties.length > 0;
  currentProperties.forEach((property) => gridEl.appendChild(buildPropertyCard(property)));
}

function buildPropertyCard(property) {
  const card = document.createElement('div');
  card.className = 'property-card';

  const photo = document.createElement('div');
  photo.className = 'property-photo';
  if (property.fotos && property.fotos.length) {
    const img = document.createElement('img');
    img.src = property.fotos[0].url;
    img.alt = '';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.onerror = () => {
      console.error('No se pudo cargar la foto de la propiedad:', property.fotos[0].url);
      photo.innerHTML = PROPERTY_PHOTO_ICON;
    };
    photo.appendChild(img);
  } else {
    photo.innerHTML = PROPERTY_PHOTO_ICON;
  }
  card.appendChild(photo);

  const body = document.createElement('div');
  body.className = 'property-body';

  const badge = document.createElement('span');
  badge.className = 'property-badge';
  badge.textContent = property.operacion;
  body.appendChild(badge);

  const title = document.createElement('h3');
  title.textContent = `${property.tipoPropiedad} en ${property.zona}`;
  body.appendChild(title);

  const meta = document.createElement('ul');
  meta.className = 'property-meta';
  [
    `$ ${Number(property.precio).toLocaleString('es-AR')}`,
    property.zona,
    `${property.ambientes} ambientes`,
  ].forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    meta.appendChild(li);
  });
  body.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'property-card-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'option-btn';
  editBtn.textContent = 'Editar';
  editBtn.addEventListener('click', () => openForm(property));
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'option-btn';
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.addEventListener('click', () => handleDelete(property));
  actions.appendChild(deleteBtn);

  body.appendChild(actions);
  card.appendChild(body);
  return card;
}

document.getElementById('new-property-btn').addEventListener('click', () => openForm(null));
document.getElementById('form-cancel-btn').addEventListener('click', closeForm);

function openForm(property) {
  editingId = property ? property.id : null;
  existingPhotos = property && property.fotos ? [...property.fotos] : [];
  removedPhotos = [];
  newFiles = [];
  formErrorEl.hidden = true;
  formEl.reset();

  formTitleEl.textContent = property ? 'Editar propiedad' : 'Nueva propiedad';
  selectors.operacion.value = property ? property.operacion : '';
  selectors.tipo.value = property ? property.tipoPropiedad : '';
  selectors.zona.value = property ? property.zona : '';
  selectors.ambientes.value = property ? property.ambientes : '';
  document.getElementById('f-precio').value = property ? property.precio : '';
  document.getElementById('f-whatsapp').value = property ? property.whatsapp : '';
  document.getElementById('f-descripcion').value = property ? property.descripcion || '' : '';

  const selectedConditions = (property && property.condicionesEspeciales) || [];
  condicionesEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = selectedConditions.includes(cb.value);
  });

  renderPhotoPreviews();
  overlayEl.hidden = false;
}

function closeForm() {
  overlayEl.hidden = true;
  editingId = null;
  existingPhotos = [];
  removedPhotos = [];
  newFiles = [];
}

photosInput.addEventListener('change', () => {
  const remainingSlots = 20 - existingPhotos.length - newFiles.length;
  if (photosInput.files.length > remainingSlots) {
    formErrorEl.textContent = `Ya tenés ${existingPhotos.length + newFiles.length} fotos cargadas. Podés agregar hasta ${remainingSlots} más.`;
    formErrorEl.hidden = false;
    photosInput.value = '';
    return;
  }
  newFiles.push(...Array.from(photosInput.files));
  photosInput.value = '';
  renderPhotoPreviews();
});

function renderPhotoPreviews() {
  previewsEl.innerHTML = '';

  existingPhotos.forEach((photoItem, index) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb';
    const img = document.createElement('img');
    img.src = photoItem.url;
    img.alt = '';
    thumb.appendChild(img);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      removedPhotos.push(existingPhotos[index]);
      existingPhotos.splice(index, 1);
      renderPhotoPreviews();
    });
    thumb.appendChild(removeBtn);
    previewsEl.appendChild(thumb);
  });

  newFiles.forEach((file, index) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = '';
    thumb.appendChild(img);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      newFiles.splice(index, 1);
      renderPhotoPreviews();
    });
    thumb.appendChild(removeBtn);
    previewsEl.appendChild(thumb);
  });
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  formErrorEl.hidden = true;

  if (existingPhotos.length + newFiles.length === 0) {
    formErrorEl.textContent = 'Subí al menos una foto de la propiedad.';
    formErrorEl.hidden = false;
    return;
  }

  const condicionesEspeciales = Array.from(
    condicionesEl.querySelectorAll('input[type="checkbox"]:checked'),
  ).map((cb) => cb.value);

  const propertyData = {
    inmobiliariaId: currentUser.uid,
    inmobiliariaNombre: currentUser.displayName || currentUser.email,
    operacion: selectors.operacion.value,
    tipoPropiedad: selectors.tipo.value,
    zona: selectors.zona.value,
    ambientes: selectors.ambientes.value,
    precio: Number(document.getElementById('f-precio').value),
    whatsapp: document.getElementById('f-whatsapp').value.trim(),
    descripcion: document.getElementById('f-descripcion').value.trim(),
    condicionesEspeciales,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Guardando...';

  try {
    const docRef = editingId ? doc(db, 'propiedades', editingId) : doc(collection(db, 'propiedades'));

    const uploadedPhotos = [];
    for (const file of newFiles) {
      const path = `propiedades/${currentUser.uid}/${docRef.id}/${crypto.randomUUID()}-${file.name}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      uploadedPhotos.push({ url, path });
    }

    for (const photoItem of removedPhotos) {
      await deleteObject(storageRef(storage, photoItem.path)).catch(() => {});
    }

    const fotos = [...existingPhotos, ...uploadedPhotos];

    if (editingId) {
      await updateDoc(docRef, { ...propertyData, fotos, actualizadoEn: serverTimestamp() });
    } else {
      await setDoc(docRef, { ...propertyData, fotos, creadoEn: serverTimestamp() });
    }

    closeForm();
    await loadProperties();
  } catch (err) {
    console.error(err);
    formErrorEl.textContent = 'Ocurrió un error al guardar la propiedad. Intentá de nuevo.';
    formErrorEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Guardar propiedad';
  }
});

async function handleDelete(property) {
  const confirmed = window.confirm('¿Seguro que querés eliminar esta propiedad? Esta acción no se puede deshacer.');
  if (!confirmed) return;

  try {
    if (property.fotos) {
      for (const photoItem of property.fotos) {
        await deleteObject(storageRef(storage, photoItem.path)).catch(() => {});
      }
    }
    await deleteDoc(doc(db, 'propiedades', property.id));
    await loadProperties();
  } catch (err) {
    console.error(err);
    alert('Ocurrió un error al eliminar la propiedad.');
  }
}
