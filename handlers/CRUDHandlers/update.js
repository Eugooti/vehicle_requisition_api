const { handleErrors, successTransaction, itemNotFound, getClientInfo, sanitizeEntityData } = require("../../utils/errorHandlers");
const logs = require('../../models/logs.model');

const update = async (model, req, res) => {
    const { id } = req.params;
    const clientInfo = getClientInfo(req);
    const baseLog = {
        userId: req.user?.id || null,
        loginEmail: req.user?.email || null,
        action: `Update ${model.name}`,
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
        // 1. Get current state before update
        const currentRecord = await model.findOne({ where: { id }, raw: true });
        if (!currentRecord) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: `${model.name} not found`,
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        type: "NOT_FOUND",
                        message: `${model.name} record not found`
                    }
                }
            });
            return itemNotFound(res);
        }

        // 2. Perform the update
        const [updatedRowsCount] = await model.update(req.body, {
            where: { id }
        });

        if (updatedRowsCount === 0) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: `No ${model.name} records were updated`,
                metadata: {
                    ...baseLog.metadata,
                    warning: "Update operation affected 0 rows"
                }
            });
            return itemNotFound(res);
        }

        // 3. Get the updated record (with plain: true to get raw values)
        const updatedRecord = await model.findOne({ where: { id }, raw: true });
        if (!updatedRecord) {
            throw new Error(`Failed to retrieve updated ${model.name} record`);
        }

        // 4. Calculate changes between old and new states
        const changes = {};
        let hasChanges = false;

        Object.keys(req.body).forEach(key => {
            const oldValue = currentRecord[key];
            const newValue = updatedRecord[key];

            if (String(oldValue) !== String(newValue)) {
                changes[key] = {
                    from: oldValue,
                    to: newValue
                };
                hasChanges = true;
            }
        });

        // 5. Log the update
        await logs.create({
            ...baseLog,
            status: "Success",
            description: hasChanges ? `${model.name} record updated` : `${model.name} record saved with identical values`,
            metadata: {
                ...baseLog.metadata,
                changes: hasChanges ? changes : null,
                system: {
                    environment: process.env.NODE_ENV,
                    updatedAt: updatedRecord.updatedAt || new Date().toISOString()
                }
            }
        });

        return successTransaction(res, "updated", updatedRecord);

    } catch (err) {
        // Error logging
        const errorLog = {
            ...baseLog,
            status: "Failed",
            description: `Failed to update ${model.name} record`,
            metadata: {
                ...baseLog.metadata,
                error: {
                    name: err.name,
                    message: err.message,
                    code: err.code || `${model.name.toUpperCase()}_UPDATE_ERROR`
                },
                attemptedChanges: sanitizeEntityData(req.body),
                timestamps: {
                    attemptedAt: new Date().toISOString()
                }
            }
        };

        try {
            await logs.create(errorLog);
        } catch (logErr) {
            console.error('Failed to write error log:', logErr);
        }

        return handleErrors(res, err);
    }
};

module.exports = { update };