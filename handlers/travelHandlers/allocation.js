const { handleErrors, itemNotFound, successTransaction, getClientInfo, sanitizeEntityData } = require('../../utils/errorHandlers');
const tripModel = require("../../models/Trip.model");
const scheduleModel = require("../../models/schedule.model");
const Users = require('../../models/user.model');
const vehicleModel = require("../../models/vehicle.model");
const { SMSHandler } = require('../MailHandler/SMSHandler');
const {MailHandler} = require("../MailHandler/MailHandler");
const logs = require('../../models/logs.model');

const allocation = async (req, res) => {
    const sequelize = tripModel.sequelize;
    const transaction = await sequelize.transaction();
    const id = req.params.id;
    const clientInfo = getClientInfo(req);

    const baseLog = {
        userId: req.user?.id || null,
        loginEmail: req.user?.email || null,
        action: `Allocate Vehicle`,
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
                query: req.query,
                body: sanitizeEntityData(req.body)
            }
        }
    };

    try {
        const { allocatorId, driverId, vehicleId, allocatorNote, pickupDate, pickupTime, returnDate, returnTime, allocationMode } = req.body;

        // 1. Get current trip state before update
        const currentTrip = await tripModel.findByPk(id, { transaction, raw: true });
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
            }, { transaction });
            await transaction.rollback();
            return itemNotFound(res, "Trip");
        }

        // 2. Prepare update data
        const tripData = pickupTime
            ? { allocatorId, driverId, vehicleId, allocatorNote, allocationMode, pickupDate, pickupTime }
            : { allocatorId, driverId, vehicleId, allocatorNote, allocationMode };

        const scheduleData = { vehicleId, tripId: id, pickupDate, pickupTime, returnDate, returnTime };

        // 3. Update trip
        const [updatedRowsCount] = await tripModel.update(tripData, {
            where: { id },
            transaction
        });

        if (updatedRowsCount === 0) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "Trip update failed",
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        type: "UPDATE_FAILED",
                        message: "No rows were updated"
                    }
                }
            }, { transaction });
            await transaction.rollback();
            return itemNotFound(res, "Trip");
        }

        // 4. Create schedule
        const createSchedule = await scheduleModel.create(scheduleData, { transaction });
        if (!createSchedule) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "Schedule creation failed",
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        type: "CREATION_FAILED",
                        message: "Failed to create schedule record"
                    }
                }
            }, { transaction });
            await transaction.rollback();
            return res.status(500).json({ message: 'Reservation creation failed', success: false });
        }

        // 5. Fetch related data
        const [driver, userTrips, applicant, vehicle] = await Promise.all([
            Users.findOne({ where: { id: driverId }, raw: true, transaction }),
            tripModel.findByPk(id, { raw: true, transaction }),
            Users.findOne({ where: { id: currentTrip.userId }, raw: true, transaction }),
            vehicleModel.findOne({ where: { id: vehicleId }, raw: true, transaction })
        ]);

        if (!driver || !applicant || !vehicle) {
            const missing = [];
            if (!driver) missing.push("driver");
            if (!applicant) missing.push("applicant");
            if (!vehicle) missing.push("vehicle");

            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "Required data not found",
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        type: "DATA_NOT_FOUND",
                        message: `Missing: ${missing.join(', ')}`
                    }
                }
            }, { transaction });
            await transaction.rollback();
            return res.status(404).json({ message: `Required data not found: ${missing.join(', ')}`, success: false });
        }

        // 6. Send notifications
        const driverMessage = `Hello,\nYou have been assigned a trip from ${userTrips.pickupPoint} to ${userTrips.destination} on ${pickupDate} at ${pickupTime}.\nRequested by: ${applicant.firstName} ${applicant.lastName}.`;
        const applicantMessage = `Hello,Your requisition has been approved and assigned.\nVehicle: ${vehicle.make} - ${vehicle.numberPlate} \nDriver: ${driver.firstName} ${driver.lastName} \nContact: ${driver.phone}`;

        const [driverSMS, applicantSMS, applicantMail] = await Promise.all([
            SMSHandler(driver.phone, driverMessage),
            SMSHandler(applicant.phone, applicantMessage),
            MailHandler(applicant.email, "Requisition Allocation", `...email template content...`)
        ]);

        if (!applicantMail.success || !applicantSMS.success || !driverSMS.success) {
            const failedNotifications = [];
            if (!applicantMail.success) failedNotifications.push("applicant email");
            if (!applicantSMS.success) failedNotifications.push("applicant SMS");
            if (!driverSMS.success) failedNotifications.push("driver SMS");

            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "Notification sending failed",
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        type: "NOTIFICATION_FAILED",
                        message: `Failed to send: ${failedNotifications.join(', ')}`
                    }
                }
            }, { transaction });
            await transaction.rollback();
            return res.status(500).json({ message: `Failed to send notifications: ${failedNotifications.join(', ')}`, success: false });
        }

        // 7. Log successful allocation
        const changes = {
            allocatorId: { from: currentTrip.allocatorId, to: allocatorId },
            driverId: { from: currentTrip.driverId, to: driverId },
            vehicleId: { from: currentTrip.vehicleId, to: vehicleId },
            allocationMode: { from: currentTrip.allocationMode, to: allocationMode }
        };

        if (pickupTime) {
            changes.pickupDate = { from: currentTrip.pickupDate, to: pickupDate };
            changes.pickupTime = { from: currentTrip.pickupTime, to: pickupTime };
        }

        await logs.create({
            ...baseLog,
            status: "Success",
            description: "Vehicle allocation completed",
            metadata: {
                ...baseLog.metadata,
                changes,
                notifications: {
                    driverNotified: true,
                    applicantNotified: true,
                    methods: ["SMS", "Email"]
                },
                schedule: {
                    id: createSchedule.id,
                    pickupDate,
                    returnDate
                },
                system: {
                    environment: process.env.NODE_ENV,
                    updatedAt: new Date().toISOString()
                }
            }
        }, { transaction });

        // 8. Commit transaction
        await transaction.commit();
        return successTransaction(res, 'updated', {
            trip: await tripModel.findByPk(id, { raw: true }),
            schedule: createSchedule
        });

    } catch (err) {
        // Error logging
        const errorLog = {
            ...baseLog,
            status: "Failed",
            description: "Vehicle allocation failed",
            metadata: {
                ...baseLog.metadata,
                error: {
                    name: err.name,
                    message: err.message,
                    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
                    code: err.code || 'ALLOCATION_ERROR'
                },
                timestamps: {
                    attemptedAt: new Date().toISOString()
                }
            }
        };

        try {
            await logs.create(errorLog, { transaction });
        } catch (logErr) {
            console.error('Failed to write error log:', logErr);
        }

        if (!transaction.finished) {
            await transaction.rollback();
        }
        return handleErrors(res, err);
    }
};

module.exports = { allocation };