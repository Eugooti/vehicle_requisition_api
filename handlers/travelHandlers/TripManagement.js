const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const usersModel = require("../../models/user.model");
const tripsModel = require("../../models/Trip.model");
const {MailHandler} = require("../MailHandler/MailHandler");

const TripManagement = async (req, res) => {
    const sequelize = tripsModel.sequelize;
    const transaction = await sequelize.transaction();

    try {
        const {id} = req.params;
        const {link} = req.body;

        if (!id || !link) {
            throw new Error("Missing required parameters: id and link");
        }

        // First find the trip to get the userId
        const trip = await tripsModel.findByPk(id, {transaction});

        if (!trip) {
            throw new Error(`No trip found with id: ${id}`);
        }

        // Perform the update
        const [updatedRowsCount] = await tripsModel.update(req.body, {
            where: {id},
            transaction
        });

        if (updatedRowsCount === 0) {
            throw new Error(`Failed to update trip with id: ${id}`);
        }

        // Get the user associated with the trip
        const user = await usersModel.findByPk(trip.userId, {transaction});

        if (!user || !user.email) {
            throw new Error("User not found or missing email");
        }

        const applicantMail = await MailHandler(
            user.email,
            "End Of Trip",
            `Your requisition has been successfully completed. Give feedback on the trip by clicking on this link: <a href="${link}">Click here to provide feedback</a>`,
            true // Set this to true if your MailHandler supports HTML content
        );

        if (!applicantMail.success) {
            throw new Error("Failed to send email notification");
        }

        await transaction.commit();
        return successTransaction(res, 'updated');

    } catch (err) {
        await transaction.rollback();
        console.error('Error in TripManagement:', err);
        return handleErrors(res, err);
    }
}

module.exports = {TripManagement}