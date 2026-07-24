const MESSAGES = {
  'auth/email-already-in-use': 'Ese email ya está registrado. Iniciá sesión en vez de crear una cuenta nueva.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/weak-password': 'La contraseña tiene que tener al menos 6 caracteres.',
  'auth/user-not-found': 'No encontramos una cuenta con ese email.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/too-many-requests': 'Demasiados intentos. Probá de nuevo en unos minutos.',
};

export function translateAuthError(error) {
  return MESSAGES[error.code] || 'Ocurrió un error. Intentá de nuevo.';
}
