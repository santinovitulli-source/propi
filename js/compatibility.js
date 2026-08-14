// Motor de compatibilidad: compara las respuestas del usuario contra una
// propiedad real y devuelve un puntaje de 0 a 100.
//
// Pesos: Zona 30, Precio 25, Ambientes 20, Tipo de propiedad 15, Condiciones especiales 10.
// Si un atributo no fue especificado por el usuario, no penaliza: su peso se
// redistribuye proporcionalmente entre los atributos que sí se evaluaron.
// Penalización aparte: si el usuario pidió "Acepta mascotas" y la propiedad
// no lo ofrece, se restan 20 puntos del total (no es proporcional).

const WEIGHTS = { zona: 30, precio: 25, ambientes: 20, tipo: 15, condiciones: 10 };
const MASCOTAS_PENALTY = 20;

// Adjacencia simplificada entre zonas de Rosario para el puntaje "zona adyacente".
const ZONA_ADYACENTE = {
  Centro: ['Pichincha'],
  Pichincha: ['Centro', 'Echesortu'],
  Echesortu: ['Pichincha', 'Fisherton'],
  Fisherton: ['Echesortu'],
  'Zona Sur': [],
};

const AMBIENTES_VALOR = { '1': 1, '2': 2, '3': 3, '4 o más': 4 };

export function parseAmount(text) {
  const digits = (text || '').replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : null;
}

function parseCondicionesSolicitadas(raw) {
  return (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s !== 'Ninguna en particular');
}

// Cada función de puntaje devuelve `null` cuando el usuario no especificó
// ese atributo (para que se excluya del cálculo y se redistribuya su peso).

function scoreZona(propertyZona, userZona) {
  if (!userZona || userZona === 'No estoy seguro') return null;
  if (propertyZona === userZona) return WEIGHTS.zona;
  if ((ZONA_ADYACENTE[userZona] || []).includes(propertyZona)) return WEIGHTS.zona / 2;
  return 0;
}

function scorePrecio(propertyPrecio, userBudget) {
  if (!userBudget) return null;
  const precio = Number(propertyPrecio) || 0;
  if (precio <= userBudget) return WEIGHTS.precio;
  const excedente = (precio - userBudget) / userBudget;
  if (excedente <= 0.10) return 15;
  if (excedente <= 0.20) return 5;
  return 0;
}

function scoreAmbientes(propertyAmbientes, userAmbientes) {
  const propioValor = AMBIENTES_VALOR[propertyAmbientes];
  const buscadoValor = AMBIENTES_VALOR[userAmbientes];
  if (propioValor === undefined || buscadoValor === undefined) return 0;
  const diferencia = Math.abs(propioValor - buscadoValor);
  if (diferencia === 0) return WEIGHTS.ambientes;
  if (diferencia === 1) return 10;
  return 0;
}

function scoreTipo(propertyTipo, userTipo) {
  if (!userTipo) return null;
  return propertyTipo === userTipo ? WEIGHTS.tipo : 0;
}

function scoreCondiciones(propertyCondiciones, condicionesSolicitadas) {
  if (condicionesSolicitadas.length === 0) return WEIGHTS.condiciones;
  const propias = new Set(propertyCondiciones || []);
  const cumplidas = condicionesSolicitadas.filter((c) => propias.has(c)).length;
  return (cumplidas / condicionesSolicitadas.length) * WEIGHTS.condiciones;
}

export function computeCompatibilityScore(property, answers) {
  const rawBudget = answers.operacion === 'Alquilar' ? answers.precioMensual : answers.presupuesto;
  const userBudget = parseAmount(rawBudget);
  const condicionesSolicitadas = parseCondicionesSolicitadas(answers.condicionEspecial);

  const categorias = [
    { peso: WEIGHTS.zona, puntos: scoreZona(property.zona, answers.zona) },
    { peso: WEIGHTS.precio, puntos: scorePrecio(property.precio, userBudget) },
    { peso: WEIGHTS.ambientes, puntos: scoreAmbientes(property.ambientes, answers.ambientes) },
    { peso: WEIGHTS.tipo, puntos: scoreTipo(property.tipoPropiedad, answers.tipoPropiedad) },
    { peso: WEIGHTS.condiciones, puntos: scoreCondiciones(property.condicionesEspeciales, condicionesSolicitadas) },
  ];

  const aplicables = categorias.filter((c) => c.puntos !== null);
  const pesoTotal = aplicables.reduce((sum, c) => sum + c.peso, 0);
  const puntosGanados = aplicables.reduce((sum, c) => sum + c.puntos, 0);

  let total = pesoTotal > 0 ? (puntosGanados / pesoTotal) * 100 : 0;

  if (condicionesSolicitadas.includes('Acepta mascotas')) {
    const propias = new Set(property.condicionesEspeciales || []);
    if (!propias.has('Acepta mascotas')) {
      total -= MASCOTAS_PENALTY;
    }
  }

  return Math.max(0, Math.min(100, Math.round(total)));
}

export function compatibilityLabel(score) {
  if (score >= 85) return 'Alta compatibilidad';
  if (score >= 70) return 'Buena compatibilidad';
  return 'Compatible';
}
