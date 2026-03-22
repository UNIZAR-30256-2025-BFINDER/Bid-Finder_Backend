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
