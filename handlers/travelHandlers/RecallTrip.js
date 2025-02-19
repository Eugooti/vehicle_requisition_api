const {handleErrors, itemNotFound} = require("../../utils/errorHandlers");
const schedules = require('../../models/schedule.model')
const userModel = require('../../models/user.model')
const {SMSHandler} = require("../MailHandler/SMSHandler");

const RecallTrip = async (req,res) => {
    const sequelize = schedules.sequelize;
    const transaction = await sequelize.transaction();

  try {
      const id = req.params.id;
      const {driverId,userId} = req.body

      const timeStamps = new Date().toISOString();
      const returnDate = timeStamps.split('T')[0];
      const [hour,min] = timeStamps.split('T')[1].split(':')
      const returnTime = `${hour}:${min}`;

      const scheduleData = {
          returnDate,
          returnTime,
      }

      const [updatedRowsCount] = await schedules.update(scheduleData,{
          where: { id },
          returning: true,
          transaction
      })

      if (updatedRowsCount === 0) {
          await transaction.rollback();
          return itemNotFound(res, "Schedule");
      }

      const user = await userModel.findOne({where:{id:userId},raw:true})
      const driver = await userModel.findOne({where:{id:driverId},raw:true})



      const driverSMS = await SMSHandler()

  }catch(err){
      return handleErrors(res, err);
  }
}