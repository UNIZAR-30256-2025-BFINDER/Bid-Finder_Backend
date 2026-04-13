const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const Usuario = require('../../app_server/models/usuario');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    process.env.JWT_SECRET = 'test_secret';
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Pruebas de Seguridad de Autenticación (PB-15 Tarea 6)', () => {
    
    it('Debe guardar la contraseña encriptada (NUNCA en texto plano)', async () => {
        const passwordPlana = 'MiPasswordSuperSegura123';
        
        const usuario = await Usuario.create({
            nombre: 'Seguridad Test',
            email: 'seguridad@test.com',
            password: passwordPlana
        });

        const usuarioDB = await Usuario.findById(usuario._id).select('+password');

        expect(usuarioDB.password).not.toBe(passwordPlana);
        expect(usuarioDB.password).toMatch(/^\$2[ab]\$/);
    });

    it('Debe detectar un token caducado y denegar acceso', () => {
        const tokenExpirado = jwt.sign({ id: '123' }, process.env.JWT_SECRET, { expiresIn: '-1s' });

        expect(() => {
            jwt.verify(tokenExpirado, process.env.JWT_SECRET);
        }).toThrow(jwt.TokenExpiredError);
    });
});