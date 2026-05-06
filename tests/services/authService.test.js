const jwt = require('jsonwebtoken');
const Usuario = require('../../app_server/models/usuario');
const authService = require('../../app_server/services/authService');

jest.mock('jsonwebtoken');
jest.mock('../../app_server/models/usuario');

describe('Auth Service', () => {
    beforeAll(() => {
        process.env.JWT_SECRET = 'secret';
        process.env.JWT_REFRESH_SECRET = 'refresh_secret';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registrarUsuario', () => {
        it('debe lanzar error 400 si el usuario ya existe', async () => {
            Usuario.findOne.mockResolvedValue({ email: 'test@test.com' });

            await expect(authService.registrarUsuario({ email: 'test@test.com' }))
                .rejects.toThrow('Ya existe un usuario con ese correo electrónico');
        });

        it('debe crear un usuario, generar tokens y devolver el objeto correcto', async () => {
            Usuario.findOne.mockResolvedValue(null);
            
            const mockUsuario = {
                _id: 'user123',
                nombre: 'Test',
                email: 'test@test.com',
                rol: 'user',
                save: jest.fn().mockResolvedValue(true)
            };
            Usuario.create.mockResolvedValue(mockUsuario);
            
            jwt.sign.mockReturnValueOnce('access123').mockReturnValueOnce('refresh123');

            const result = await authService.registrarUsuario({
                nombre: 'Test', email: 'test@test.com', password: '123'
            });

            expect(Usuario.create).toHaveBeenCalled();
            expect(mockUsuario.save).toHaveBeenCalled();
            expect(mockUsuario.refreshToken).toBe('refresh123');
            expect(result).toEqual({
                _id: 'user123',
                nombre: 'Test',
                email: 'test@test.com',
                rol: 'user',
                accessToken: 'access123',
                refreshToken: 'refresh123'
            });
        });
    });

    describe('loginUsuario', () => {
        it('debe lanzar error 401 si el usuario no existe', async () => {
            Usuario.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            await expect(authService.loginUsuario('fake@test.com', '123'))
                .rejects.toThrow('Credenciales inválidas');
        });

        it('debe lanzar error 401 si la contraseña es incorrecta', async () => {
            const mockUsuario = { matchPassword: jest.fn().mockResolvedValue(false) };
            Usuario.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUsuario)
            });

            await expect(authService.loginUsuario('test@test.com', 'wrong'))
                .rejects.toThrow('Credenciales inválidas');
        });

        it('debe hacer login exitoso y generar nuevos tokens', async () => {
            const mockUsuario = {
                _id: 'user123',
                nombre: 'Test',
                email: 'test@test.com',
                rol: 'user',
                matchPassword: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true)
            };
            Usuario.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUsuario)
            });
            jwt.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');

            const result = await authService.loginUsuario('test@test.com', '123');

            expect(mockUsuario.save).toHaveBeenCalled();
            expect(result.accessToken).toBe('access_token');
            expect(result.email).toBe('test@test.com');
        });
    });

    describe('renovarToken', () => {
        it('debe lanzar error si no se proporciona refresh token', async () => {
            await expect(authService.renovarToken(null))
                .rejects.toThrow('Refresh token no proporcionado');
        });

        it('debe lanzar error 401 si jwt.verify falla (token falso o expirado)', async () => {
            jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });

            await expect(authService.renovarToken('bad_token'))
                .rejects.toThrow('Refresh token expirado o inválido');
        });

        it('debe lanzar error 401 si el usuario no existe o el token no coincide en BD', async () => {
            jwt.verify.mockReturnValue({ id: 'user123' });
            
            const mockUsuario = { refreshToken: 'other_token_in_db' };
            Usuario.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUsuario)
            });

            await expect(authService.renovarToken('old_token'))
                .rejects.toThrow('Refresh token expirado o inválido');
        });

        it('debe generar nuevos tokens si el refresh token es válido', async () => {
            jwt.verify.mockReturnValue({ id: 'user123' });
            
            const mockUsuario = {
                _id: 'user123',
                refreshToken: 'valid_old_token',
                save: jest.fn().mockResolvedValue(true)
            };
            Usuario.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUsuario)
            });
            
            jwt.sign.mockReturnValueOnce('new_access').mockReturnValueOnce('new_refresh');

            const result = await authService.renovarToken('valid_old_token');

            expect(mockUsuario.save).toHaveBeenCalled();
            expect(mockUsuario.refreshToken).toBe('new_refresh');
            expect(result).toEqual({ accessToken: 'new_access', refreshToken: 'new_refresh' });
        });
    });
});