/**
 * @fileoverview Configuración global de Jest para todos los tests del backend.
 * Aumenta el timeout predeterminado a 30s para acomodar la inicialización
 * de MongoMemoryServer en entornos lentos (CI/CD, máquinas con pocos recursos).
 */
jest.setTimeout(30000);
