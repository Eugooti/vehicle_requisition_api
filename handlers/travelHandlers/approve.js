const { handleErrors, successTransaction } = require("../../utils/errorHandlers");
const tripsModel = require("../../models/Trip.model");
const usersModel = require("../../models/user.model");
const { SMSHandler } = require("../MailHandler/SMSHandler");
const {MailHandler} = require("../MailHandler/MailHandler");
const rolesModel = require("../../models/roles.model");
const userModel = require("../../models/user.model");
const {Op} = require("sequelize");


const approve = async (req, res) => {
    const sequelize = tripsModel.sequelize;
    const transaction = await sequelize.transaction(); // Initialize transaction
    try {
        const id = req.params.id;
        const { approverId, approvalStatus,reason } = req.body; // Ensure this is req.body, not res.body

        const trip = await tripsModel.findByPk(id);
        if (!trip) throw new Error("Trip not found");

        trip.approverId = approverId;
        trip.approvalStatus = approvalStatus;

        if (approvalStatus === "Rejected") {
            trip.travelStatus ='Canceled'
            trip.denialReason = reason;
            const user = await usersModel.findByPk(trip.userId);
            const message = `Hello, Your requisition from ${trip.pickupPoint} to ${trip.destination} on ${trip.pickupDate} has been rejected.\nReason: ${reason}`;

            const sendEmail = await MailHandler(user.email,"Requisition Rejected",`Your requisition from ${trip.pickupPoint} to ${trip.destination} on ${trip.pickupDate} has been rejected.\nReason:${reason}`);
            const sendMessage = await SMSHandler(user.phone, message);

            if (!sendMessage.success||!sendEmail.success) {
                // Rollback transaction first before throwing
                await transaction.rollback();
                throw new Error(`Failed to send notification`);
            }
        }

        const findHRMRoles = await rolesModel.findAll({
            where: {role:'hrm'},
            raw: true
        })

        const hrmIds = findHRMRoles.map(item=>item.userId)

        const findHrms = await userModel.findAll({
            where: {
                id:{[Op.in]:hrmIds},
            }
        })

        const hrmMails = findHrms.map(item => item.email)


        const sendMails = await MailHandler(hrmMails,"Requisition Allocation Requests","You have a new requisition allocation request.");

        if (!sendMails.success){
            throw new Error("Error sending mail")
        }

        await trip.save({ transaction });


        // Commit only once at the end
        await transaction.commit();
        return successTransaction(res, "updated");

    } catch (err) {
        // Check if transaction is still active before rolling back
        if (!transaction.finished) {
            await transaction.rollback();
        }
        return handleErrors(res, err);
    }
};

module.exports = { approve };