const { handleErrors, itemNotFound, successTransaction, getClientInfo, sanitizeEntityData } = require("../../utils/errorHandlers");
const tripsModel = require("../../models/Trip.model");
const logs = require('../../models/logs.model');

const ownMeans = async (req, res) => {
    const id = req.params.id;
    const { allocatorNote, allocatorId } = req.body;
    const clientInfo = getClientInfo(req);

    const baseLog = {
        userId: req.user?.id || null,
        loginEmail: req.user?.email || null,
        action: `Own Means Allocation`,
        entity: 'Trip',
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
                body: sanitizeEntityData({
                    allocatorNote,
                    allocatorId
                })
            }
        }
    };

    try {
        // 1. Get the current trip state before update
        const currentTrip = await tripsModel.findByPk(id, { raw: true });
        if (!currentTrip) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "Trip not found",
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        type: "NOT_FOUND",
                        message: "Trip record not found"
                    }
                }
            });
            return itemNotFound(res);
        }

        // 2. Prepare update data
        const updateData = {
            travelStatus: "Complete",
            startTime: `${currentTrip.pickupDate} ${currentTrip.pickupTime}`,
            endTime: `${currentTrip.returnDate} ${currentTrip.returnTime}`,
            allocatorId,
            allocatorNote,
            allocationMode: "Own Means"
        };

        // 3. Update trip
        const [updatedRowsCount] = await tripsModel.update(updateData, {
            where: { id }
        });

        if (updatedRowsCount === 0) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "No trip records were updated",
                metadata: {
                    ...baseLog.metadata,
                    warning: "Update operation affected 0 rows"
                }
            });
            return itemNotFound(res);
        }

        // 4. Get an updated trip
        const updatedTrip = await tripsModel.findByPk(id, { raw: true });
        if (!updatedTrip) {
            throw new Error("Failed to retrieve updated trip record");
        }

        // 5. Calculate changes
        const changes = {
            travelStatus: { from: currentTrip.travelStatus, to: "Complete" },
            startTime: { from: currentTrip.startTime, to: updateData.startTime },
            endTime: { from: currentTrip.endTime, to: updateData.endTime },
            allocatorId: { from: currentTrip.allocatorId, to: allocatorId },
            allocatorNote: { from: currentTrip.allocatorNote, to: allocatorNote },
            allocationMode: { from: currentTrip.allocationMode, to: "Own Means" }
        };

        // 6. Log successful update
        await logs.create({
            ...baseLog,
            status: "Success",
            description: "Trip marked as 'Own Means'",
            metadata: {
                ...baseLog.metadata,
                changes,
                system: {
                    environment: process.env.NODE_ENV,
                    updatedAt: updatedTrip.updatedAt || new Date().toISOString()
                }
            }
        });

        return successTransaction(res, 'updated', updatedTrip);

    } catch (err) {
        // Error logging
        const errorLog = {
            ...baseLog,
            status: "Failed",
            description: "Failed to mark trip as 'Own Means'",
            metadata: {
                ...baseLog.metadata,
                error: {
                    name: err.name,
                    message: err.message,
                    code: err.code || 'OWN_MEANS_UPDATE_ERROR'
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
        }

        return handleErrors(res, err);
    }
};

module.exports = { ownMeans };