# Estado del proyecto Propi — resumen para retomar en otra sesión

Plataforma inmobiliaria para Rosario y alrededores. Sitio estático (HTML/CSS/JS
vanilla, sin build ni framework) desplegado en **GitHub Pages**, con **Firebase**
como backend (Auth + Firestore + Storage).

- **Repo**: `https://github.com/santinovitulli-source/propi` (rama `main`)
- **Sitio en vivo**: `https://santinovitulli-source.github.io/propi/`
- **Proyecto Firebase**: `propi-5ccf9` (config real en `js/firebase-config.js`,
  el `apiKey` ahí **no es secreto**, es normal que esté público en el repo)
- **Carpeta local**: `C:\Users\Usuario\OneDrive\Desktop\propi`

## Cómo se prueban los cambios en esta máquina

No hay Node ni Python instalados. Para previsualizar localmente se usa un
mini servidor estático en PowerShell: `.tools/static-server.ps1`, registrado
en `.claude/launch.json` bajo el nombre `propi-static` (se levanta con la
herramienta de preview, sirviendo la carpeta en `http://localhost:5500`).

## Archivos del proyecto

```
index.html                  → landing pública (hero + chat + resultados + secciones informativas)
login.html                  → login de inmobiliarias (+ recuperar contraseña)
registro.html                → alta de inmobiliaria
verificar-email.html         → pantalla de "confirmá tu email" (post-registro / login sin verificar)
panel.html                   → panel privado de cada inmobiliaria (CRUD de propiedades)
admin.html                   → panel de administración de Propi (nuevo, protegido)
css/styles.css                → todos los estilos (una sola hoja, paleta navy/camel)
js/firebase-config.js        → init de Firebase (App/Auth/Firestore/Storage)
js/auth-guard.js             → requireAuth(): redirige a login.html si no hay sesión
js/auth-errors.js            → traducción de códigos de error de Firebase Auth a español
js/property-constants.js      → listas compartidas: OPERACIONES, TIPOS_PROPIEDAD, ZONAS, AMBIENTES, CONDICIONES
js/panel.js                   → lógica del panel de inmobiliaria (alta/edición/borrado de propiedades, fotos)
js/verify-email.js           → lógica de verificar-email.html
js/admin.js                   → lógica del panel de administración (nuevo)
js/chat.js                    → todo el chat conversacional + resultados + modal de detalle + galería/zoom
js/compatibility.js           → motor de puntaje de compatibilidad (función pura, sin DOM)
.tools/static-server.ps1      → servidor estático casero para preview local
.claude/launch.json           → config del preview local ("propi-static")
```

## Orden de la página principal
Hero (100vh, imagen de Unsplash con overlay navy) → Chat → Resultados (oculto
hasta buscar) → "Cómo funciona" → "Sobre Propi" → Footer. El chat **no arranca
solo**: arranca cuando se hace clic en "Empezar búsqueda" del hero.

---

## Decisiones de diseño y por qué

- **Paleta**: navy `#0C1C35` de fondo, camel `#C4955A` de acento. Tipografías:
  Cormorant Garamond (títulos) + Jost (texto), vía Google Fonts.
- **Chat conversacional simulado** (no es IA real): árbol de preguntas por
  código en `js/chat.js`, con animación de "escribiendo" (3 puntos) antes de
  cada mensaje del bot.
- **Tres flujos de búsqueda** distintos según operación:
  - **Alquilar**: tipo, zona, ambientes, precio mensual, personas, condiciones especiales.
  - **Comprar**: tipo, zona, personas, ambientes, presupuesto, condiciones, finalidad, características específicas.
  - **En pozo**: zona, ambientes, inversión/vivienda, plazo de estreno, presupuesto.
  Al terminar, el bot arma un resumen y ofrece **Confirmar y buscar / Editar
  el texto / Agregar más detalles** (este último vuelve a mostrar el resumen,
  es un loop).
- **Listas de valores compartidas** (para que matcheen entre lo que carga una
  inmobiliaria y lo que responde un usuario): Zonas = `Centro, Pichincha,
  Echesortu, Fisherton, Zona Sur` (+ "No estoy seguro" solo como respuesta de
  chat, significa "sin especificar"). Tipos = `Departamento, Casa, PH,
  Terreno, Local comercial`. Ambientes = `1, 2, 3, 4 o más`. Condiciones =
  `Acepta mascotas, Cochera, Accesibilidad`.

### Motor de compatibilidad (`js/compatibility.js`)
Reemplazó por completo los resultados ficticios. Puntaje 0-100 por propiedad
real contra las respuestas del usuario:
- **Zona** 30 pts (exacta 30, adyacente 15, distinta 0). Adyacencia definida
  a criterio propio (no hay dato real de distancias): `Centro↔Pichincha↔
  Echesortu↔Fisherton` en cadena, `Zona Sur` aislada.
- **Precio** 25 pts (dentro de presupuesto 25, hasta 10% arriba 15, 10-20% arriba 5, más 0).
- **Ambientes** 20 pts (exacto 20, diferencia 1 → 10, diferencia ≥2 → 0). "4 o más" se trata como valor 4 para la resta.
- **Tipo de propiedad** 15 pts (exacto 15, distinto 0).
- **Condiciones especiales** 10 pts, proporcional a cuántas de las pedidas cumple (si no pidió ninguna, 10 automático).
- Si el usuario no especificó un atributo (zona "No estoy seguro", o el flujo
  "En pozo" que no pregunta tipo/condiciones), ese peso se **redistribuye
  proporcionalmente** entre los atributos que sí se evaluaron.
- **Penalización aparte**: si el usuario pidió "Acepta mascotas" y la
  propiedad no lo ofrece, se restan 20 puntos del total (no proporcional).
- Etiquetas: 85-100 "Alta compatibilidad", 70-84 "Buena compatibilidad", 55-69 "Compatible".

### Resultados: siempre 4
`js/chat.js` trae todas las propiedades reales de la operación buscada, las
puntúa y ordena, y:
- Si hay **4 o más** candidatas → muestra las 4 de mayor puntaje (el umbral de
  55 deja de aplicar como filtro estricto; se usa solo para ordenar).
- Si hay **1 a 3** → muestra todas las que hay, con el aviso "Encontramos X
  propiedades que se ajustan a tu búsqueda en Rosario."
- Si hay **0** → muestra **4 propiedades de ejemplo ficticias** (barrios
  reales de Rosario, precio anclado al presupuesto buscado o a un valor por
  defecto razonable), claramente marcadas como "Ejemplo" / "Propiedad de
  ejemplo" (borde punteado camel). **Decisión importante**: los ejemplos
  *solo* aparecen con 0 reales, nunca tapan resultados reales aunque sean
  pocos — para no ocultarle propiedades genuinas a un usuario real.
  El modal de un ejemplo no tiene botón de WhatsApp real: tiene un CTA
  "¿Sos inmobiliaria? Registrá tus propiedades" que linkea a `registro.html`.

### Modal de detalle de propiedad
Al hacer clic en una tarjeta de resultado se abre un modal con:
- Galería navegable (foto grande, flechas, miniaturas clickeables, contador "n / total").
- **Zoom** sobre la foto principal: clic para alternar 1x/2x, rueda del mouse
  o pellizco (pinch) para ajustar (tope 4x), doble clic o botón "Restablecer
  zoom" para volver a 1x. `object-fit: contain` (no `cover`) para no recortar fotos.
- **Arrastre (pan)** cuando hay zoom activo: click-y-arrastrar con mouse, o
  un dedo en táctil. Cursor `grab`/`grabbing`. Cambiar de foto resetea zoom y posición.
- Debajo: precio grande destacado, badge de operación + badge de compatibilidad
  (o "Propiedad de ejemplo"), tipo/zona/ambientes, descripción completa,
  condiciones como chips, nombre **y WhatsApp** de la inmobiliaria.
- Botón grande camel **"Contactar por WhatsApp"**: abre `wa.me` **directo**,
  sin formulario intermedio, con el mensaje fijo *"Hola, vi esta propiedad en
  Propi y me interesa obtener más información"`. (Ver nota de historial más abajo.)
- Botón secundario "← Volver a los resultados" (además del botón × y de Escape/click afuera).
- Cierra con: botón ×, botón "volver", clic fuera del modal, o tecla Escape.

**Nota de historial**: al principio del proyecto el contacto pedía nombre y
teléfono en un formulario antes de abrir WhatsApp (para "capturar el lead").
Se **eliminó ese formulario** cuando el usuario pidió explícitamente que el
botón abra WhatsApp directo — quedó documentado como cambio de comportamiento
en su momento. Ya no se captura nombre/teléfono del visitante en ningún lado;
en cambio, cada clic en el botón registra un documento anónimo en la
colección `contactos` (sin datos del visitante) solo para poder contar
"contactos generados" en el panel de admin.

---

## Firebase: estructura de datos

**Colección `inmobiliarias`** (doc id = uid del usuario de Auth):
```
{ nombre, email, creadoEn: Timestamp, activo?: boolean }
```
`activo` es opcional; si no existe o es `true` la cuenta está activa. Si es
`false`, `panel.js` bloquea el acceso al panel (ver más abajo).

**Colección `propiedades`** (doc id autogenerado):
```
{
  inmobiliariaId, inmobiliariaNombre, operacion, tipoPropiedad, zona,
  ambientes, precio: number, whatsapp: string (crudo, ej "3411234567"),
  descripcion, condicionesEspeciales: string[],
  fotos: [{ url, path }],           // path en Storage, para poder borrarlas
  creadoEn, actualizadoEn?, activo?: boolean
}
```
`activo` opcional; `false` = "dada de baja" por el admin, se filtra de los
resultados del chat (`js/chat.js` hace el filtro **en el cliente**, no en la
query, para no requerir migrar documentos viejos).

**Colección `contactos`** (nueva, doc id autogenerado):
```
{ propiedadId, inmobiliariaId, creadoEn }
```
Solo escritura pública (cualquiera puede crear, nadie más lee/borra salvo el
admin). Se usa únicamente para el contador de "contactos generados".

**Storage**: fotos en `propiedades/{inmobiliariaId}/{propiedadId}/{uuid}-{nombre archivo}`.

## Reglas de seguridad actuales (viven solo en la consola de Firebase, no en el repo)

**Firestore** (publicadas):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'admin@propi.com';
    }

    match /inmobiliarias/{inmobiliariaId} {
      allow read: if request.auth != null && request.auth.uid == inmobiliariaId;
      allow create: if request.auth != null && request.auth.uid == inmobiliariaId;
      allow update: if request.auth != null && request.auth.uid == inmobiliariaId
                    && request.resource.data.activo == resource.data.activo;
      allow read, write: if isAdmin();
    }

    match /propiedades/{propiedadId} {
      allow read: if true;
      allow create: if request.auth != null && request.resource.data.inmobiliariaId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.inmobiliariaId == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    match /contactos/{contactoId} {
      allow create: if request.resource.data.keys().hasOnly(['propiedadId', 'inmobiliariaId', 'creadoEn']);
      allow read, delete: if isAdmin();
    }
  }
}
```

**Storage** (publicadas):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /propiedades/{inmobiliariaId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == inmobiliariaId
                   && request.resource.size < 8 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null && request.auth.token.email == 'admin@propi.com';
    }
  }
}
```

### ✅ Hueco de seguridad corregido (publicado 2026-08-26)
Se había probado (con la cuenta de test) que **una inmobiliaria podía escribir el
campo `activo` de su propio documento**, es decir, podría reactivarse a sí
misma después de que el admin la desactive (no había ningún botón en la
interfaz que hiciera esto, pero era posible manipulando Firestore directamente
desde la consola del navegador). El bloque `match /inmobiliarias/{...}` de
arriba ya tiene la corrección aplicada y publicada por el usuario en la
consola de Firebase: `update` ahora exige que `activo` no cambie, así que solo
`isAdmin()` puede tocarlo.
**Verificado en vivo (2026-08-26)**: logueado con la cuenta de test, desde la
consola del navegador (`import('/js/firebase-config.js')`), un cambio real de
`activo` (`true → false`) da `permission-denied` y el campo queda sin tocar;
editar `nombre` sin tocar `activo` sigue funcionando normalmente. Corrección
confirmada funcionando de punta a punta.

---

## Autenticación y verificación

- **Inmobiliarias**: `registro.html` crea el usuario + doc en `inmobiliarias`
  + envía email de verificación (`sendEmailVerification`) + redirige a
  `verificar-email.html` (no al panel directamente).
- `login.html` chequea `user.emailVerified`; si es `false` redirige a
  `verificar-email.html` en vez del panel. También tiene **recuperar
  contraseña** (`sendPasswordResetEmail`) con un mini-formulario inline que
  reemplaza el de login sin salir de la página.
- `verificar-email.html` / `js/verify-email.js`: muestra a qué email se
  mandó la verificación, botón "Ya verifiqué mi email" (hace
  `auth.currentUser.reload()` y recién ahí decide si dejar pasar al panel) y
  "Reenviar email de verificación".
- `panel.js` (`requireAuth`) hace **dos chequeos** antes de mostrar el panel:
  1. `user.emailVerified` (si no, → `verificar-email.html`)
  2. Lee `inmobiliarias/{uid}` y si `activo === false`, muestra un mensaje de
     "cuenta desactivada" en la misma página (oculta el resto del panel, no
     redirige) en vez de dejar entrar.
- **Diagnóstico ya hecho sobre "no llegan los emails de verificación"**: se
  confirmó que el código llama bien a `sendEmailVerification()` y que
  Firebase acepta el pedido (se reprodujo un `auth/too-many-requests` al
  reintentar rápido, lo cual prueba que el pedido SÍ llega a Firebase). La
  sospecha no descartada es que el plan gratuito (Spark) tiene un límite
  diario de emails de Auth y, entre tantas cuentas de prueba creadas durante
  el desarrollo, podría haberse tocado ese límite. **No se pudo verificar
  entrega real** porque no hay acceso a ninguna casilla de correo real desde
  este entorno — quedó pendiente que el usuario pruebe con un email propio.

- **Admin**: `admin.html` / `js/admin.js`. `ADMIN_EMAIL` está **hardcodeado**
  en `js/admin.js` (línea ~13) como `'admin@propi.com'` — tiene que coincidir
  exactamente con: (a) el usuario real creado a mano en Firebase Authentication
  (Authentication → Users → Add user, el usuario ya lo creó) y (b) el string
  usado en `isAdmin()` de las reglas de Firestore/Storage de arriba. Si
  alguna vez se cambia el email del admin, hay que actualizar los 3 lugares.
  El login de `admin.html` usa Firebase Auth normal + un chequeo de
  `user.email === ADMIN_EMAIL` en el cliente (la seguridad real la dan las
  reglas de Firestore/Storage, no este chequeo de UI).

---

## Panel de administración (`admin.html` / `js/admin.js`)

Resumen con 3 contadores (inmobiliarias, propiedades, contactos —
todos vía `getDocs` sobre la colección completa, sin paginar, suficiente para
la escala actual). Tabla de inmobiliarias (email, fecha de registro, cantidad
de propiedades, estado, botones Desactivar/Reactivar y Eliminar). Tabla de
propiedades (inmobiliaria, zona, precio, estado, botón Dar de baja/Reactivar).

- **"Desactivar" una inmobiliaria** = solo pone `activo: false` en su doc de
  Firestore; no toca su cuenta de Firebase Auth (sigue pudiendo autenticarse,
  pero `panel.js` la bloquea igual, ver arriba).
- **"Eliminar" una inmobiliaria** = borra su doc de `inmobiliarias` **y en
  cascada** todas sus `propiedades` (Firestore + fotos en Storage). **No
  borra la cuenta de Firebase Auth** (el client SDK no puede borrar cuentas
  ajenas, requeriría Cloud Functions con Admin SDK, que no existen en este
  proyecto) — si se quiere borrar de verdad esa cuenta, hay que hacerlo a
  mano desde Authentication → Users en la consola.
- **"Dar de baja" una propiedad** = toggle de `activo` (no la borra), la
  saca de los resultados del chat público hasta que se reactive.

### Lo que se probó y lo que no (importante para no repetir trabajo)
- ✅ Login de `admin.html` rechaza correctamente una cuenta que no es
  `admin@propi.com` (se probó con la cuenta de test real) y cierra esa sesión.
- ✅ Las reglas de Firestore bloquean a una inmobiliaria que intenta leer
  todas las inmobiliarias o tocar documentos ajenos (`permission-denied`).
- ✅ El campo `activo` en `inmobiliarias` y `propiedades` se lee/filtra
  correctamente donde corresponde (probado a nivel datos + lógica).
- ✅ El registro en `contactos` al tocar "Contactar por WhatsApp" no tira error.
- ❌ **No se probó el login real de admin ni el uso de los botones del
  dashboard** (Desactivar/Eliminar/Dar de baja) **con la cuenta admin real**,
  porque el asistente no tiene ni debe pedir esa contraseña. Falta que el
  usuario entre él mismo a `admin.html` y confirme que todo funciona.

---

## Cuentas de prueba que existen en el Firebase real (no son datos de producción)
- `test.inmobiliaria@propi-test.com` / `test123456` — cuenta de inmobiliaria
  de prueba, usada muchísimas veces durante el desarrollo. **Nunca fue
  verificada por email real** (no hay forma de simular el clic del link de
  verificación desde este entorno), así que hoy mismo quedaría bloqueada por
  el chequeo de `emailVerified` si se intenta entrar a `panel.html` por login
  normal. Para pruebas rápidas de datos se usó escritura directa a
  Firestore/Storage vía consola del navegador, evitando pasar por el gate de
  verificación.
- Otras cuentas de test creadas puntualmente durante distintas pruebas
  (registro, verificación de email, cross-tenant) fueron **borradas** al
  terminar cada prueba (tanto el usuario de Auth como su doc en Firestore).
- **Dato encontrado, no generado por el asistente**: en algún momento apareció
  en Firestore una propiedad real ("Casa en Centro", tipo Casa, 1 ambiente,
  **precio $1**, WhatsApp `3462610748`) con fotos reales subidas, de una
  cuenta que no es ninguna de las de prueba — parece cargada por el usuario
  real probando el panel en producción. **No se tocó** (no se puede borrar
  sin ser su dueño ni admin). Vale la pena que el usuario revise ese precio,
  probablemente un error de carga.

---

## Pendientes / próximos pasos posibles
1. **Usuario tiene que probar `admin.html` con su cuenta real** y confirmar
   que el dashboard funciona (stats, tablas, botones).
2. **Decidir si aplicar la corrección del hueco de seguridad** de `activo`
   en `inmobiliarias` (regla ya redactada arriba).
3. El usuario mencionó querer probar el envío real de emails de verificación
   con un email propio para descartar el tema de cuota/spam.
4. No hay logo real subible para inmobiliarias (se usa un avatar con la
   inicial del nombre) — si se quiere, es una función nueva a construir
   (upload a Storage + campo `logoUrl` en el doc de la inmobiliaria).
5. El WhatsApp de contacto general de Propi (`js/chat.js`, ya no se usa —
   se eliminó `PROPI_WHATSAPP_NUMBER` porque cada propiedad tiene su propio
   WhatsApp real cargado por la inmobiliaria; no queda ningún placeholder de
   número pendiente de reemplazo en el código).

## Convenciones a respetar si se sigue trabajando
- Siempre a**gregar `?v=N` (incrementando)** a los `<script src="js/chat.js?v=2">`
  y `<link href="css/styles.css?v=2">` si se cambia contenido y se quiere
  evitar caché vieja del navegador/CDN de GitHub Pages (patrón ya usado, hoy
  en `?v=2` en `index.html` y `panel.html`).
- Antes de tocar Firestore/Storage, revisar si el cambio necesita una regla
  nueva — publicarla en la consola de Firebase es un paso manual del usuario,
  no algo que el asistente pueda hacer por API.
- Después de cualquier cambio, probar en el navegador (preview local) antes
  de pushear, y limpiar cualquier dato de prueba (propiedades, cuentas)
  creado durante la prueba.
- `git add` + `commit` + `push` solo cuando el usuario lo pide explícitamente
  (así se trabajó en toda la conversación, un commit por feature).
