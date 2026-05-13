const { isAdmin } = require('../../app_server/middlewares/authMiddleware');

describe('Middleware isAdmin', () => {
    let req, res, next;

    beforeEach(() => {
        req = { user: { id: 'user123', rol: '' } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('debería llamar a next() si el usuario es administrador', async () => {
        req.user.rol = 'admin';

        await isAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('debería responder 403 si el usuario no es administrador', async () => {
        req.user.rol = 'user';

        await isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: expect.stringContaining('privilegios de administrador')
        }));
    });

    it('debería responder 403 si el rol no está definido en el token', async () => {
        req.user.rol = undefined;

        await isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
    });
});