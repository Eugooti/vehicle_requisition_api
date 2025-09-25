const { CreateUser } = require('../handlers/userHandlers/CreateUser');
const { ReadUsers, readUsersByRole } = require('../handlers/userHandlers/readUsers');
const { handleErrors, successTransaction, notFound } = require('../utils/errorHandlers');
const { Op } = require('sequelize');

// Mock the error handlers
jest.mock('../utils/errorHandlers', () => ({
    handleErrors: jest.fn(),
    successTransaction: jest.fn(),
    notFound: jest.fn()
}));

// Mock the models
jest.mock('../models/roles.model', () => ({
    bulkCreate: jest.fn(),
    findAll: jest.fn()
}));

jest.mock('../models/signatures.model', () => ({
    create: jest.fn()
}));

jest.mock('../models/user.model', () => ({
    findAll: jest.fn()
}));

jest.mock('../models/departments.model', () => ({
    findAll: jest.fn()
}));

// Mock crypto
jest.mock('crypto', () => {
    const originalCrypto = jest.requireActual('crypto');
    return {
        ...originalCrypto,
        randomBytes: jest.fn().mockReturnValue(Buffer.from('mocksalt')),
        createHash: jest.fn().mockImplementation(() => ({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn().mockReturnValue('hashedpassword')
        }))
    };
});

describe('User Functions', () => {
    let mockModel, mockReq, mockRes, mockTransaction, mockSequelize;

    // Clean up after all tests
    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock transaction
        mockTransaction = {
            commit: jest.fn().mockResolvedValue(),
            rollback: jest.fn().mockResolvedValue()
        };

        // Setup mock sequelize
        mockSequelize = {
            transaction: jest.fn().mockResolvedValue(mockTransaction)
        };

        // Setup mock model
        mockModel = {
            create: jest.fn(),
            sequelize: mockSequelize
        };

        // Setup mock request
        mockReq = {
            body: {
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                phone: '1234567890',
                grade: 'A',
                designation: 'Developer',
                departmentId: 1,
                roles: ['admin', 'user'],
                sign: 'test-signature'
            },
            params: {}
        };

        // Setup mock response
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('CreateUser Function', () => {
        it('should create a user successfully', async () => {
            const mockCreatedUser = { 
                id: 1, 
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User'
            };

            mockModel.create.mockResolvedValue(mockCreatedUser);
            require('../models/signatures.model').create.mockResolvedValue({ id: 1 });
            require('../models/roles.model').bulkCreate.mockResolvedValue([{ id: 1 }, { id: 2 }]);

            await CreateUser(mockModel, mockReq, mockRes);

            // Verify user creation
            expect(mockModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'test@example.com',
                    password: expect.any(String),
                    salt: expect.any(String)
                }),
                { transaction: mockTransaction }
            );

            // Verify signature creation
            expect(require('../models/signatures.model').create).toHaveBeenCalledWith(
                {
                    signature: 'test-signature',
                    userId: 1
                },
                { transaction: mockTransaction }
            );

            // Verify roles creation
            expect(require('../models/roles.model').bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        role: expect.any(String),
                        userId: 1,
                        departmentId: 1
                    })
                ]),
                { transaction: mockTransaction }
            );

            // Verify transaction was committed
            expect(mockTransaction.commit).toHaveBeenCalled();

            // Verify success response
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'created');
        });

        it('should add applicant role if not included', async () => {
            const mockCreatedUser = { id: 1 };
            mockReq.body.roles = ['admin']; // No applicant role

            mockModel.create.mockResolvedValue(mockCreatedUser);
            require('../models/signatures.model').create.mockResolvedValue({ id: 1 });
            require('../models/roles.model').bulkCreate.mockResolvedValue([{ id: 1 }, { id: 2 }]);

            await CreateUser(mockModel, mockReq, mockRes);

            // Verify roles creation includes applicant
            expect(require('../models/roles.model').bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ role: 'admin' }),
                    expect.objectContaining({ role: 'applicant' })
                ]),
                { transaction: mockTransaction }
            );
        });

        it('should handle errors and rollback transaction', async () => {
            const mockError = new Error('Creation failed');
            mockModel.create.mockRejectedValue(mockError);

            await CreateUser(mockModel, mockReq, mockRes);

            // Verify transaction was rolled back
            expect(mockTransaction.rollback).toHaveBeenCalled();

            // Verify error handling
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });

    describe('ReadUsers Function', () => {
        it('should read and format all users successfully', async () => {
            const mockUsers = [
                { 
                    id: 1, 
                    firstName: 'Test', 
                    lastName: 'User', 
                    email: 'test@example.com',
                    designation: 'Developer',
                    departmentId: 1,
                    phone: '1234567890',
                    available: true
                },
                { 
                    id: 2, 
                    firstName: 'Jane', 
                    lastName: 'Doe', 
                    email: 'jane@example.com',
                    designation: 'Manager',
                    departmentId: 2,
                    phone: '0987654321',
                    available: false
                }
            ];

            const mockDepartments = [
                { id: 1, name: 'IT' },
                { id: 2, name: 'HR' }
            ];

            require('../models/user.model').findAll.mockResolvedValue(mockUsers);
            require('../models/departments.model').findAll.mockResolvedValue(mockDepartments);

            await ReadUsers(mockReq, mockRes);

            // Verify user and department data was fetched
            expect(require('../models/user.model').findAll).toHaveBeenCalled();
            expect(require('../models/departments.model').findAll).toHaveBeenCalled();

            // Verify success response with formatted data
            expect(successTransaction).toHaveBeenCalledWith(
                mockRes, 
                'read', 
                expect.arrayContaining([
                    expect.objectContaining({
                        fullName: 'Test User',
                        email: 'test@example.com',
                        department: 'IT'
                    }),
                    expect.objectContaining({
                        fullName: 'Jane Doe',
                        email: 'jane@example.com',
                        department: 'HR'
                    })
                ])
            );
        });

        it('should handle errors when reading users', async () => {
            const mockError = new Error('Read failed');
            require('../models/user.model').findAll.mockRejectedValue(mockError);

            await ReadUsers(mockReq, mockRes);

            // Verify error handling
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });

    describe('readUsersByRole Function', () => {
        it('should read users by role successfully', async () => {
            mockReq.params.role = 'admin';

            const mockRoles = [
                { userId: 1, role: 'admin' },
                { userId: 2, role: 'admin' }
            ];

            const mockUsers = [
                { id: 1, firstName: 'Test', lastName: 'User' },
                { id: 2, firstName: 'Jane', lastName: 'Doe' }
            ];

            require('../models/roles.model').findAll.mockResolvedValue(mockRoles);
            require('../models/user.model').findAll.mockResolvedValue(mockUsers);

            await readUsersByRole(mockReq, mockRes);

            // Verify roles were fetched by the specified role
            expect(require('../models/roles.model').findAll).toHaveBeenCalledWith({
                where: { role: 'admin' }
            });

            // Verify users were fetched by their IDs
            expect(require('../models/user.model').findAll).toHaveBeenCalledWith({
                where: { id: { [Op.in]: [1, 2] } }
            });

            // Verify success response with formatted data
            expect(successTransaction).toHaveBeenCalledWith(
                mockRes, 
                'read', 
                expect.arrayContaining([
                    expect.objectContaining({
                        id: 1,
                        name: 'Test User'
                    }),
                    expect.objectContaining({
                        id: 2,
                        name: 'Jane Doe'
                    })
                ])
            );
        });

        it('should handle no roles found', async () => {
            mockReq.params.role = 'nonexistent';
            require('../models/roles.model').findAll.mockResolvedValue([]);

            await readUsersByRole(mockReq, mockRes);

            // Verify not found response
            expect(notFound).toHaveBeenCalledWith(mockRes, 'No roles found');
        });

        it('should handle errors when reading users by role', async () => {
            mockReq.params.role = 'admin';
            const mockError = new Error('Read failed');
            require('../models/roles.model').findAll.mockRejectedValue(mockError);

            await readUsersByRole(mockReq, mockRes);

            // Verify error handling
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });
});
