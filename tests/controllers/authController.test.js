const createAuthController = require('../../app_server/controllers/authController');

describe('Auth Controller', () => {
    let authServiceMock;
    let authController;
    let req;
    let res;
    let next;

    beforeEach(() => {
        authServiceMock = {
            registrarUsuario: jest.fn(),
            loginUsuario: jest.fn(),
            renovarToken: jest.fn()
        };

        authController = createAuthController(authServiceMock);

        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe('register', () => {
        it('debe devolver 201 y los datos del usuario si el registro es exitoso', async () => {
            req.body = { nombre: 'Test', email: 'test@test.com', password: '123' };
            const fakeResult = { email: 'test@test.com', accessToken: 'token' };
            authServiceMock.registrarUsuario.mockResolvedValue(fakeResult);

            await authController.register(req, res, next);

            expect(authServiceMock.registrarUsuario).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: fakeResult });
            expect(next).not.toHaveBeenCalled();
        });

        it('debe llamar a next(error) si falla el registro', async () => {
            const error = new Error('Error al registrar');
            authServiceMock.registrarUsuario.mockRejectedValue(error);

            await authController.register(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('login', () => {
        it('debe devolver 400 si falta email o password', async () => {
            req.body = { email: 'test@test.com' }; // Falta password

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalled();
            const err = next.mock.calls[0][0];
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe('Por favor, proporciona email y contraseña');
        });

        it('debe devolver 200 y tokens si el login es exitoso', async () => {
            req.body = { email: 'test@test.com', password: '123' };
            const fakeResult = { email: 'test@test.com', accessToken: 'token' };
            authServiceMock.loginUsuario.mockResolvedValue(fakeResult);

            await authController.login(req, res, next);

            expect(authServiceMock.loginUsuario).toHaveBeenCalledWith('test@test.com', '123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: fakeResult });
        });

        it('debe llamar a next(error) si falla el login en el servicio', async () => {
            req.body = { email: 'test@test.com', password: '123' };
            const error = new Error('Credenciales inválidas');
            authServiceMock.loginUsuario.mockRejectedValue(error);

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('refreshToken', () => {
        it('debe devolver 200 y los nuevos tokens si la renovación es exitosa', async () => {
            req.body = { refreshToken: 'oldToken' };
            const fakeTokens = { accessToken: 'newAccess', refreshToken: 'newRefresh' };
            authServiceMock.renovarToken.mockResolvedValue(fakeTokens);

            await authController.refreshToken(req, res, next);

            expect(authServiceMock.renovarToken).toHaveBeenCalledWith('oldToken');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: fakeTokens });
        });

        it('debe llamar a next(error) si la renovación falla', async () => {
            req.body = { refreshToken: 'oldToken' };
            const error = new Error('Token inválido');
            authServiceMock.renovarToken.mockRejectedValue(error);

            await authController.refreshToken(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});