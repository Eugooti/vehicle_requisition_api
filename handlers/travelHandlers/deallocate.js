const {itemNotFound, successTransaction, handleErrors} = require("../../utils/errorHandlers");
const schedule = require("../../models/schedule.model");
const deallocate =async (model,req,res) => {
    const sequelize = model.sequelize;
    const transaction = await sequelize.transaction()
  try {
      const {id} = req.params;

      const data = {
          allocatorNote:null,
          allocatorId:null,
          driverId:null,
          vehicleId:null,
      }

      const [updatedRowsCount, updatedRows] = await model.update(data, {
          where: { id },
          transaction,
          returning: true, // Return the updated rows
      });

      if (updatedRows === 0) {
          await transaction.rollback();
          return itemNotFound(res)
      }

      await schedule.destroy({where:{tripId:id},transaction});

      await transaction.commit();
      return successTransaction(res,"updated",updatedRows[0])


  }catch(err){
        await transaction.rollback()
      return handleErrors(res,err);
  }
}
module.exports = {deallocate};