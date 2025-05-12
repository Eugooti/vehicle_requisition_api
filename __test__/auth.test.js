const { authHandlers } = require('../handlers/authHandler/index');
const crypto = require('crypto');

jest.mock('../utils/errorHandlers', () => ({
    handleErrors: jest.fn((res, err) => res.status(500).json({ error: err.message })),
    itemNotFound: jest.fn((res, type) => res.status(404).json({ message: `${type} not found` })),
    successTransaction: jest.fn((res, action, data, message) =>
        res.status(200).json({ action, data, message }))
}));

jest.mock('../models/user.model', () => ({
    findOne: jest.fn(),
    findByPk: jest.fn()
}));

jest.mock('../models/roles.model', () => ({
    findAll: jest.fn()
}));

jest.mock('../models/signatures.model', () => ({
    findOne: jest.fn()
}));

jest.mock('../config/auth/passportConfig', () => ({
    authenticate: jest.fn()
}));

jest.mock('../config/auth/JWT/jwtTokens', () => ({
    JwtTokens: jest.fn(() => ({
        generateAccessToken: jest.fn(),
        generateRefreshToken: jest.fn(),
        generateRandomCode: jest.fn(() => '123456'),
        generatePasswordResetToken: jest.fn(() => 'mock-token')
    }))
}));

jest.mock('../handlers/MailHandler/MailHandler', () => ({
    MailHandler: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn()
}));

jest.mock('crypto', () => {
    const originalCrypto = jest.requireActual('crypto');
    const mockBuffer = Buffer.from('salt');
    // Mock the toString method to return 'salt' when called with 'hex'
    mockBuffer.toString = jest.fn(encoding => encoding === 'hex' ? 'salt' : mockBuffer.toString(encoding));
    return {
        ...originalCrypto,
        randomBytes: jest.fn().mockReturnValue(mockBuffer),
        createHash: jest.fn().mockImplementation(() => ({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn().mockReturnValue('hashed-password')
        }))
    };
});

describe('Auth Handlers', () => {
    let mockReq, mockRes, mockNext, auth;

    // Clean up after all tests
    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            body: {},
            params: {},
            session: {
                destroy: jest.fn((callback) => callback(null)),
                ID: 'mock-session-id'
            },
            login: jest.fn((user, callback) => callback(null)),
            secure: true,
            cookies: {
                refreshToken: 'mock-refresh-token'
            },
            headers: {
                authorization: 'Bearer mock-refresh-token'
            },
            sessionID: 'mock-session-id'
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn(),
            cookie: jest.fn(),
            clearCookie: jest.fn()
        };

        mockNext = jest.fn();
        auth = authHandlers();
    });

    describe('Password Reset', () => {
        describe('getCode', () => {
            it('should generate and send reset code', async () => {
                mockReq.body = { email: 'test@example.com' };
                require('../models/user.model').findOne.mockResolvedValue({ id: 1, email: 'test@example.com' });

                await auth.getCode(mockReq, mockRes);

                expect(require('../utils/errorHandlers').successTransaction)
                    .toHaveBeenCalledWith(mockRes, null, { token: 'mock-token' }, 'OTP has been sent to your email');
            });

            it('should handle user not found', async () => {
                mockReq.body = { email: 'nonexistent@example.com' };
                require('../models/user.model').findOne.mockResolvedValue(null);

                await auth.getCode(mockReq, mockRes);

                expect(require('../utils/errorHandlers').itemNotFound)
                    .toHaveBeenCalledWith(mockRes, 'User');
            });

            it('should handle email sending failure', async () => {
                const { MailHandler } = require('../handlers/MailHandler/MailHandler');
                MailHandler.mockResolvedValueOnce({ success: false });

                mockReq.body = { email: 'test@example.com' };
                require('../models/user.model').findOne.mockResolvedValue({ id: 1, email: 'test@example.com' });

                await auth.getCode(mockReq, mockRes);

                expect(require('../utils/errorHandlers').handleErrors)
                    .toHaveBeenCalledWith(mockRes, expect.any(Error));
            });
        });

        describe('verifyResetCode', () => {
            it('should verify valid reset code', async () => {
                mockReq.body = { token: 'valid-token', code: '123456' };
                require('jsonwebtoken').verify.mockImplementation((token, secret, callback) => {
                    callback(null, { code: '123456' });
                });

                await auth.verifyResetCode(mockReq, mockRes);

                expect(require('../utils/errorHandlers').successTransaction)
                    .toHaveBeenCalledWith(mockRes, null, { code: '123456' }, 'Recovery code successfully verified');
            });

            it('should reject missing token or code', async () => {
                mockReq.body = {};

                await auth.verifyResetCode(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
                expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token or Code Not Found' });
            });

            it('should reject invalid token', async () => {
                mockReq.body = { token: 'invalid-token', code: '123456' };
                require('jsonwebtoken').verify.mockImplementation((token, secret, callback) => {
                    callback(new Error('Invalid token'), null);
                });

                await auth.verifyResetCode(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
                expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid token Provided.' });
            });

            it('should reject invalid code', async () => {
                mockReq.body = { token: 'valid-token', code: 'wrong-code' };
                require('jsonwebtoken').verify.mockImplementation((token, secret, callback) => {
                    callback(null, { code: '123456' });
                });

                await auth.verifyResetCode(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(404);
                expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid code' });
            });
        });

        describe('changePassword', () => {
            it('should successfully change password', async () => {
                mockReq.params = { id: '1' };
                mockReq.body = { newPassword: 'new-password' };

                const mockUser = {
                    id: 1,
                    save: jest.fn().mockResolvedValue(true)
                };

                require('../models/user.model').findByPk.mockResolvedValue(mockUser);

                await auth.changePassword(mockReq, mockRes);

                // Verify crypto methods were called correctly
                expect(crypto.randomBytes).toHaveBeenCalled();
                expect(crypto.createHash).toHaveBeenCalled();

                // Verify user was saved
                expect(mockUser.save).toHaveBeenCalled();
                expect(mockUser.password).toBe('hashed-password');
                expect(mockUser.salt).toBe('salt');

                // Verify success response
                expect(require('../utils/errorHandlers').successTransaction)
                    .toHaveBeenCalledWith(mockRes, 'updated', mockUser);
            });

            it('should handle user not found', async () => {
                mockReq.params = { id: '999' };
                require('../models/user.model').findByPk.mockResolvedValue(null);

                await auth.changePassword(mockReq, mockRes);

                expect(require('../utils/errorHandlers').itemNotFound)
                    .toHaveBeenCalledWith(mockRes, 'User');
            });
        });
    });

    describe('Update Password', () => {
        it('should successfully update password', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = { password: 'correct-password', newPassword: 'new-password' };

            const mockUser = {
                id: 1,
                password: 'hashed-correct-password',
                salt: 'salt',
                save: jest.fn().mockResolvedValue(true)
            };

            // Mock the user model
            const mockModel = {
                findByPk: jest.fn().mockResolvedValue(mockUser)
            };

            // Create a new auth handler with the mock model
            const authWithModel = authHandlers(mockModel);

            // First hash for password verification
            crypto.createHash.mockImplementationOnce(() => ({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('hashed-correct-password')
            }));

            // Second hash for a new password
            crypto.createHash.mockImplementationOnce(() => ({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('hashed-new-password')
            }));

            await authWithModel.updatePassword(mockReq, mockRes);

            // Verify model was called correctly
            expect(mockModel.findByPk).toHaveBeenCalledWith('1');

            // Verify crypto methods were called correctly
            expect(crypto.randomBytes).toHaveBeenCalled();
            expect(crypto.createHash).toHaveBeenCalledTimes(2);

            // Verify the user was updated and saved
            expect(mockUser.password).toBe('hashed-new-password');
            expect(mockUser.salt).toBe('salt');
            expect(mockUser.save).toHaveBeenCalled();

            // Verify success response
            expect(require('../utils/errorHandlers').successTransaction)
                .toHaveBeenCalledWith(mockRes, 'updated', mockUser);
        });

        it('should reject incorrect current password', async () => {
            mockReq.params = { id: '1' };
            mockReq.body = { password: 'wrong-password', newPassword: 'new-password' };

            const mockUser = {
                id: 1,
                password: 'hashed-correct-password',
                salt: 'salt',
                save: jest.fn()
            };

            // Mock the user model
            const mockModel = {
                findByPk: jest.fn().mockResolvedValue(mockUser)
            };

            // Create a new auth handler with the mock model
            const authWithModel = authHandlers(mockModel);

            // Simulate incorrect password
            crypto.createHash.mockImplementationOnce(() => ({
                update: jest.fn().mockReturnThis(),
                digest: jest.fn().mockReturnValue('wrong-hash')
            }));

            await authWithModel.updatePassword(mockReq, mockRes);

            // Verify model was called correctly
            expect(mockModel.findByPk).toHaveBeenCalledWith('1');

            // Verify crypto methods were called correctly
            expect(crypto.createHash).toHaveBeenCalledTimes(1);

            // Verify the user was not saved
            expect(mockUser.save).not.toHaveBeenCalled();

            // Verify error response
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Passwords do not match.'
            });
        });

        it('should handle user not found', async () => {
            mockReq.params = { id: '999' };
            mockReq.body = { password: 'password', newPassword: 'new-password' };

            // Mock the user model
            const mockModel = {
                findByPk: jest.fn().mockResolvedValue(null)
            };

            // Create a new auth handler with the mock model
            const authWithModel = authHandlers(mockModel);

            await authWithModel.updatePassword(mockReq, mockRes);

            // Verify model was called correctly
            expect(mockModel.findByPk).toHaveBeenCalledWith('999');

            // Verify error response
            expect(require('../utils/errorHandlers').itemNotFound)
                .toHaveBeenCalledWith(mockRes, 'User');
        });
    });

    describe('Login', () => {
        it('should login successfully', async () => {
            // Mock user data
            const mockUser = {
                id: 1,
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                departmentId: 1,
                designation: 'Developer',
                phone: '1234567890'
            };

            // Mock roles and signature
            const mockRoles = [
                { userId: 1, role: 'admin' },
                { userId: 1, role: 'user' }
            ];
            const mockSignature = { userId: 1, signature: 'test-signature' };

            // Mock authentication success
            require('../config/auth/passportConfig').authenticate = jest.fn((strategy, callback) => {
                return (req, res, next) => {
                    callback(null, mockUser, null);
                };
            });

            // Mock roles and signature retrieval
            require('../models/roles.model').findAll.mockResolvedValue(mockRoles);
            require('../models/signatures.model').findOne.mockResolvedValue(mockSignature);

            // Mock token generation
            const mockTokens = require('../config/auth/JWT/jwtTokens').JwtTokens;
            mockTokens.mockImplementation(() => ({
                generateAccessToken: jest.fn().mockReturnValue('mock-auth-token'),
                generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token')
            }));

            await auth.login(mockReq, mockRes, mockNext);

            // Verify authentication was called
            expect(require('../config/auth/passportConfig').authenticate).toHaveBeenCalledWith('local', expect.any(Function));

            // Verify login was called
            expect(mockReq.login).toHaveBeenCalled();

            // Verify roles and signature were fetched
            expect(require('../models/roles.model').findAll).toHaveBeenCalledWith({ where: { userId: 1 } });
            expect(require('../models/signatures.model').findOne).toHaveBeenCalledWith({ where: { userId: 1 } });

            // Verify tokens were generated
            expect(mockTokens).toHaveBeenCalled();

            // Verify headers and cookies were set
            expect(mockRes.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer mock-auth-token');
            expect(mockRes.setHeader).toHaveBeenCalledWith('RefreshToken', 'Bearer mock-refresh-token');
            expect(mockRes.cookie).toHaveBeenCalledTimes(3);

            // Verify success response
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Login successful',
                user: expect.any(Object),
                authorization: expect.any(Object)
            }));
        });

        it('should handle user not found', async () => {
            // Mock authentication failure - user not found
            require('../config/auth/passportConfig').authenticate = jest.fn((strategy, callback) => {
                return (req, res, next) => {
                    callback(null, null, { message: 'User not found' });
                };
            });

            await auth.login(mockReq, mockRes, mockNext);

            // Verify authentication was called
            expect(require('../config/auth/passportConfig').authenticate).toHaveBeenCalledWith('local', expect.any(Function));

            // Verify error response
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found'
            });
        });

        it('should handle authentication error', async () => {
            // Mock authentication error
            const mockError = new Error('Authentication error');
            require('../config/auth/passportConfig').authenticate = jest.fn((strategy, callback) => {
                return (req, res, next) => {
                    callback(mockError, null, null);
                };
            });

            await auth.login(mockReq, mockRes, mockNext);

            // Verify authentication was called
            expect(require('../config/auth/passportConfig').authenticate).toHaveBeenCalledWith('local', expect.any(Function));

            // Verify next was called with error
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });

        it('should handle login error', async () => {
            // Mock user data
            const mockUser = { id: 1 };

            // Mock authentication success but login failure
            require('../config/auth/passportConfig').authenticate = jest.fn((strategy, callback) => {
                return (req, res, next) => {
                    callback(null, mockUser, null);
                };
            });

            // Mock login error
            const mockError = new Error('Login error');
            mockReq.login.mockImplementationOnce((user, callback) => callback(mockError));

            await auth.login(mockReq, mockRes, mockNext);

            // Verify authentication was called
            expect(require('../config/auth/passportConfig').authenticate).toHaveBeenCalledWith('local', expect.any(Function));

            // Verify login was called
            expect(mockReq.login).toHaveBeenCalled();

            // Verify next was called with error
            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('Logout', () => {
        it('should logout successfully', async () => {
            await auth.logout(mockReq, mockRes);

            // Verify session was destroyed
            expect(mockReq.session.destroy).toHaveBeenCalled();

            // Verify cookies were cleared
            expect(mockRes.clearCookie).toHaveBeenCalledWith('authToken');
            expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken');
            expect(mockRes.clearCookie).toHaveBeenCalledWith('sessionCookie');

            // Verify success response
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
        });

        it('should handle session destruction error', async () => {
            // Mock session destruction error
            const mockError = new Error('Session destruction error');
            mockReq.session.destroy.mockImplementationOnce((callback) => callback(mockError));

            await auth.logout(mockReq, mockRes);

            // Verify session was destroyed
            expect(mockReq.session.destroy).toHaveBeenCalled();

            // Verify error response
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logout failed' });
        });
    });

    describe('Refresh Token', () => {
        it('should refresh token successfully', async () => {
            // Mock JWT verify success
            require('jsonwebtoken').verify.mockImplementation((token, secret, callback) => {
                callback(null, { id: 1, email: 'test@example.com' });
            });

            // Mock token generation
            const mockTokens = require('../config/auth/JWT/jwtTokens').JwtTokens;
            mockTokens.mockImplementation(() => ({
                generateAccessToken: jest.fn().mockReturnValue('new-auth-token')
            }));

            await auth.refreshToken(mockReq, mockRes);

            // Verify JWT was called
            expect(require('jsonwebtoken').verify).toHaveBeenCalled();

            // Verify token was generated
            expect(mockTokens).toHaveBeenCalled();

            // Verify header and cookie were set
            expect(mockRes.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer new-auth-token');
            expect(mockRes.cookie).toHaveBeenCalledWith('authToken', 'new-auth-token', expect.any(Object));

            // Verify success response
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access token refreshed', authToken: 'new-auth-token' });
        });

        it('should handle missing refresh token', async () => {
            // Mock missing refresh token
            mockReq.cookies.refreshToken = null;
            mockReq.headers.authorization = null;

            await auth.refreshToken(mockReq, mockRes);

            // Verify error response
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Refresh token not found, login again' });
        });

        it('should handle invalid refresh token', async () => {
            // Mock JWT verify failure
            const mockError = new Error('Invalid token');
            require('jsonwebtoken').verify.mockImplementation((token, secret, callback) => {
                callback(mockError, null);
            });

            await auth.refreshToken(mockReq, mockRes);

            // Verify JWT was called
            expect(require('jsonwebtoken').verify).toHaveBeenCalled();

            // Verify error response
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid refresh token' });
        });
    });
});
