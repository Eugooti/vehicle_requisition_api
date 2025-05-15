const { handleErrors, itemNotFound, successTransaction } = require('../../utils/errorHandlers');
const tripModel = require("../../models/Trip.model");
const scheduleModel = require("../../models/schedule.model");
const Users = require('../../models/user.model');
const vehicleModel = require("../../models/vehicle.model");
const { SMSHandler } = require('../MailHandler/SMSHandler');
const {MailHandler} = require("../MailHandler/MailHandler");

const allocation = async (req, res) => {
    const sequelize = tripModel.sequelize;
    const transaction = await sequelize.transaction();
    try {
        const id = req.params.id;
        const { allocatorId, driverId, vehicleId, allocatorNote, pickupDate, pickupTime, returnDate, returnTime, allocationMode } = req.body;

        const tripData = pickupTime
            ? { allocatorId, driverId, vehicleId, allocatorNote, allocationMode, pickupDate, pickupTime }
            : { allocatorId, driverId, vehicleId, allocatorNote, allocationMode };

        const scheduleData = { vehicleId, tripId: id, pickupDate, pickupTime, returnDate, returnTime };

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
            return res.status(500).json({ message: 'Reservation creation failed',success:false });
        }

        // Fetch necessary details
        const driver = await Users.findOne({ where: { id: driverId }, raw: true });
        const userTrips = await tripModel.findByPk(id, { raw: true });
        const applicant = await Users.findOne({ where: { id: userTrips.userId }, raw: true });
        const vehicle = await vehicleModel.findOne({ where: { id: vehicleId }, raw: true });

        // Construct messages
        const driverMessage =
            `Hello,\nYou have been assigned a trip from ${userTrips.pickupPoint} to ${userTrips.destination} on ${pickupDate} at ${pickupTime}.\nRequested by: ${applicant.firstName} ${applicant.lastName}.`;


        const applicantMessage =
            `Hello,Your requisition has been approved and assigned.\nVehicle: ${vehicle.make} - ${vehicle.numberPlate} \nDriver: ${driver.firstName} ${driver.lastName} \nContact: ${driver.phone}`;

        // Send SMS
        const driverSMS = await SMSHandler(driver.phone, driverMessage);
        const applicantSMS = await SMSHandler(applicant.phone, applicantMessage);

        const applicantMail = await MailHandler(applicant.email,"Requisition Allocation",
            `
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
                <i>Theis assignment is valid until ${userTrips.returnDate}</i>
            </p>
        </div>
        `
        );


        if (!applicantMail.success) {
            throw new Error("Failed to send email");
        }

        if (!applicantSMS.success || !driverSMS.success) {
            throw new Error(`Failed to send SMS`);
        }

        // Commit transaction only after everything is successful
        await transaction.commit();
        return successTransaction(res, 'updated');

    } catch (err) {
        console.log(err)
        await transaction.rollback();
        return handleErrors(res, err);
    }
};

module.exports = { allocation };
