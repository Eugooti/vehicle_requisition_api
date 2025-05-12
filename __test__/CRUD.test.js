const { CRUDMethods } = require('../handlers/CRUDHandlers/index');
const { handleErrors, successTransaction, itemNotFound } = require("../utils/errorHandlers");

// Mock the error handlers
jest.mock("../utils/errorHandlers", () => ({
    handleErrors: jest.fn(),
    itemNotFound: jest.fn(),
    successTransaction: jest.fn()
}));

describe('CRUD Operations', () => {
    let mockModel, mockReq, mockRes, crud;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock model
        mockModel = {
            create: jest.fn(),
            bulkCreate: jest.fn(),
            findAll: jest.fn(),
            findByPk: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn()
        };

        // Setup mock request
        mockReq = {
            params: {},
            body: {}
        };

        // Setup mock response
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Initialize CRUD methods
        crud = CRUDMethods(mockModel);
    });

    describe('Create Operations', () => {
        it('should create a single item successfully', async () => {
            const mockResult = { id: 1 };
            mockReq.body = { name: 'Test' };
            mockModel.create.mockResolvedValue(mockResult);

            await crud.create(mockReq, mockRes);

            expect(mockModel.create).toHaveBeenCalledWith({ name: 'Test' });
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'created');
        });

        it('should handle create errors', async () => {
            const mockError = new Error('Create failed');
            mockModel.create.mockRejectedValue(mockError);

            await crud.create(mockReq, mockRes);

            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });

        it('should create multiple items successfully', async () => {
            const mockItems = [{ name: 'Item1' }, { name: 'Item2' }];
            const mockResult = [{ id: 1 }, { id: 2 }];
            mockReq.body = mockItems;
            mockModel.bulkCreate.mockResolvedValue(mockResult);

            await crud.createMany(mockReq, mockRes);

            expect(mockModel.bulkCreate).toHaveBeenCalledWith(mockItems);
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'created', mockResult);
        });

        it('should reject non-array input for createMany', async () => {
            mockReq.body = { not: 'an array' };

            await crud.createMany(mockReq, mockRes);

            expect(mockModel.bulkCreate).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });

        it('should handle createMany errors', async () => {
            const mockError = new Error('Bulk create failed');
            const mockItems = [{ name: 'Item1' }, { name: 'Item2' }];
            mockReq.body = mockItems;
            mockModel.bulkCreate.mockRejectedValue(mockError);

            await crud.createMany(mockReq, mockRes);

            expect(mockModel.bulkCreate).toHaveBeenCalledWith(mockItems);
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });

    describe('Read Operations', () => {
        it('should read all items successfully', async () => {
            const mockResults = [{ id: 1 }, { id: 2 }];
            mockModel.findAll.mockResolvedValue(mockResults);

            await crud.read(mockReq, mockRes);

            expect(mockModel.findAll).toHaveBeenCalled();
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'read', mockResults);
        });

        it('should handle empty results for read', async () => {
            mockModel.findAll.mockResolvedValue([]);

            await crud.read(mockReq, mockRes);

            expect(mockModel.findAll).toHaveBeenCalled();
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'read', []);
        });

        it('should handle error in read', async () => {
            const mockError = new Error('Database error');
            mockModel.findAll.mockRejectedValue(mockError);

            await crud.read(mockReq, mockRes);

            expect(mockModel.findAll).toHaveBeenCalled();
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });

        it('should read by primary key successfully', async () => {
            const mockResult = { id: 1 };
            mockReq.params.id = '1';
            mockModel.findByPk.mockResolvedValue(mockResult);

            await crud.readById(mockReq, mockRes);

            expect(mockModel.findByPk).toHaveBeenCalledWith('1');
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'read', mockResult);
        });

        it('should handle item not found for readById', async () => {
            mockReq.params.id = '999';
            mockModel.findByPk.mockResolvedValue(null);

            await crud.readById(mockReq, mockRes);

            expect(itemNotFound).toHaveBeenCalledWith(mockRes);
        });

        it('should read by user ID successfully', async () => {
            const mockResults = [{ id: 1, userId: 'user1' }];
            mockReq.params.id = 'user1';
            mockModel.findAll.mockResolvedValue(mockResults);

            await crud.readByUserId(mockReq, mockRes);

            expect(mockModel.findAll).toHaveBeenCalledWith({ where: { userId: 'user1' } });
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'read', mockResults);
        });

        it('should read by department ID successfully', async () => {
            const mockResults = [{ id: 1, departmentId: 'dept1' }];
            mockReq.params.id = 'dept1';
            mockModel.findAll.mockResolvedValue(mockResults);

            await crud.readByDpt(mockReq, mockRes);

            expect(mockModel.findAll).toHaveBeenCalledWith({ where: { departmentId: 'dept1' } });
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'read', mockResults);
        });

        it('should handle empty results for readByUserId', async () => {
            mockReq.params.id = 'nonexistent';
            mockModel.findAll.mockResolvedValue([]);

            await crud.readByUserId(mockReq, mockRes);

            expect(mockModel.findAll).toHaveBeenCalledWith({ where: { userId: 'nonexistent' } });
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'read', []);
        });

        it('should handle error in readByUserId', async () => {
            const mockError = new Error('Database error');
            mockReq.params.id = 'user1';
            mockModel.findAll.mockRejectedValue(mockError);

            await crud.readByUserId(mockReq, mockRes);

            expect(mockModel.findAll).toHaveBeenCalledWith({ where: { userId: 'user1' } });
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });

        it('should handle empty results for readByDpt', async () => {
            mockReq.params.id = 'nonexistent';
            mockModel.findAll.mockResolvedValue([]);

            await crud.readByDpt(mockReq, mockRes);

            expect(mockModel.findAll).toHaveBeenCalledWith({ where: { departmentId: 'nonexistent' } });
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'read', []);
        });

        it('should handle error in readByDpt', async () => {
            const mockError = new Error('Database error');
            mockReq.params.id = 'dept1';
            mockModel.findAll.mockRejectedValue(mockError);

            await crud.readByDpt(mockReq, mockRes);

            expect(mockModel.findAll).toHaveBeenCalledWith({ where: { departmentId: 'dept1' } });
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });

    describe('Update Operations', () => {
        it('should update an item successfully', async () => {
            const mockUpdatedItem = { id: 1, name: 'Updated' };
            mockReq.params.id = '1';
            mockReq.body = { name: 'Updated' };
            mockModel.update.mockResolvedValue([1, [mockUpdatedItem]]);

            await crud.update(mockReq, mockRes);

            expect(mockModel.update).toHaveBeenCalledWith(
                { name: 'Updated' },
                { where: { id: '1' }, returning: true }
            );
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'updated', mockUpdatedItem);
        });

        it('should handle item not found for update', async () => {
            mockReq.params.id = '999';
            mockReq.body = { name: 'Updated' };
            mockModel.update.mockResolvedValue([0, []]);

            await crud.update(mockReq, mockRes);

            expect(itemNotFound).toHaveBeenCalledWith(mockRes);
        });

        it('should handle update errors', async () => {
            const mockError = new Error('Update failed');
            mockReq.params.id = '1';
            mockModel.update.mockRejectedValue(mockError);

            await crud.update(mockReq, mockRes);

            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });

    describe('Delete Operations', () => {
        it('should delete an item successfully', async () => {
            const mockInstance = { destroy: jest.fn().mockResolvedValue(true) };
            mockReq.params.id = '1';
            mockModel.findByPk.mockResolvedValue(mockInstance);

            await crud.delete(mockReq, mockRes);

            expect(mockModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockInstance.destroy).toHaveBeenCalled();
            expect(successTransaction).toHaveBeenCalledWith(mockRes, 'deleted');
        });

        it('should handle item not found for delete', async () => {
            mockReq.params.id = '999';
            mockModel.findByPk.mockResolvedValue(null);

            await crud.delete(mockReq, mockRes);

            expect(itemNotFound).toHaveBeenCalledWith(mockRes);
        });

        it('should handle missing ID parameter for delete', async () => {
            mockReq.params = {};

            await crud.delete(mockReq, mockRes);

            expect(handleErrors).toHaveBeenCalledWith(mockRes, expect.any(Error));
        });

        it('should handle delete errors', async () => {
            const mockError = new Error('Delete failed');
            mockReq.params.id = '1';
            mockModel.findByPk.mockRejectedValue(mockError);

            await crud.delete(mockReq, mockRes);

            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });

        it('should handle destroy errors', async () => {
            const mockError = new Error('Destroy failed');
            const mockInstance = { 
                destroy: jest.fn().mockRejectedValue(mockError)
            };
            mockReq.params.id = '1';
            mockModel.findByPk.mockResolvedValue(mockInstance);

            await crud.delete(mockReq, mockRes);

            expect(mockModel.findByPk).toHaveBeenCalledWith('1');
            expect(mockInstance.destroy).toHaveBeenCalled();
            expect(handleErrors).toHaveBeenCalledWith(mockRes, mockError);
        });
    });
});
