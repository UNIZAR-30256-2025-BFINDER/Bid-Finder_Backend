/**
 * @fileoverview Controlador para la autenticación.
 * Gestiona las peticiones HTTP de registro, login y renovación de tokens.
 */

/**
 * Crea el controlador de autenticación inyectando su servicio correspondiente.
 * @param {Object} authService - Servicio que contiene la lógica de negocio de autenticación.
 * @returns {Object} Métodos del controlador (register, login, refreshToken).
 */
function createAuthController(authService) {

    /**
     * Maneja la petición de registro de un nuevo usuario.
     * @param {Object} req - Objeto de petición de Express.
     * @param {Object} res - Objeto de respuesta de Express.
     * @param {Function} next - Función para delegar errores al middleware global.
     */
    const register = async (req, res, next) => {
        try {
            const result = await authService.registrarUsuario(req.body);
            
            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Maneja la petición de inicio de sesión de un usuario existente.
     * @param {Object} req - Objeto de petición de Express.
     * @param {Object} res - Objeto de respuesta de Express.
     * @param {Function} next - Función para delegar errores al middleware global.
     */
    const login = async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                const error = new Error('Por favor, proporciona email y contraseña');
                error.statusCode = 400;
                throw error;
            }

            const result = await authService.loginUsuario(email, password);
            
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Maneja la petición para renovar un JWT de acceso caducado usando un Refresh Token.
     * @param {Object} req - Objeto de petición de Express.
     * @param {Object} res - Objeto de respuesta de Express.
     * @param {Function} next - Función para delegar errores al middleware global.
     */
    const refreshToken = async (req, res, next) => {
        try {
            const { refreshToken } = req.body; 
            const tokens = await authService.renovarToken(refreshToken);
            
            res.status(200).json({
                success: true,
                data: tokens
            });
        } catch (error) {
            next(error);
        }
    };

    return {
        register,
        login,
        refreshToken
    };
}

module.exports = createAuthController;