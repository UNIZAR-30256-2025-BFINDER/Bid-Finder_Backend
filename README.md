# BidFinder - Backend

Este repositorio contiene el código fuente del backend para **BidFinder**, la plataforma que centraliza, procesa y visualiza subastas del BOE utilizando Inteligencia Artificial.

El objetivo de esta API es ingerir datos de fuentes públicas (XML del BOE), procesar texto no estructurado mediante modelos de IA (NLP) y servir información estructurada y geolocalizada al frontend.

---

## 1. Stack Tecnológico y Calidad de Código

Para mantener la consistencia y calidad en el equipo, utilizamos las siguientes herramientas obligatorias:

- **Runtime:** Node.js (versión 22).
- **Framework:** Express.js.
- **Linting & Formatting:**
- **ESLint:** Para asegurar reglas de código y evitar errores lógicos.
- **Prettier:** Para unificar el formato visual (comillas, espacios, etc.).
- **Husky:** Hooks de Git que ejecutan el linter antes de cada commit (`pre-commit`) para asegurar que no se sube código "sucio".

---

## 2. Convenciones de Código (Coding Standards)

Es fundamental seguir estas reglas para que el código sea uniforme entre todos los desarrolladores:

### 2.1 Definición de Variables

- Usa **`const`** por defecto para todo (imports, funciones, objetos).
- Usa **`let`** únicamente si la variable va a ser reasignada (contadores, acumuladores).
- 🚫 **Prohibido** usar `var`.

### 2.2 Módulos

Utilizamos **ES Modules** nativos de Node.js.

- ✅ `import express from 'express';`
- ✅ `export const myController = ...;`
- 🚫 No usar `require()` ni `module.exports`.

### 2.3 Asincronía y Manejo de Errores

- Usa siempre **`async` / `await**` para operaciones asíncronas (BBDD, llamadas a IA).
- Evita el "Callback Hell" o cadenas infinitas de `.then()`.
- Envuelve la lógica de los controladores en bloques **`try / catch`**.

### 2.4 Naming Conventions (Nombres)

| Elemento                  | Convención                          | Ejemplo                                |
| ------------------------- | ----------------------------------- | -------------------------------------- |
| **Variables y Funciones** | `camelCase`                         | `getUserById`, `auctionList`           |
| **Clases y Modelos**      | `PascalCase`                        | `AuctionModel`, `UserSchema`           |
| **Constantes Globales**   | `UPPER_SNAKE_CASE`                  | `MAX_RETRY_ATTEMPTS`, `API_KEY`        |
| **Archivos**              | `snake_case` (kebab con barra baja) | `user_controller.js`, `boe_service.js` |
| **Rutas (Endpoints)**     | `kebab-case`                        | `/api/v1/active-auctions`              |

---

## 3. Estructura del Proyecto

Organizamos el código siguiendo una **Arquitectura de Capas** para separar responsabilidades:

```text
src/
├─ app.js                 # Configuración de Express y middlewares globales
├─ server.js              # Punto de entrada (arranca el servidor y BBDD)
├─ config/                # Variables de entorno y configs (DB, OpenAI, etc.)
├─ controllers/           # Lógica de entrada/salida (Request -> Response)
│  └─ controller_controller.js
├─ services/              # Lógica de negocio pura (IA, Scraper, Cálculos)
│  └─ service_service.js
├─ models/                # Esquemas de Base de Datos
│  └─ Model.js
├─ routes/                # Definición de endpoints y unión con controllers
│  └─ auction_routes.js
├─ middlewares/           # Funciones intermedias (Auth, Validaciones, Errores)
│  └─ auth_middleware.js
└─ utils/                 # Helpers, loggers, formateadores

```

### Descripción de carpetas:

- **`controllers/`**: Solo se encargan de recibir la `req` (petición), llamar al servicio correspondiente y devolver la `res` (respuesta) o pasar el error al middleware (`next`). No deben tener lógica compleja.
- **`services/`**: Contienen la lógica de negocio, llamadas a la API de IA, cálculos de riesgo, etc. Son agnósticos de HTTP (no reciben `req/res`).
- **`models/`**: Definición de esquemas de datos (ODM/ORM).
- **`middlewares/`**: Código que se ejecuta antes del controlador (ej: verificar si el usuario es admin, validar que el body del JSON es correcto).

---

## 4. Flujo de Trabajo (GitFlow + Scrum)

Trabajamos con una metodología ágil. El ciclo de vida de una funcionalidad es: **Análisis -> Implementación -> Pruebas -> Integración**.

### 4.1 Ramas Principales

- **`main`**: Código en producción. Estable.
- **`develop`**: Rama de integración. Aquí se mezclan las funcionalidades terminadas.

### 4.2 Pasos para desarrollar una funcionalidad

1. **Actualiza tu rama develop:**

```bash
git checkout develop
git pull origin develop

```

2. **Crea una rama para tu funcionalidad (Feature Branch):**
   Usa el prefijo `feature/` seguido de una descripción corta en kebab-case.

```bash
git checkout -b feature/ingesta-boe

```

3. **Desarrollo (Ciclo iterativo):**

- Implementa el código siguiendo las convenciones.
- Crea tests unitarios para tu servicio.
- _Commits:_ Haz commits pequeños y descriptivos. Husky verificará el estilo automáticamente.

4. **Pruebas Locales:**
   Asegúrate de que todo funciona y pasan los tests (`npm test`).
5. **Pull Request (Integración):**

- Sube tu rama: `git push origin feature/ingesta-boe`.
- Abre un **Pull Request (PR)** hacia `develop`.
- **Code Review:** Otro compañero debe revisar tu código.

6. **Merge y Testing de Integración:**
   Una vez aprobado, se hace merge a `develop`. Se deben ejecutar pruebas de integración para asegurar que el código nuevo no rompió nada existente.
   Con cada integracion a la rama develop se ejecutara el CI CD

---

## 5. Ejemplo de Código

Así debería ser un **Controlador** (`src/controllers/auction_controller.js`) siguiendo nuestras normas:

```javascript
import * as auctionService from "../services/auction_service.js";

// Función en camelCase, archivo en snake_case
export const getAuctionById = async (req, res, next) => {
    try {
        const { id } = req.params; // Destructuring

        // Llamada al servicio con await
        const auction = await auctionService.findAuction(id);

        if (!auction) {
            return res.status(404).json({ message: "Subasta no encontrada" });
        }

        // Respuesta exitosa
        res.status(200).json(auction);
    } catch (error) {
        // Manejo de errores centralizado
        next(error);
    }
};
```

---

## 6. Setup Local (Cómo arrancar)

1. **Clonar repositorio:**

```bash
git clone https://github.com/ORGANIZACION/bidfinder-backend.git
cd bidfinder-backend

```

2. **Instalar dependencias:**

```bash
npm install

```

3. **Configurar entorno:**
   Copia el archivo de ejemplo y rellena las claves.

```bash
cp .env.example .env

```

4. **Ejecutar en desarrollo:**

```bash
npm run dev

```

## 7. Ingesta Automática de Subastas del BOE

El proceso de ingesta automática se encarga de descargar los archivos XML del BOE, extraer la información relevante, procesarla con IA para estructurarla y almacenarla en la base de datos. Este proceso se ejecuta periódicamente (ej: cada hora) mediante un cron job.

### Flujo de Ingesta:

1. **Descarga de XML:**
    - Se accede a la URL del BOE donde se publican los archivos XML de subastas.
    - Se descargan los archivos nuevos que no hayan sido procesados previamente.

2. **Extracción de Datos:**
    - Se parsean los archivos XML para extraer campos relevantes como título, descripción, fecha de publicación, fecha de cierre, ubicación, etc.

3. **Procesamiento con IA:**
    - Se utiliza un modelo de NLP para analizar la descripción y extraer información adicional como categorías, palabras clave, riesgos potenciales, etc.

4. **Almacenamiento en Base de Datos:**
    - La información estructurada se guarda en la base de datos para ser consultada posteriormente por el frontend.

### Configuración del Cron Job:

El cron job se configura en el archivo `bin/setup-cron.js`. Aquí se define la hora de ejecución y la función que se encargará de realizar el proceso de ingesta.

Este fichero se encarga de arrancar el cron job al iniciar el servidor, asegurando que el proceso de ingesta se ejecute automáticamente sin intervención manual. Llama al job definido en `jobs/boeIngestionJob.js`, que contiene la lógica para descargar, procesar y almacenar las subastas del BOE.

Tambien se ha creado otro script que se encarga de eliminar el cron job, este se encuentra en `bin/remove-cron.js` y se puede ejecutar para eliminar el cron job configurado previamente.

Todo esto ha sido añadido al package.json para facilitar su ejecución mediante npm scripts, que serán descritos a continuación.

2. **Ejecutar el script de configuración del cron job:**
   Este comando añadirá el cron job a tu sistema, programando la ejecución periódica del proceso de ingesta.

```bash
npm setup-cron

```

3. **Verificar que el cron job está activo:**
   Puedes revisar los logs para confirmar que el proceso de ingesta se ejecuta correctamente en el horario configurado.
   Con este comando tambien puedes editar el cron jod tu directamente y configurar la hora a tu conveniencia.

```bash
crontab -e

```

4. **Eliminar el cron job (opcional):**
   Si deseas eliminar el cron job en algún momento, puedes ejecutar el siguiente comando:

```bash
npm remove-cron

```

### Extracción de Información del XML

El XML de subasta del BOE contiene varios campos, pero los más relevantes para nuestro proceso de ingesta son:

- `<identificador>`: Un identificador único para cada subasta.
- `<titulo>`: El título de la subasta.
- `<fecha_publicacion>`: La fecha en que se publicó la subasta.
- `<url_pdf>`: La URL relativa al PDF del anuncio.
- `<texto>`: El contenido textual completo de la subasta, que puede contener múltiples párrafos.

## Estructura de datos intermedia (JSON)

Tras el parseo de un XML de subasta del BOE, se genera un objeto JSON con la siguiente estructura:

| Campo              | Tipo   | Descripción                                                                                                                            |
| ------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | string | Identificador único de la subasta, extraído del campo `<identificador>` del XML. Ejemplo: `"BOE-B-2026-112"`.                          |
| `titulo`           | string | Título de la subasta, tomado del campo `<titulo>`.                                                                                     |
| `fechaPublicacion` | string | Fecha de publicación en formato `YYYYMMDD`, extraída de `<fecha_publicacion>`.                                                         |
| `urlPdf`           | string | URL relativa al PDF del anuncio, extraída de `<url_pdf>`.                                                                              |
| `texto`            | string | Contenido textual completo de la subasta, concatenando todos los párrafos (`<p>`) dentro de `<texto>`. Se separan con saltos de línea. |

## Ejemplo de objeto generado

```json
{
    "id": "BOE-B-2026-112",
    "titulo": "U.R. SUBASTAS ANDALUCIA 41",
    "fechaPublicacion": "20260103",
    "urlPdf": "/boe/dias/2026/01/03/pdfs/BOE-B-2026-112.pdf",
    "texto": "Anuncio de subasta administrativa de la Agencia Estatal de Administración Tributaria, con número de referencia S2025R4186001497.\nDirección electrónica: https://subastas.boe.es/ds.php?id=SUB-AT-2025-25R4186001497\nFecha de inicio de la subasta: La subasta se iniciará en la fecha indicada a través de la dirección electrónica anterior.\nSevilla, 29 de diciembre de 2025.- Jefe del Equipo Regional de Recaudación"
}
```

## ALmacenamiento en la base de datos MongoDB

## Colección `subastas`

| Campo              | Tipo   | Descripción                                                                    |
| ------------------ | ------ | ------------------------------------------------------------------------------ |
| `id`               | string | Identificador único del anuncio en el BOE (ej: `BOE-B-2026-112`). Clave única. |
| `titulo`           | string | Título de la subasta.                                                          |
| `fechaPublicacion` | string | Fecha de publicación en formato `YYYYMMDD`.                                    |
| `urlPdf`           | string | URL relativa al PDF del anuncio.                                               |
| `texto`            | string | Texto completo de la subasta (párrafos concatenados con `\n`).                 |
| `rawXml`           | string | XML original recibido del BOE.                                                 |
| `fechaExtraccion`  | date   | Marca de tiempo de cuándo se guardó la subasta por primera vez.                |
| `createdAt`        | date   | Fecha de creación del documento (automática).                                  |
| `updatedAt`        | date   | Fecha de última actualización (automática).                                    |

## Índices

- `id`: índice único (por defecto en MongoDB)
- `fechaPublicacion`: índice descendente para ordenar por fecha.

## Operaciones de guardado

- `saveSubastas` (servicio) realiza un `bulkWrite` con `upsert` basado en el campo `id`, garantizando idempotencia.

## 8. Módulos y Dependencias del Backend 

Para la construcción del backend se han seleccionado las siguientes dependencias clave, priorizando el rendimiento, la seguridad y la mantenibilidad:

* **express:** Framework principal para levantar el servidor HTTP y gestionar el enrutamiento y los middlewares de forma ágil.
* **mongoose:** ODM (Object Data Modeling) para MongoDB. Permite definir esquemas estrictos, validaciones y relaciones, facilitando la interacción con la base de datos.
* **winston:** Sistema de logging profesional. Permite registrar eventos (info, error) con marcas de tiempo, clave para la monitorización en producción y depuración.
* **jsonwebtoken & bcryptjs:** El estándar de la industria para la seguridad. `bcryptjs` hashea las contraseñas para no guardarlas en texto plano, y `jsonwebtoken` gestiona la autenticación sin estado mediante JWT.
* **fast-xml-parser:** Librería ultrarrápida elegida específicamente para convertir los feeds XML diarios del BOE a formato JSON manejable por la aplicación.
* **@google/generative-ai & axios:** `axios` actúa como cliente HTTP para consumir APIs externas (BOE y Groq), mientras que el SDK oficial de Google permite integrar el modelo Gemini 2.5 Flash para la extracción de información estructurada.
* **swagger-jsdoc & swagger-ui-express:** Herramientas para autogenerar y servir la documentación interactiva de la API basada en las especificaciones OpenAPI.
* **jest & supertest:** Entorno de testing. `jest` para pruebas unitarias y `supertest` para simular peticiones HTTP en las pruebas de integración de la API.

---

## 9. Limitaciones Conocidas

Durante el desarrollo y pruebas de BidFinder, se han identificado las siguientes limitaciones:

1. **Campos vacíos por la política de la IA:** Para evitar alucinaciones (invención de datos), se ha configurado la IA mediante un prompt estricto. Si el XML del BOE no especifica claramente un dato (ej. el valor de tasación o las cargas previas), la IA lo deja nulo. El frontend está preparado para gestionar esto indicando "No disponible", pero limita la capacidad de filtrado numérico en algunas subastas.
2. **Dependencia estructural del BOE:** El scraper (`xmlParserService`) depende de la estructura actual de los feeds XML del Boletín Oficial del Estado. Si el BOE realiza un rediseño de sus etiquetas XML, el servicio de ingesta requerirá una actualización.
3. **Rate Limits de APIs Gratuitas:** Al utilizar los tiers gratuitos de los proveedores de IA, procesos masivos de ingesta histórica (Seeding) pueden verse interrumpidos si se superan las peticiones por minuto permitidas por Google o Groq. 

---

## 10. Puntos de Mejora y Trabajo Futuro

Si el proyecto continuara su desarrollo, las principales áreas de mejora arquitectónica y funcional serían:

1. **Sistema de Alertas por Email:** Implementar un cron job secundario (ej. usando `Nodemailer`) que envíe un resumen diario a los usuarios con las nuevas subastas que encajen en sus criterios de búsqueda guardados.
2. **Caché con Redis:** Añadir una capa de caché en memoria para el endpoint de `/api/v1/estadisticas`. Dado que los cálculos analíticos son costosos, cachearlos reduciría la carga en MongoDB.
3. **Ampliación de Fuentes de Datos:** Extender el patrón *Strategy* del proceso de ingesta para soportar no solo el BOE, sino también el Portal de Subastas de la Seguridad Social y portales autonómicos.

## 11. Documentación de Testing (Backend)

Se ha implementado una estrategia de pruebas exhaustiva utilizando **Jest** como motor de ejecución y **Supertest** para las pruebas de integración de la API. La cobertura global de código supera el **90%**.

### Resumen de Pruebas Realizadas

| Categoría | Herramientas | Componentes Probados | Estado |
| :--- | :--- | :--- | :--- |
| **Pruebas Unitarias** | Jest | **Controladores:** Auth, Subastas, Comentarios, Estadísticas, Ingesta.<br>**Servicios:** Lógica de negocio, integración con proveedores de IA (Gemini/Groq), Geolocalización.<br>**Repositorios:** Consultas directas a MongoDB mediante `MongoMemoryServer`. | ✅ 100% Pasadas |
| **Pruebas de Integración** | Supertest | **API / Rutas:** Validación de endpoints, gestión de códigos HTTP (200, 201, 400, 404, 500) y flujo de cabeceras JWT. | ✅ 100% Pasadas |
| **Pruebas de Concurrencia** | Jest | **Lógica de Favoritos:** Simulación de inserciones masivas simultáneas para validar la integridad de la base de datos (`$addToSet`). | ✅ 100% Pasadas |
| **Middlewares y Jobs** | Jest | **Seguridad:** Validación de roles (admin/user) y protección de rutas.<br>**Automatización:** Verificación de lógica de los Cron Jobs de ingesta diaria. | 100% Pasadas |

### Identificación y Resolución de Problemas (Troubleshooting)

Durante la fase de validación se identificaron y documentaron los siguientes puntos:

1. **Deprecación de Opciones de Mongoose:** Se identificaron avisos de Node sobre la opción `new` en `findOneAndUpdate`. 
   * **Solución:** Se documentó para futura actualización a `returnDocument: 'after'`, aunque la funcionalidad actual es correcta y exitosa.

## 12. Despliegue y Arquitectura en Producción

El backend y la base de datos están alojados en proveedores Cloud (PaaS/DBaaS) con un pipeline de Integración y Despliegue Continuo (CI/CD) configurado mediante GitHub Actions:

* **Backend (Render):** Hospedaje de la API REST Node.js/Express. Se despliega automáticamente tras pasar con éxito los tests del linter y Jest en GitHub Actions.
* **Base de Datos (MongoDB Atlas):** Clúster gestionado en la nube para garantizar la persistencia y disponibilidad de los datos.

### Limitaciones del Entorno Gratuito (Free Tier)
* **Hibernación (Cold Start) en Render:** Al estar alojado en la capa gratuita, el servidor backend entra en hibernación tras 30 minutos de inactividad. La primera petición tras este periodo puede tardar entre 30 y 60 segundos en responder mientras la instancia se levanta. Las peticiones posteriores funcionarán a velocidad normal.
* **Limitación de Almacenamiento:** MongoDB Atlas proporciona un clúster gratuito con un límite de 512MB, lo cual restringe la cantidad de histórico masivo de subastas que se puede almacenar a largo plazo.

## 13. Accesos y Documentación Viva

El sistema se encuentra accesible de forma pública, y la documentación OpenAPI (Swagger) puede consultarse e interactuar en vivo en:

* **Documentación Interactiva (Swagger API):** [https://bid-finder-backend.onrender.com/api-docs/](https://bid-finder-backend.onrender.com/api-docs/)

*(Nota: Cabe destacar que, por seguridad, nuestra política de CORS restringe las peticiones a la URL del frontend tanto de producción como desarrollo)*

## 14. Carga de Datos Inicial (Seeding)

Aunque el sistema utiliza un cron job para la ingesta diaria, es posible realizar una carga de datos inicial (Startup) para poblar la base de datos en un entorno en blanco o para demostraciones.

Disponemos de un script manual de "Seeding" que descarga el histórico hacia atrás y encola las tareas para ser procesadas por la IA. Se ejecuta desde la raíz del backend indicando los días de histórico que se desean extraer:

```bash
# Ejemplo: Extraer subastas de los últimos 3 días
node app_server/jobs/seedingJob.js 3