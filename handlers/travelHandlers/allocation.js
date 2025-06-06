const { handleErrors, itemNotFound, successTransaction, getClientInfo } = require('../../utils/errorHandlers');
const tripModel = require("../../models/Trip.model");
const scheduleModel = require("../../models/schedule.model");
const Users = require('../../models/user.model');
const vehicleModel = require("../../models/vehicle.model");
const CoTravellers = require('../../models/coTravellers.model');
const { SMSHandler } = require('../MailHandler/SMSHandler');
const { MailHandler } = require("../MailHandler/MailHandler");
const { Op } = require("sequelize");

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
        const { allocatorId, driverId, vehicleId, allocatorNote, pickupDate, pickupTime, returnDate, returnTime, allocationMode } = req.body;

        // Prepare trip and schedule data
        const tripData = pickupTime
            ? { allocatorId, driverId, vehicleId, allocatorNote, allocationMode, pickupDate, pickupTime }
            : { allocatorId, driverId, vehicleId, allocatorNote, allocationMode };

        const scheduleData = { vehicleId, tripId: id, pickupDate, pickupTime, returnDate, returnTime };

        // Update trip and create schedule in transaction
        const [updatedRowsCount] = await tripModel.update(tripData, {
            where: { id },
            returning: true,
            transaction
        });

        if (updatedRowsCount === 0) {
            await transaction.rollback();
            return itemNotFound(res, "Trip");
        }

        const createSchedule = await scheduleModel.create(scheduleData, { transaction });
        if (!createSchedule) {
            await transaction.rollback();
            return res.status(500).json({ message: 'Reservation creation failed', success: false });
        }

        // Fetch initial data in parallel (except applicant which depends on userTrips)
        const [driver, userTrips, coTravellersList, vehicle] = await Promise.all([
            Users.findOne({ where: { id: driverId }, raw: true }),
            tripModel.findByPk(id, { raw: true }),
            CoTravellers.findAll({ where: { tripId: id }, raw: true }),
            vehicleModel.findOne({ where: { id: vehicleId }, raw: true })
        ]);

        // Now fetch the applicant using the userTrips we just got
        const applicant = await Users.findOne({
            where: { id: userTrips.userId },
            raw: true
        });

        // Prepare notification messages
        const driverMessage = `Hello,\nYou have been assigned a trip from ${userTrips.pickupPoint} to ${userTrips.destination} on ${pickupDate} at ${pickupTime}.\nRequested by: ${applicant.firstName} ${applicant.lastName}.`;
        const applicantMessage = `Hello, Your requisition has been approved and assigned.\nVehicle: ${vehicle.make} - ${vehicle.numberPlate} \nDriver: ${driver.firstName} ${driver.lastName} \nContact: ${driver.phone}`;

        // Prepare email templates
        const applicantEmailTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Your Vehicle Requisition Details</h2>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3 style="margin-top: 0;">🛻 Vehicle Information</h3>
                    <p><strong>Make/Model:</strong> ${vehicle.make || 'Not specified'}</p>
                    <p><strong>License Plate:</strong> ${vehicle.numberPlate || 'Pending assignment'}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3 style="margin-top: 0;">👨‍💼 Driver Details</h3>
                    <p><strong>Name:</strong> ${driver.firstName} ${driver.lastName}</p>
                    <p><strong>Contact:</strong> <a>${driver.phone}</a></p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="tel:${driver.phone}"
                           style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s;"
                           onmouseover="this.style.backgroundColor='#059669'; this.style.transform='translateY(-2px)'" 
                           onmouseout="this.style.backgroundColor='#10b981'; this.style.transform='none'">
                          Call Driver
                        </a>
                    </div>
                </div>
                <p style="font-size: 14px; color: #6c757d;">
                    <i>This assignment is valid until ${userTrips.returnDate}</i>
                </p>
            </div>
        `;

        const coTravellerEmailTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Your Vehicle Requisition Details</h2>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h3 style="margin-top: 0;">Applicant Details</h3>
                    <p><strong>Name:</strong> ${applicant.firstName} ${applicant.lastName}</p>
                    ${applicant.designation ? `<p><strong>Designation:</strong> ${applicant.designation}</p>` : ''}
                </div>
                ${applicantEmailTemplate.split('<h2 style="color: #2c3e50;">Your Vehicle Requisition Details</h2>')[1]}
            </div>
        `;

        // Prepare all notification promises
        const notificationPromises = [
            SMSHandler(driver.phone, driverMessage),
            SMSHandler(applicant.phone, applicantMessage),
            MailHandler(applicant.email, "Requisition Allocation", applicantEmailTemplate)
        ];

        // Handle co-travelers if they exist
        if (coTravellersList.length > 0) {
            const travellerIds = coTravellersList.map(item => item.userId);
            const travellers = await Users.findAll({
                where: { id: { [Op.in]: travellerIds } },
                raw: true
            });

            const travellersEmail = travellers.map(traveller => traveller.email);
            const travellersPhone = travellers.map(traveller => traveller.phone);

            // Add co-traveller notifications
            notificationPromises.push(
                MailHandler(travellersEmail, "Requisition Allocation", coTravellerEmailTemplate),
                ...travellersPhone.map(phone => SMSHandler(phone, applicantMessage))
            );
        }

        // Execute all notifications and check results
        const notificationResults = await Promise.all(notificationPromises);
        const failedNotifications = notificationResults.filter(result => !result?.success);

        if (failedNotifications.length > 0) {
            throw new Error(`${failedNotifications.length} notification(s) failed to send`);
        }

        // Commit transaction if everything succeeded
        await transaction.commit();
        return successTransaction(res, 'updated');

    } catch (err) {
        console.error(err);
        await transaction.rollback();
        return handleErrors(res, err);
    }
};

module.exports = { allocation };