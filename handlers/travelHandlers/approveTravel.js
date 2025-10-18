const {handleErrors, itemNotFound, successTransaction} = require("../../utils/errorHandlers");
const rolesModel = require('../../models/roles.model')
const userModel = require('../../models/user.model');
const {MailHandler} = require("../MailHandler/MailHandler");


const approveTravel = async (model,req,res) => {
    const sequelize = await model.sequelize;
    const transaction = await sequelize.transaction();
    try {
        const {id} = req.params;

        const [updatedRowsCount, updatedRows] = await model.update(req.body, {
            where: { id },
            returning: true,
            transaction
        });

        if (updatedRowsCount ===0 ){
            return itemNotFound(res)
        }

        if (req.body.approvalStatus === "Rejected"){
            const applier = await userModel.findByPk({id:updatedRows.userId})

            const rejectionsMail = await MailHandler(applier.email,"YOUR APPLICATION HAS BEEN DECLINED","I hope this message find you well. Your vehicle requisition request has been declined. Contact your supervisor for explanation.")

            if (!rejectionsMail.success){
                throw new Error(`Failed to send email: ${rejectionsMail.error}`);
            }

            await transaction.commit();

            return successTransaction(res,"updated")
        }

        const humanResource = await rolesModel.findAll({
            where: {role:"humanResource"},
            transaction
        })

        const mailsTo = humanResource.map(item=>item.userId)

        const users = await userModel.findAll({transaction})

        const emails = users
            .filter(user=>mailsTo.includes(user.id))
            .map(user=>user.email)

        const sendMail = await MailHandler(emails,"VEHICLE ALLOCATION REQUEST","I hope this message find you well. You have a new vehicle allocation request.");

        if (!sendMail.success){
            throw new Error(`Failed to send email: ${sendMail.error}`);
        }

        return successTransaction(res,"created")


    }catch(err) {
        await transaction.rollback();
        return handleErrors(err);
    }
}

module.exports = {approveTravel}