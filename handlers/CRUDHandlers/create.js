const {handleErrors, successTransaction, getIpAddress, sanitizeEntityData, getClientInfo} = require("../../utils/errorHandlers");
const logs = require('../../models/logs.model')


const create = async (model, req, res) => {
    const clientInfo = getClientInfo(req); // Get detailed client information
    const baseLog = {
        userId: req.user?.id || null,
        loginEmail: req.user?.email || null,
        action: `Create ${model.modelName || model.name}`,
        entity: model.modelName || model.name,
        ipAddress: clientInfo.ipAddress,
        timestamp: new Date(),
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
        const result = await model.create(req.body);

        // Prepare success log metadata
        const successMetadata = {
            ...baseLog.metadata,
            entityData: sanitizeEntityData(req.body), // Sanitize sensitive fields
            system: {
                environment: process.env.NODE_ENV,
                nodeVersion: process.version
            }
        };

        // Async log creation (fire-and-forget)
        logs.create({
            ...baseLog,
            status: "Success",
            entityId: result.id,
            description: `Successfully created ${model.modelName || model.name} record`,
            metadata: successMetadata
        }).catch(logErr => console.error('Logging failed', logErr));

        return successTransaction(res, 'created', result);

    } catch (err) {
        // Prepare error metadata
        const errorMetadata = {
            ...baseLog.metadata,
            error: {
                name: err.name,
                message: err.message,
                code: err.code || 'MODEL_CREATION_ERROR',
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            },
            attemptedData: sanitizeEntityData(req.body)
        };

        // Ensure the original error isn't lost if logging fails
        try {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: `Failed to create ${model.modelName || model.name} record`,
                metadata: errorMetadata
            });
        } catch (logErr) {
            console.error('Failed to write error log', logErr);
            // Fallback to basic error logging
            console.error('Original error:', {
                error: err.message,
                route: req.originalUrl,
                body: sanitizeEntityData(req.body)
            });
        }

        return handleErrors(res, err);
    }
};


const createMany = async (model, req, res) => {
    const clientInfo = getClientInfo(req); // Get detailed client information
    const baseLog = {
        userId: req.user?.id || null,
        loginEmail: req.user?.email || null,
        action: `Create ${model.modelName || model.name}`,
        entity: model.modelName || model.name,
        ipAddress: clientInfo.ipAddress,
        timestamp: new Date(),
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
            },
            system: {
                environment: process.env.NODE_ENV,
                nodeVersion: process.version
            }
        }
    };

    try {
        if (!Array.isArray(req.body)) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "Invalid request - body must be an array",
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        message: "Request body must be an array",
                        type: "VALIDATION_ERROR"
                    },
                    validation: {
                        bodyType: typeof req.body,
                        bodyContent: req.body !== undefined ? "exists" : "undefined"
                    }
                }
            });
            return res.status(400).json({
                success: false,
                error: 'Request body must be an array'
            });
        }

        const result = await model.bulkCreate(req.body);

        // Prepare individual log entries
        const logEntries = result.map(item => ({
            ...baseLog,
            entityId: item.id,
            status: "Success",
            description: `Created ${model.modelName || model.name} record`,
            metadata: {
                ...baseLog.metadata,
                entityData: sanitizeEntityData(item.get({ plain: true })),
                timestamps: {
                    createdAt: item.createdAt || new Date().toISOString()
                }
            }
        }));

        // Batch process logs to avoid overwhelming the database
        const BATCH_SIZE = 100; // Adjust based on your database performance
        for (let i = 0; i < logEntries.length; i += BATCH_SIZE) {
            const batch = logEntries.slice(i, i + BATCH_SIZE);
            await logs.bulkCreate(batch).catch(err =>
                console.error(`Failed to log batch ${i}-${i+BATCH_SIZE}:`, err)
            );
        }

        // Create summary log
        await logs.create({
            ...baseLog,
            action: `Bulk Create ${model.modelName || model.name}`,
            status: "Success",
            description: `Successfully created ${result.length} records`,
            metadata: {
                ...baseLog.metadata,
                summary: {
                    totalCreated: result.length,
                    firstId: result[0]?.id,
                    lastId: result[result.length - 1]?.id,
                    sampleIds: result.slice(0, 5).map(r => r.id) // Sample of IDs
                }
            }
        });

        return successTransaction(res, "created", result);

    } catch (err) {
        // Prepare detailed error log
        // const errorLog = {
        //     ...baseLog,
        //     action: `Bulk Create ${model.modelName || model.name}`,
        //     status: "Failed",
        //     description: `Failed to create ${req.body.length} records`,
        //     metadata: {
        //         ...baseLog.metadata,
        //         error: {
        //             name: err.name,
        //             message: err.message,
        //             code: err.code || 'BULK_CREATE_ERROR',
        //             stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        //         },
        //         operation: {
        //             attemptedCount: req.body.length,
        //             batchSize: req.body.length,
        //             sampleData: sanitizeEntityData(req.body.slice(0, 3)) // First 3 sanitized items
        //         }
        //     }
        // };
        //
        // try {
        //     await logs.create(errorLog);
        // } catch (logErr) {
        //     console.error('Failed to write error log:', logErr);
        //     // Fallback logging
        //     console.error('Original bulk create error:', {
        //         error: err.message,
        //         route: req.originalUrl,
        //         attemptedCount: req.body.length,
        //         userId: req.user?.id
        //     });
        // }

        return handleErrors(res, err);
    }
};


module.exports = {create,createMany}