const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const tripsModel = require("../../models/Trip.model");
const rolesModel = require("../../models/roles.model");
const userModel = require("../../models/user.model");
const {Op} = require("sequelize");
const {MailHandler} = require("../MailHandler/MailHandler");


const CreateRequisition = async (req,res) => {
    const sequelize = tripsModel.sequelize;
    const transaction = await sequelize.transaction();
  try {
      const {departmentId}= req.body;

     await tripsModel.create(req.body,{transaction});

      const findManagerRoles = await rolesModel.findAll({
          where: {
              [Op.and]:[
                  {departmentId:departmentId},
                  {role:'manager'}
              ]
          },
          raw: true
      })

      const getManagerIds = findManagerRoles.map(item => item.userId);
      const findManagers = await userModel.findAll({
          where: {
              id:{[Op.in]:getManagerIds},
          }
      })

      const managerMails = findManagers.map(item => item.email)

      const sendMails = await MailHandler(managerMails,"Requisition Approval Requests","You have a new requisition approval request.");

      if (!sendMails.success){
          throw new Error("Error sending mail")
      }

      await transaction.commit();
      return successTransaction(res, 'created');


  }catch(err){
      await transaction.rollback()
      return handleErrors(res, err);
  }
}

module.exports = {CreateRequisition};