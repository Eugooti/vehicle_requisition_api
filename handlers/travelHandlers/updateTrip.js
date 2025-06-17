const coTravellersModel = require("../../models/coTravellers.model");
const tripsModel = require("../../models/Trip.model");
const {successTransaction, handleErrors} = require("../../utils/errorHandlers");
const updateTrip =async (req,res) => {
    const sequelize = tripsModel.sequelize
    const transaction = await sequelize.transaction()
  try {
      const {id} = req.params;
      const {travellers}= req.body


      if (!id || !travellers) {
          return handleErrors(res, new Error("Missing required fields"));
      }


      const [updatedRowsCount, updatedRows] = await tripsModel.update(req.body, {
          where: { id },
          transaction,
          returning: true, // Return the updated rows
      });

      if (updatedRowsCount === 0) {
          await transaction.rollback();
          return handleErrors(res, new Error("Trip not found"));
      }

       await coTravellersModel.destroy({where:{tripId:id},transaction})

      const coTravellers = travellers?.length > 0
          ? travellers.map(item => ({ userId: item, tripId: id }))
          : [];

      await coTravellersModel.bulkCreate(coTravellers,{transaction})

      await transaction.commit()
      return successTransaction(res,null,null,"Requisition Updated Successfully")

  }catch (err) {
        await transaction.rollback()
      return handleErrors(res,err)
  }
}

module.exports = {updateTrip}