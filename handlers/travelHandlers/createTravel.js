const {MailHandler} = require("../MailHandler/MailHandler");
const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const rolesModel = require('../../models/roles.model')
const userModel = require('../../models/user.model');

const createTravel = async (model,req,res) => {
    const sequelize = await model.sequelize;
    const transaction = await sequelize.transaction();
    try {

        const {departmentId} = req.user;

        const result = await model.create(req.body,{transaction});

        if (!result) {
            return res.status(400).json({
                success: false,
                message: "Unable to create travel."
            })
        }

        const managers = await rolesModel.findAll({where:{departmentId:departmentId,role:"manager"}});

        const mailsTo = managers
            .filter(manager => manager.userId !== req.user.userId)
            .map(manager => manager.userId); // Extract only the userIds

        const users = await userModel.findAll()

        const emails = users
            .filter(user => mailsTo.includes(user.id)) // Check if the user ID is in mailsTo
            .map(user => user.email); // Extract the emails


        const mailResult = await MailHandler(emails,"approval","Hello")

        if (!mailResult.success) {
            throw new Error(`Failed to send email: ${mailResult.error}`);
        }

        await transaction.commit();

        return successTransaction(res,"created")

    }catch(err){
        await transaction.rollback();
        return handleErrors(res,err)
    }
}

module.exports = {createTravel};