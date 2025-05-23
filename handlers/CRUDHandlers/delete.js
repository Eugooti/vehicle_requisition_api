const { handleErrors, itemNotFound, successTransaction, getClientInfo, sanitizeEntityData} = require("../../utils/errorHandlers");
const logs = require('../../models/logs.model');

const remove = async (model, req, res) => {
    const { id } = req.params;
    const clientInfo = getClientInfo(req);
    const baseLog = {
        userId: req.user?.id || null,
        loginEmail: req.user?.email || null,
        action: `Delete ${model.name}`,
        entity: model.name,
        entityId: id,
        ipAddress: clientInfo.ipAddress,
        metadata: {
            client: {
                userAgent: clientInfo.userAgent,
                protocol: clientInfo.protocol,
                endpoint: req.originalUrl
            },
            request: {
                method: req.method,
                params: req.params,
                query: req.query
            }
        }
    };

    try {
        // Validate ID
        if (!id) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "Delete attempt without ID parameter",
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        type: "VALIDATION_ERROR",
                        message: "ID parameter is required"
                    }
                }
            });
            throw new Error('ID parameter is required');
        }

        // Get record before deletion
        const recordToDelete = await model.findByPk(id);
        if (!recordToDelete) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "Delete attempt - record not found",
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        type: "NOT_FOUND",
                        message: "Record not found"
                    }
                }
            });
            return itemNotFound(res);
        }

        // Capture data before deletion (sanitize sensitive fields)
        const deletedData = sanitizeEntityData(recordToDelete.get({ plain: true }));

        // Perform deletion
        await recordToDelete.destroy();

        // Log successful deletion
        await logs.create({
            ...baseLog,
            status: "Success",
            description: `Successfully deleted ${model.name} record`,
            metadata: {
                ...baseLog.metadata,
                deletedData: deletedData,
                timestamps: {
                    deletedAt: new Date().toISOString()
                }
            }
        });

        return successTransaction(res, "deleted");

    } catch (err) {
        // Prepare error log
        const errorLog = {
            ...baseLog,
            status: "Failed",
            description: `Failed to delete ${model.name} record`,
            metadata: {
                ...baseLog.metadata,
                error: {
                    name: err.name,
                    message: err.message,
                    code: err.code || 'DELETE_ERROR',
                    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
                },
                timestamps: {
                    attemptedAt: new Date().toISOString()
                }
            }
        };

        try {
            await logs.create(errorLog);
        } catch (logErr) {
            console.error('Failed to write error log:', logErr);
            // Fallback logging
            console.error('Delete error:', {
                route: req.originalUrl,
                entityId: id,
                error: err.message,
                userId: req.user?.id
            });
        }

        return handleErrors(res, err);
    }
};

module.exports = { remove };