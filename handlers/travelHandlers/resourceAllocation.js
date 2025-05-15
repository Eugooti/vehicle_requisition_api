const {handleErrors, itemNotFound, successTransaction} = require("../../utils/errorHandlers");
const {MailHandler} = require("../MailHandler/MailHandler");
const resourceAllocation = async (model,req,res) => {
    const sequelize = await model.sequelize;
    const transaction = await sequelize.transaction();
    try {
        const {id} = req.params;

        const {driverId,vehicleId,userEmail,driverEmail,scheduleDate,scheduleTime,pickupPoint} = res.body;


        const [updatedRowsCount, updatedRows] = await model.update({driverId,vehicleId}, {
            where: { id },
            returning: true,
            transaction
        });

        if (updatedRowsCount ===0 ){
            return itemNotFound(res)
        }

        const emails = [userEmail,driverEmail]

        const sendMail = await MailHandler(emails,"SCHEDULED TRAVEL",`Your travel is scheduled on ${scheduleDate} at ${scheduleTime}. Kindly avail yourself ata ${pickupPoint} in time.`)

        if (!sendMail.success){
            throw new Error(`Failed to send email: ${sendMail.error}`);
        }

        await transaction.commit();

        return successTransaction(res,"updated")

    }catch(err){
        await  transaction.rollback();
        return handleErrors(res, err);
    }

}
module.exports = {resourceAllocation}