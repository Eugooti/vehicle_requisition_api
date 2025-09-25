const { TravelHandlers } = require('../handlers/travelHandlers/index');
const { CreateRequisition } = require('../handlers/travelHandlers/createRequisition');
const { readRequisitionsByDepartment, readAllRequisition } = require('../handlers/travelHandlers/ReadRequisition');
const { approve } = require('../handlers/travelHandlers/approve');
const { handleErrors, successTransaction, notFound } = require('../utils/errorHandlers');
const { Op } = require('sequelize');

// Mock the error handlers
jest.mock('../utils/errorHandlers', () => ({
    handleErrors: jest.fn(),
    successTransaction: jest.fn(),
    notFound: jest.fn(),
    itemNotFound: jest.fn()
}));

// Mock the models
jest.mock('../models/Trip.model', () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    sequelize: {
        transaction: jest.fn()
    }
}));

jest.mock('../models/user.model', () => ({
    findAll: jest.fn(),
    findByPk: jest.fn()
}));

jest.mock('../models/departments.model', () => ({
    findAll: jest.fn()
}));

jest.mock('../models/roles.model', () => ({
    findAll: jest.fn()
}));

// Mock the mail handler
jest.mock('../handlers/MailHandler/MailHandler', () => {
    const mockMailHandler = jest.fn().mockResolvedValue({ success: true });
    return { MailHandler: mockMailHandler };
});

// Mock the SMS handler
jest.mock('../handlers/MailHandler/SMSHandler', () => {
    const mockSMSHandler = jest.fn().mockResolvedValue({ success: true });
    return { SMSHandler: mockSMSHandler };
});

// Import mocked modules at the top level
const { MailHandler } = require('../handlers/MailHandler/MailHandler');
const { SMSHandler } = require('../handlers/MailHandler/SMSHandler');

describe('Travel Requisition Functions', () => {
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
            rollback: jest.fn().mockResolvedValue(),
            finished: false
        };

        // Setup mock sequelize
        mockSequelize = {
            transaction: jest.fn().mockResolvedValue(mockTransaction)
        };

        // Setup mock model
        mockModel = {
            create: jest.fn(),
            findAll: jest.fn(),
            findByPk: jest.fn(),
            sequelize: mockSequelize
        };

        // Setup mock request
        mockReq = {
            body: {
                userId: 1,
                departmentId: 1,
                purpose: 'Business Meeting',
                pickupPoint: 'Office',
                destination: 'Client Site',
                travellersCount: 2,
                pickupDate: '2025-05-01',
                pickupTime: '09:00:00',
                returnDate: '2025-05-02',
                returnTime: '18:00:00',
                numberOfDays: 2
            },
            params: {
                id: '1'
            }
        };

        // Setup mock response
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Mock Trip.model.sequelize
        require('../models/Trip.model').sequelize = mockSequelize;
    });

    describe('CreateRequisition Function', () => {
        it('should create a requisition successfully', async () => {
            const mockCreatedTrip = { 
                id: 1,
                ...mockReq.body
            };

            require('../models/Trip.model').create.mockResolvedValue(mockCreatedTrip);

            const mockManagerRoles = [
                { userId: 2, departmentId: 1, role: 'manager' },
                { userId: 3, departmentId: 1, role: 'manager' }
            ];

            const mockManagers = [
                { id: 2, email: 'manager1@example.com' },
                { id: 3, email: 'manager2@example.com' }
            ];

            require('../models/roles.model').findAll.mockResolvedValue(mockManagerRoles);
            require('../models/user.model').findAll.mockResolvedValue(mockManagers);

            await CreateRequisition(mockReq, mockRes);

            // Verify trip creation
            expect(require('../models/Trip.model').create).toHaveBeenCalledWith(
                mockReq.body,
                { transaction: mockTransaction }
            );

            // Verify manager roles were fetched
            expect(require('../models/roles.model').findAll).toHaveBeenCalledWith({
                where: {
                    [Op.and]: [
                        { departmentId: 1 },
                        { role: 'manager' }
                    ]
                },
                raw: true
            });

            // Verify managers were fetched
            expect(require('../models/user.model').findAll).toHaveBeenCalledWith({
                where: {
                    id: { [Op.in]: [2, 3] }
                }
            });

            // Verify email was sent
            expect(MailHandler).toHaveBeenCalledWith(
                ['manager1@example.com', 'manager2@example.com'],
                'Requisition Approval Requests',
                'You have a new requisition approval request.'
            );

            // Verify transaction was committed
            expect(mockTransaction.commit).toHaveBeenCalled();

            // Verify success response
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'created');
        });

        it('should handle email sending failure', async () => {
            require('../models/Trip.model').create.mockResolvedValue({ id: 1 });

            const mockManagerRoles = [{ userId: 2, departmentId: 1, role: 'manager' }];
            const mockManagers = [{ id: 2, email: 'manager@example.com' }];

            require('../models/roles.model').findAll.mockResolvedValue(mockManagerRoles);
            require('../models/user.model').findAll.mockResolvedValue(mockManagers);

            // Mock email failure
            MailHandler.mockResolvedValueOnce({ success: false });

            await CreateRequisition(mockReq, mockRes);

            // Verify transaction was rolled back
            expect(mockTransaction.rollback).toHaveBeenCalled();

            // Verify error handling
            expect(handleErrors).toHaveBeenCalledWith(mockRes, expect.any(Error));
        });

        it('should handle errors and rollback transaction', async () => {
            const mockError = new Error('Creation failed');
            require('../models/Trip.model').create.mockRejectedValue(mockError);

            await CreateRequisition(mockReq, mockRes);

            // Verify transaction was rolled back
            expect(mockTransaction.rollback).toHaveBeenCalled();

            // Verify error handling
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });

    describe('readRequisitionsByDepartment Function', () => {
        it('should read requisitions by department successfully', async () => {
            mockReq.params.id = '1';

            const mockUsers = [
                { id: 1, firstName: 'Test', lastName: 'User' },
                { id: 2, firstName: 'Jane', lastName: 'Doe' }
            ];

            const mockTrips = [
                { 
                    id: 1, 
                    userId: 1,
                    pickupDate: '2025-05-01',
                    pickupPoint: 'Office',
                    destination: 'Client Site',
                    travellersCount: 2,
                    purpose: 'Business Meeting',
                    approvalStatus: 'Pending'
                },
                { 
                    id: 2, 
                    userId: 2,
                    pickupDate: '2025-05-03',
                    pickupPoint: 'Home',
                    destination: 'Conference Center',
                    travellersCount: 1,
                    purpose: 'Conference',
                    approvalStatus: 'Approved'
                }
            ];

            require('../models/user.model').findAll.mockResolvedValue(mockUsers);
            require('../models/Trip.model').findAll.mockResolvedValue(mockTrips);

            await readRequisitionsByDepartment(mockReq, mockRes);

            // Verify trips were fetched by department
            expect(require('../models/Trip.model').findAll).toHaveBeenCalledWith({
                where: { departmentId: '1' }
            });

            // Verify success response with formatted data
            expect(successTransaction).toHaveBeenCalledWith(
                mockRes, 
                'read', 
                expect.arrayContaining([
                    expect.objectContaining({
                        fullName: 'Test User',
                        destination: 'Client Site',
                        id: 1
                    }),
                    expect.objectContaining({
                        fullName: 'Jane Doe',
                        destination: 'Conference Center',
                        id: 2
                    })
                ])
            );
        });

        it('should handle errors when reading requisitions by department', async () => {
            const mockError = new Error('Read failed');
            require('../models/user.model').findAll.mockRejectedValue(mockError);

            await readRequisitionsByDepartment(mockReq, mockRes);

            // Verify error handling
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });

    describe('readAllRequisition Function', () => {
        it('should read all requisitions successfully', async () => {
            const mockUsers = [
                { id: 1, firstName: 'Test', lastName: 'User', designation: 'Developer', phone: '1234567890' },
                { id: 2, firstName: 'Jane', lastName: 'Doe', designation: 'Manager', phone: '0987654321' }
            ];

            const mockTrips = [
                { 
                    id: 1, 
                    userId: 1,
                    departmentId: 1,
                    pickupDate: '2025-05-01',
                    pickupTime: '09:00:00',
                    returnDate: '2025-05-02',
                    returnTime: '18:00:00',
                    pickupPoint: 'Office',
                    destination: 'Client Site',
                    travellersCount: 2,
                    purpose: 'Business Meeting',
                    approvalStatus: 'Pending',
                    approverId: 2,
                    allocationMode: 'Allocated',
                    startTime: '2025-05-01T09:00:00',
                    endTime: '2025-05-02T18:00:00'
                }
            ];

            const mockDepartments = [
                { id: 1, name: 'IT' }
            ];

            require('../models/user.model').findAll.mockResolvedValue(mockUsers);
            require('../models/Trip.model').findAll.mockResolvedValue(mockTrips);
            require('../models/departments.model').findAll.mockResolvedValue(mockDepartments);

            await readAllRequisition(mockReq, mockRes);

            // Verify data was fetched
            expect(require('../models/user.model').findAll).toHaveBeenCalled();
            expect(require('../models/Trip.model').findAll).toHaveBeenCalled();
            expect(require('../models/departments.model').findAll).toHaveBeenCalled();

            // Verify success response with formatted data
            expect(successTransaction).toHaveBeenCalledWith(
                mockRes, 
                'read', 
                expect.arrayContaining([
                    expect.objectContaining({
                        fullName: 'Test User',
                        destination: 'Client Site',
                        department: 'IT',
                        Approver: 'Jane Doe'
                    })
                ])
            );
        });

        it('should handle errors when reading all requisitions', async () => {
            const mockError = new Error('Read failed');
            require('../models/user.model').findAll.mockRejectedValue(mockError);

            await readAllRequisition(mockReq, mockRes);

            // Verify error handling
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });

    describe('approve Function', () => {
        it('should approve a requisition successfully', async () => {
            mockReq.params.id = '1';
            mockReq.body = {
                approverId: 2,
                approvalStatus: 'Approved'
            };

            const mockTrip = {
                id: 1,
                userId: 1,
                pickupPoint: 'Office',
                destination: 'Client Site',
                pickupDate: '2025-05-01',
                save: jest.fn().mockResolvedValue(true)
            };

            const mockHRMRoles = [
                { userId: 3, role: 'hrm' },
                { userId: 4, role: 'hrm' }
            ];

            const mockHRMs = [
                { id: 3, email: 'hrm1@example.com' },
                { id: 4, email: 'hrm2@example.com' }
            ];

            require('../models/Trip.model').findByPk.mockResolvedValue(mockTrip);
            require('../models/roles.model').findAll.mockResolvedValue(mockHRMRoles);
            require('../models/user.model').findAll.mockResolvedValue(mockHRMs);

            await approve(mockReq, mockRes);

            // Verify trip was fetched
            expect(require('../models/Trip.model').findByPk).toHaveBeenCalledWith('1');

            // Verify trip was updated
            expect(mockTrip.approverId).toBe(2);
            expect(mockTrip.approvalStatus).toBe('Approved');

            // Verify HRM roles were fetched
            expect(require('../models/roles.model').findAll).toHaveBeenCalledWith({
                where: { role: 'hrm' },
                raw: true
            });

            // Verify HRMs were fetched
            expect(require('../models/user.model').findAll).toHaveBeenCalledWith({
                where: {
                    id: { [Op.in]: [3, 4] }
                }
            });

            // Verify email was sent
            expect(MailHandler).toHaveBeenCalledWith(
                ['hrm1@example.com', 'hrm2@example.com'],
                'Requisition Allocation Requests',
                'You have a new requisition allocation request.'
            );

            // Verify trip was saved
            expect(mockTrip.save).toHaveBeenCalledWith({ transaction: mockTransaction });

            // Verify transaction was committed
            expect(mockTransaction.commit).toHaveBeenCalled();

            // Verify success response
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'updated');
        });

        it('should reject a requisition and send notifications', async () => {
            mockReq.params.id = '1';
            mockReq.body = {
                approverId: 2,
                approvalStatus: 'Rejected',
                reason: 'Budget constraints'
            };

            const mockTrip = {
                id: 1,
                userId: 1,
                pickupPoint: 'Office',
                destination: 'Client Site',
                pickupDate: '2025-05-01',
                save: jest.fn().mockResolvedValue(true)
            };

            const mockUser = {
                id: 1,
                email: 'user@example.com',
                phone: '1234567890'
            };

            const mockHRMRoles = [{ userId: 3, role: 'hrm' }];
            const mockHRMs = [{ id: 3, email: 'hrm@example.com' }];

            require('../models/Trip.model').findByPk.mockResolvedValue(mockTrip);
            require('../models/user.model').findByPk.mockResolvedValue(mockUser);
            require('../models/roles.model').findAll.mockResolvedValue(mockHRMRoles);
            require('../models/user.model').findAll.mockResolvedValue(mockHRMs);

            await approve(mockReq, mockRes);

            // Verify trip was updated
            expect(mockTrip.approvalStatus).toBe('Rejected');
            expect(mockTrip.travelStatus).toBe('Canceled');
            expect(mockTrip.denialReason).toBe('Budget constraints');

            // Verify user was fetched
            expect(require('../models/user.model').findByPk).toHaveBeenCalledWith(1);

            // Verify notifications were sent
            expect(MailHandler).toHaveBeenCalledWith(
                'user@example.com',
                'Requisition Rejected',
                expect.stringContaining('has been rejected')
            );

            expect(SMSHandler).toHaveBeenCalledWith(
                '1234567890',
                expect.stringContaining('has been rejected')
            );

            // Verify success response
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'updated');
        });

        it('should handle trip not found', async () => {
            require('../models/Trip.model').findByPk.mockResolvedValue(null);

            await approve(mockReq, mockRes);

            // Verify error handling
            expect(handleErrors).toHaveBeenCalledWith(mockRes, expect.any(Error));
        });

        it('should handle notification failure when rejecting', async () => {
            mockReq.params.id = '1';
            mockReq.body = {
                approverId: 2,
                approvalStatus: 'Rejected',
                reason: 'Budget constraints'
            };

            const mockTrip = {
                id: 1,
                userId: 1,
                pickupPoint: 'Office',
                destination: 'Client Site',
                pickupDate: '2025-05-01',
                save: jest.fn().mockResolvedValue(true)
            };

            const mockUser = {
                id: 1,
                email: 'user@example.com',
                phone: '1234567890'
            };

            require('../models/Trip.model').findByPk.mockResolvedValue(mockTrip);
            require('../models/user.model').findByPk.mockResolvedValue(mockUser);

            // Mock SMS failure
            SMSHandler.mockResolvedValueOnce({ success: false });

            await approve(mockReq, mockRes);

            // Verify transaction was rolled back
            expect(mockTransaction.rollback).toHaveBeenCalled();

            // Verify error handling
            expect(handleErrors).toHaveBeenCalledWith(mockRes, expect.any(Error));
        });

        it('should handle errors and rollback transaction', async () => {
            const mockError = new Error('Approval failed');
            require('../models/Trip.model').findByPk.mockRejectedValue(mockError);

            await approve(mockReq, mockRes);

            // Verify transaction was rolled back
            expect(mockTransaction.rollback).toHaveBeenCalled();

            // Verify error handling
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });
});
