import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js';
import { db } from './firebase-config.js';

// Reemplazar por el número real de WhatsApp de Propi (formato: 549 + código de área + número, sin espacios ni signos)
const PROPI_WHATSAPP_NUMBER = '5493410000000';

const messagesEl = document.getElementById('chat-messages');
const optionsEl = document.getElementById('chat-options');
const inputRowEl = document.getElementById('chat-input-row');
const inputEl = document.getElementById('chat-input');
const sendBtn = document.getElementById('chat-send');
const editAreaEl = document.getElementById('chat-edit-area');
const editTextareaEl = document.getElementById('chat-edit-textarea');
const editSaveBtn = document.getElementById('chat-edit-save');
const chatWidgetEl = document.getElementById('chat-widget');
const resultsSectionEl = document.getElementById('resultados');
const resultsSubtitleEl = document.getElementById('results-subtitle');
const resultsGridEl = document.getElementById('results-grid');
const resultsRestartBtn = document.getElementById('results-restart');

const modalOverlayEl = document.getElementById('property-modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
const galleryMainWrapEl = document.getElementById('gallery-main-wrap');
const galleryPlaceholderEl = document.getElementById('gallery-placeholder');
const galleryMainImgEl = document.getElementById('gallery-main-img');
const galleryPrevBtn = document.getElementById('gallery-prev');
const galleryNextBtn = document.getElementById('gallery-next');
const galleryCounterEl = document.getElementById('gallery-counter');
const galleryThumbsEl = document.getElementById('gallery-thumbs');
const galleryZoomResetBtn = document.getElementById('gallery-zoom-reset');
const modalAgencyAvatarEl = document.getElementById('modal-agency-avatar');
const modalAgencyNameEl = document.getElementById('modal-agency-name');
const modalBadgeEl = document.getElementById('modal-badge');
const modalTitleEl = document.getElementById('modal-title');
const modalPriceEl = document.getElementById('modal-price');
const modalMetaEl = document.getElementById('modal-meta');
const modalDescripcionEl = document.getElementById('modal-descripcion');
const modalCondicionesEl = document.getElementById('modal-condiciones');
const modalContactEl = document.getElementById('modal-contact');

const PROPERTY_PHOTO_ICON = `<svg viewBox="0 0 64 64" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 28L32 10L56 28" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 24V54H50V24" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="27" y="36" width="10" height="18" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
</svg>`;

const zonas = ['Centro', 'Pichincha', 'Echesortu', 'Fisherton', 'Zona Sur', 'No estoy seguro'];
const ambientesOptions = ['1', '2', '3', '4 o más'];
const personasOptions = ['1 persona', '2 personas', '3 personas', '4 o más'];
const condicionOptions = ['Acepta mascotas', 'Cochera', 'Accesibilidad'];

const initialStep = {
  id: 'operacion',
  label: 'Modalidad',
  bot: '¡Hola! 👋 Soy el asistente de Propi. Contame, ¿qué estás buscando?',
  type: 'options',
  options: ['Alquilar', 'Comprar', 'En pozo'],
};

const rentSteps = [
  { id: 'tipoPropiedad', label: 'Tipo de propiedad', bot: '¿Qué tipo de propiedad estás buscando?', type: 'options', options: ['Departamento', 'Casa', 'PH', 'Local comercial'] },
  { id: 'zona', label: 'Zona', bot: '¿En qué zona de Rosario te gustaría estar?', type: 'options', options: zonas },
  { id: 'ambientes', label: 'Ambientes', bot: '¿Cuántos ambientes necesitás?', type: 'options', options: ambientesOptions },
  { id: 'precioMensual', label: 'Presupuesto mensual', bot: '¿Cuál es tu presupuesto mensual aproximado (en pesos)?', type: 'text', placeholder: 'Ej: 350.000' },
  { id: 'personas', label: 'Personas que van a vivir', bot: '¿Cuántas personas van a vivir en la propiedad?', type: 'options', options: personasOptions },
  { id: 'condicionEspecial', label: 'Condiciones especiales', bot: '¿Alguna condición especial que debamos tener en cuenta? (mascotas, cochera, accesibilidad)', type: 'multi', options: condicionOptions },
];

const buySteps = [
  { id: 'tipoPropiedad', label: 'Tipo de propiedad', bot: '¿Qué tipo de propiedad estás buscando?', type: 'options', options: ['Departamento', 'Casa', 'PH', 'Terreno', 'Local comercial'] },
  { id: 'zona', label: 'Zona', bot: '¿En qué zona de Rosario te gustaría estar?', type: 'options', options: zonas },
  { id: 'personas', label: 'Personas que van a vivir', bot: '¿Cuántas personas van a vivir en la propiedad?', type: 'options', options: personasOptions },
  { id: 'ambientes', label: 'Ambientes', bot: '¿Cuántos ambientes necesitás?', type: 'options', options: ambientesOptions },
  { id: 'presupuesto', label: 'Presupuesto', bot: '¿Cuál es tu presupuesto aproximado (en dólares)?', type: 'text', placeholder: 'Ej: 120.000' },
  { id: 'condicionEspecial', label: 'Condiciones especiales', bot: '¿Alguna condición especial que debamos tener en cuenta? (mascotas, cochera, accesibilidad)', type: 'multi', options: condicionOptions },
  { id: 'finalidad', label: 'Finalidad', bot: '¿Para qué lo querés?', type: 'options', options: ['Para vivir', 'Inversión', 'Para un familiar'] },
  { id: 'caracteristicas', label: 'Características específicas', bot: '¿Alguna característica específica que busques? (piso, orientación, balcón, a estrenar o usado)', type: 'text', placeholder: 'Ej: piso alto, orientación norte, a estrenar' },
];

const offPlanSteps = [
  { id: 'zona', label: 'Zona', bot: '¿En qué zona de Rosario te gustaría estar?', type: 'options', options: zonas },
  { id: 'ambientes', label: 'Ambientes', bot: '¿Cuántos ambientes necesitás?', type: 'options', options: ambientesOptions },
  { id: 'finalidad', label: 'Finalidad', bot: '¿Lo buscás como inversión o para vivir?', type: 'options', options: ['Inversión', 'Vivienda'] },
  { id: 'plazoEstreno', label: 'Plazo máximo de estreno', bot: '¿Cuántos años máximo estás dispuesto a esperar hasta que se estrene?', type: 'options', options: ['Hasta 1 año', 'Hasta 2 años', 'Hasta 3 años', 'Más de 3 años'] },
  { id: 'presupuesto', label: 'Presupuesto disponible', bot: '¿Cuál es tu presupuesto disponible?', type: 'text', placeholder: 'Ej: 80.000 USD' },
];

const flowMap = {
  Alquilar: { steps: rentSteps },
  Comprar: { steps: buySteps },
  'En pozo': { steps: offPlanSteps },
};

let answers = {};
let queue = [];
let qIndex = 0;
let flowStepsSnapshot = [];
let summaryText = '';
let inputMode = null; // 'queue' | 'freeform'
let freeformCallback = null;

function addMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `msg msg-${sender}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'msg-typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  messagesEl.appendChild(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return typing;
}

function botSay(text) {
  return new Promise((resolve) => {
    const typing = showTyping();
    setTimeout(() => {
      typing.remove();
      addMessage(text, 'bot');
      resolve();
    }, 500 + Math.random() * 400);
  });
}

function clearOptions() {
  optionsEl.innerHTML = '';
}

function disableInput() {
  inputEl.disabled = true;
  sendBtn.disabled = true;
  inputEl.value = '';
  inputEl.placeholder = 'Escribí tu respuesta...';
  inputMode = null;
}

function enableInput(placeholder, mode) {
  inputEl.disabled = false;
  sendBtn.disabled = false;
  inputEl.placeholder = placeholder || 'Escribí tu respuesta...';
  inputMode = mode;
  inputEl.focus();
}

function renderOptions(options, multi) {
  clearOptions();
  const selected = new Set();

  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.textContent = option;

    btn.addEventListener('click', () => {
      if (!multi) {
        finishStep(option);
        return;
      }

      if (selected.has(option)) {
        selected.delete(option);
        btn.classList.remove('selected');
      } else {
        selected.add(option);
        btn.classList.add('selected');
      }
    });

    optionsEl.appendChild(btn);
  });

  if (multi) {
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'option-btn';
    confirmBtn.style.borderStyle = 'dashed';
    confirmBtn.textContent = 'Continuar';
    confirmBtn.addEventListener('click', () => {
      finishStep(selected.size ? Array.from(selected).join(', ') : 'Ninguna en particular');
    });
    optionsEl.appendChild(confirmBtn);
  }
}

async function askCurrent() {
  const step = queue[qIndex];
  const text = typeof step.bot === 'function' ? step.bot(answers) : step.bot;
  await botSay(text);

  if (step.type === 'options') {
    renderOptions(step.options, false);
  } else if (step.type === 'multi') {
    renderOptions(step.options, true);
  } else if (step.type === 'text') {
    enableInput(step.placeholder, 'queue');
  }
}

async function finishStep(reply) {
  const step = queue[qIndex];
  addMessage(reply, 'user');
  answers[step.id] = reply;
  clearOptions();
  disableInput();

  if (step.id === 'operacion') {
    const flow = flowMap[reply];
    flowStepsSnapshot = flow.steps;
    queue = queue.concat(flow.steps);
  }

  qIndex += 1;

  if (qIndex >= queue.length) {
    await showSummaryPhase();
  } else {
    await askCurrent();
  }
}

inputRowEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = inputEl.value.trim();
  if (!value) return;

  if (inputMode === 'freeform' && freeformCallback) {
    const cb = freeformCallback;
    freeformCallback = null;
    addMessage(value, 'user');
    disableInput();
    cb(value);
  } else if (inputMode === 'queue') {
    finishStep(value);
  }
});

function buildSummaryText() {
  const lines = flowStepsSnapshot.map((step) => `• ${step.label}: ${answers[step.id]}`);
  return `Esto es lo que entendí de tu búsqueda (${answers.operacion}):\n${lines.join('\n')}`;
}

async function showSummaryPhase() {
  summaryText = buildSummaryText();
  await presentSummary();
}

async function presentSummary() {
  await botSay(summaryText);
  renderSummaryOptions();
}

function renderSummaryOptions() {
  clearOptions();
  editAreaEl.hidden = true;
  disableInput();

  const choices = ['Confirmar y buscar', 'Editar el texto', 'Agregar más detalles'];
  choices.forEach((label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => handleSummaryOption(label));
    optionsEl.appendChild(btn);
  });
}

function handleSummaryOption(label) {
  addMessage(label, 'user');
  clearOptions();

  if (label === 'Confirmar y buscar') {
    confirmAndShowResults();
  } else if (label === 'Editar el texto') {
    startEditing();
  } else {
    startAddDetails();
  }
}

async function startEditing() {
  await botSay('Dale, editá el texto como necesites y guardá los cambios:');
  editTextareaEl.value = summaryText;
  editAreaEl.hidden = false;
  editTextareaEl.focus();
}

editSaveBtn.addEventListener('click', async () => {
  const edited = editTextareaEl.value.trim();
  if (!edited) return;
  summaryText = edited;
  editAreaEl.hidden = true;
  addMessage(edited, 'user');
  await botSay('Listo, actualicé el resumen con tus cambios.');
  renderSummaryOptions();
});

async function startAddDetails() {
  await botSay('Contanos qué más deberíamos saber para afinar la búsqueda.');
  enableInput('Ej: cerca de una plaza, con luz natural...', 'freeform');
  freeformCallback = async (value) => {
    summaryText += `\n• Detalles adicionales: ${value}`;
    await botSay('Sumado. Este quedó el resumen actualizado:');
    await presentSummary();
  };
}

async function confirmAndShowResults() {
  await botSay('¡Buenísimo! Encontré estas propiedades que matchean con tu búsqueda 👇');
  await showResults();
}

function normalizeWhatsapp(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('549')) return digits;
  if (digits.startsWith('54')) return `549${digits.slice(2)}`;
  return `549${digits}`;
}

async function fetchMatchingProperties() {
  const baseFilters = [where('operacion', '==', answers.operacion)];
  if (answers.zona && answers.zona !== 'No estoy seguro') {
    baseFilters.push(where('zona', '==', answers.zona));
  }

  const attempts = [];
  if (answers.tipoPropiedad && answers.ambientes) {
    attempts.push([...baseFilters, where('tipoPropiedad', '==', answers.tipoPropiedad), where('ambientes', '==', answers.ambientes)]);
  }
  if (answers.tipoPropiedad) {
    attempts.push([...baseFilters, where('tipoPropiedad', '==', answers.tipoPropiedad)]);
  }
  if (answers.ambientes) {
    attempts.push([...baseFilters, where('ambientes', '==', answers.ambientes)]);
  }
  attempts.push(baseFilters);

  try {
    for (const filters of attempts) {
      const snapshot = await getDocs(query(collection(db, 'propiedades'), ...filters));
      if (!snapshot.empty) {
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    }
  } catch (err) {
    console.error('Error buscando propiedades reales:', err);
  }

  return [];
}

function parseAmount(text) {
  const digits = (text || '').replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : null;
}

function formatAmount(amount, prefix) {
  return `${prefix} ${amount.toLocaleString('es-AR')}`;
}

function buildMockProperties() {
  const flow = answers.operacion;
  const zona = answers.zona || 'Rosario';
  const ambientes = answers.ambientes || '—';
  const tipo = answers.tipoPropiedad || (flow === 'En pozo' ? 'Emprendimiento' : 'Propiedad');
  const rawBudget = flow === 'Alquilar' ? answers.precioMensual : answers.presupuesto;
  const baseAmount = parseAmount(rawBudget);
  const currencyPrefix = flow === 'Alquilar' ? '$' : 'USD';

  return [0.92, 1, 1.15].map((multiplier, index) => ({
    id: `mock-${index}`,
    tipo,
    titulo: `${tipo} en ${zona}`,
    precio: baseAmount ? formatAmount(Math.round((baseAmount * multiplier) / 1000) * 1000, currencyPrefix) : 'Consultar precio',
    zona,
    ambientes,
  }));
}

function toViewModel(property, isReal) {
  if (!isReal) {
    return {
      titulo: property.titulo,
      tipo: property.tipo,
      operacionLabel: answers.operacion,
      precioLabel: property.precio,
      zona: property.zona,
      ambientes: property.ambientes,
      photos: [],
      descripcion: 'Propiedad de ejemplo mientras se suman más inmobiliarias a la plataforma en esta búsqueda.',
      condiciones: [],
      agencyName: 'Propi',
      whatsappNumber: PROPI_WHATSAPP_NUMBER,
      contactExtra: '',
    };
  }

  const currencyPrefix = property.operacion === 'Alquilar' ? '$' : 'USD';
  return {
    titulo: `${property.tipoPropiedad} en ${property.zona}`,
    tipo: property.tipoPropiedad,
    operacionLabel: property.operacion,
    precioLabel: formatAmount(Number(property.precio) || 0, currencyPrefix),
    zona: property.zona,
    ambientes: property.ambientes,
    photos: (property.fotos || []).map((foto) => foto.url),
    descripcion: property.descripcion || 'Esta inmobiliaria todavía no cargó una descripción para esta propiedad.',
    condiciones: property.condicionesEspeciales || [],
    agencyName: property.inmobiliariaNombre || 'Inmobiliaria de Rosario',
    whatsappNumber: normalizeWhatsapp(property.whatsapp),
    contactExtra: property.descripcion ? ` Descripción: ${property.descripcion}.` : '',
  };
}

function buildContactSection(vm) {
  const wrapper = document.createElement('div');
  wrapper.className = 'contact-section';

  const contactBtn = document.createElement('button');
  contactBtn.type = 'button';
  contactBtn.className = 'contact-btn';
  contactBtn.textContent = 'Contactar por WhatsApp';
  wrapper.appendChild(contactBtn);

  const leadForm = document.createElement('form');
  leadForm.className = 'lead-form';
  leadForm.hidden = true;

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Tu nombre';
  nameInput.required = true;

  const phoneInput = document.createElement('input');
  phoneInput.type = 'tel';
  phoneInput.placeholder = 'Tu teléfono';
  phoneInput.required = true;

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Enviar';

  leadForm.append(nameInput, phoneInput, submitBtn);
  wrapper.appendChild(leadForm);

  const successMsg = document.createElement('p');
  successMsg.className = 'lead-success';
  successMsg.hidden = true;
  successMsg.textContent = 'Listo, un asesor de Propi se va a contactar con vos a la brevedad.';
  wrapper.appendChild(successMsg);

  contactBtn.addEventListener('click', () => {
    leadForm.hidden = !leadForm.hidden;
  });

  leadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = nameInput.value.trim();
    const telefono = phoneInput.value.trim();
    if (!nombre || !telefono) return;

    leadForm.hidden = true;
    contactBtn.hidden = true;
    successMsg.hidden = false;

    const waMessage = encodeURIComponent(
      `Hola Propi! Soy ${nombre} (tel: ${telefono}). Me interesa la propiedad: ${vm.titulo}, ${vm.precioLabel}, ${vm.ambientes} ambientes en ${vm.zona}.${vm.contactExtra}`
    );
    window.open(`https://wa.me/${vm.whatsappNumber}?text=${waMessage}`, '_blank', 'noopener');
  });

  return wrapper;
}

function buildPropertyCard(property, isReal) {
  const vm = toViewModel(property, isReal);

  const card = document.createElement('div');
  card.className = 'property-card clickable';

  const photo = document.createElement('div');
  photo.className = 'property-photo';
  if (vm.photos.length) {
    const img = document.createElement('img');
    img.src = vm.photos[0];
    img.alt = '';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.onerror = () => {
      console.error('No se pudo cargar la foto de la propiedad:', vm.photos[0]);
      photo.innerHTML = PROPERTY_PHOTO_ICON;
    };
    photo.appendChild(img);
  } else {
    photo.innerHTML = PROPERTY_PHOTO_ICON;
  }
  card.appendChild(photo);

  const body = document.createElement('div');
  body.className = 'property-body';

  const title = document.createElement('h3');
  title.textContent = vm.titulo;
  body.appendChild(title);

  const meta = document.createElement('ul');
  meta.className = 'property-meta';
  [vm.precioLabel, vm.zona, `${vm.ambientes} ambientes`].forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    meta.appendChild(li);
  });
  body.appendChild(meta);

  const viewMore = document.createElement('p');
  viewMore.className = 'property-view-more';
  viewMore.textContent = 'Ver detalles y fotos →';
  body.appendChild(viewMore);

  card.appendChild(body);
  card.addEventListener('click', () => openPropertyModal(vm));
  return card;
}

let modalPhotos = [];
let modalIndex = 0;
let zoomScale = 1;
let pinchStartDistance = null;
let pinchStartScale = 1;

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.4;
const ZOOM_CLICK_LEVEL = 2;

function applyZoom(scale) {
  zoomScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale));
  galleryMainImgEl.style.transform = `scale(${zoomScale})`;
  const isZoomed = zoomScale > 1;
  galleryMainWrapEl.classList.toggle('zoomed', isZoomed);
  galleryZoomResetBtn.hidden = !isZoomed;
}

function resetZoom() {
  applyZoom(1);
}

function renderGalleryMain() {
  const hasPhotos = modalPhotos.length > 0;

  galleryMainImgEl.hidden = !hasPhotos;
  galleryPlaceholderEl.hidden = hasPhotos;
  galleryPrevBtn.hidden = modalPhotos.length <= 1;
  galleryNextBtn.hidden = modalPhotos.length <= 1;
  galleryCounterEl.hidden = !hasPhotos;

  if (hasPhotos) {
    galleryMainImgEl.src = modalPhotos[modalIndex];
    galleryMainImgEl.onerror = () => {
      galleryMainImgEl.hidden = true;
      galleryPlaceholderEl.hidden = false;
    };
    galleryCounterEl.textContent = `${modalIndex + 1} / ${modalPhotos.length}`;
  } else {
    galleryPlaceholderEl.innerHTML = PROPERTY_PHOTO_ICON;
  }

  galleryThumbsEl.querySelectorAll('img').forEach((thumb, index) => {
    thumb.classList.toggle('active', index === modalIndex);
  });
}

function renderGalleryThumbs() {
  galleryThumbsEl.innerHTML = '';

  if (modalPhotos.length <= 1) {
    galleryThumbsEl.hidden = true;
    return;
  }

  galleryThumbsEl.hidden = false;
  modalPhotos.forEach((url, index) => {
    const thumb = document.createElement('img');
    thumb.src = url;
    thumb.alt = '';
    thumb.className = index === modalIndex ? 'active' : '';
    thumb.addEventListener('click', () => {
      modalIndex = index;
      resetZoom();
      renderGalleryMain();
    });
    galleryThumbsEl.appendChild(thumb);
  });
}

function showPreviousPhoto() {
  if (!modalPhotos.length) return;
  modalIndex = (modalIndex - 1 + modalPhotos.length) % modalPhotos.length;
  resetZoom();
  renderGalleryMain();
}

function showNextPhoto() {
  if (!modalPhotos.length) return;
  modalIndex = (modalIndex + 1) % modalPhotos.length;
  resetZoom();
  renderGalleryMain();
}

function openPropertyModal(vm) {
  modalPhotos = vm.photos;
  modalIndex = 0;
  resetZoom();

  modalAgencyAvatarEl.textContent = vm.agencyName.charAt(0).toUpperCase();
  modalAgencyNameEl.textContent = vm.agencyName;
  modalBadgeEl.textContent = vm.operacionLabel || '';
  modalTitleEl.textContent = vm.titulo;
  modalPriceEl.textContent = vm.precioLabel;
  modalDescripcionEl.textContent = vm.descripcion;

  modalMetaEl.innerHTML = '';
  [`Tipo: ${vm.tipo}`, `Zona: ${vm.zona}`, `Ambientes: ${vm.ambientes}`].forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    modalMetaEl.appendChild(li);
  });

  modalCondicionesEl.innerHTML = '';
  if (vm.condiciones.length) {
    modalCondicionesEl.hidden = false;
    vm.condiciones.forEach((condicion) => {
      const span = document.createElement('span');
      span.textContent = condicion;
      modalCondicionesEl.appendChild(span);
    });
  } else {
    modalCondicionesEl.hidden = true;
  }

  modalContactEl.innerHTML = '';
  modalContactEl.appendChild(buildContactSection(vm));

  renderGalleryMain();
  renderGalleryThumbs();

  modalOverlayEl.hidden = false;
}

function closePropertyModal() {
  modalOverlayEl.hidden = true;
  modalPhotos = [];
  modalIndex = 0;
  resetZoom();
}

modalCloseBtn.addEventListener('click', closePropertyModal);
galleryPrevBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  showPreviousPhoto();
});
galleryNextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  showNextPhoto();
});
modalOverlayEl.addEventListener('click', (e) => {
  if (e.target === modalOverlayEl) closePropertyModal();
});
document.addEventListener('keydown', (e) => {
  if (modalOverlayEl.hidden) return;
  if (e.key === 'Escape') closePropertyModal();
  if (e.key === 'ArrowLeft') showPreviousPhoto();
  if (e.key === 'ArrowRight') showNextPhoto();
});

// Zoom: clic para alternar, rueda del mouse o pellizco para ajustar, doble clic o botón para resetear
galleryMainImgEl.addEventListener('click', (e) => {
  e.stopPropagation();
  applyZoom(zoomScale > 1 ? 1 : ZOOM_CLICK_LEVEL);
});

galleryMainImgEl.addEventListener('dblclick', (e) => {
  e.preventDefault();
  e.stopPropagation();
  resetZoom();
});

galleryZoomResetBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resetZoom();
});

galleryMainWrapEl.addEventListener('wheel', (e) => {
  if (galleryMainImgEl.hidden) return;
  e.preventDefault();
  const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
  applyZoom(zoomScale + delta);
}, { passive: false });

galleryMainWrapEl.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    pinchStartDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
    pinchStartScale = zoomScale;
  }
}, { passive: true });

galleryMainWrapEl.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && pinchStartDistance) {
    e.preventDefault();
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
    applyZoom(pinchStartScale * (currentDistance / pinchStartDistance));
  }
}, { passive: false });

galleryMainWrapEl.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) pinchStartDistance = null;
});

async function showResults() {
  const realProperties = await fetchMatchingProperties();
  const isReal = realProperties.length > 0;
  const properties = isReal ? realProperties : buildMockProperties();

  resultsSubtitleEl.textContent = `Búsqueda: ${answers.operacion} · ${answers.zona || 'Rosario'}`;
  resultsGridEl.innerHTML = '';
  properties.forEach((property) => resultsGridEl.appendChild(buildPropertyCard(property, isReal)));
  resultsSectionEl.hidden = false;
  resultsSectionEl.scrollIntoView({ behavior: 'smooth' });
}

resultsRestartBtn.addEventListener('click', () => {
  resultsSectionEl.hidden = true;
  chatWidgetEl.scrollIntoView({ behavior: 'smooth' });
  startConversation();
});

function startConversation() {
  closePropertyModal();
  answers = {};
  queue = [initialStep];
  qIndex = 0;
  flowStepsSnapshot = [];
  summaryText = '';
  messagesEl.innerHTML = '';
  clearOptions();
  disableInput();
  editAreaEl.hidden = true;
  resultsSectionEl.hidden = true;
  resultsGridEl.innerHTML = '';
  askCurrent();
}

const heroCtaEl = document.getElementById('hero-cta');
heroCtaEl.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('chat').scrollIntoView({ behavior: 'smooth' });
  startConversation();
});
