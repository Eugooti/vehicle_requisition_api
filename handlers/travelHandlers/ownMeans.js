const {handleErrors, itemNotFound, successTransaction} = require("../../utils/errorHandlers");
const tripsModel = require("../../models/Trip.model")
const ownMeans =async (req,res) => {
  try {
      const id = req.params.id;
      const {allocatorNote,allocatorId} = req.body;

      const trip = await tripsModel.findByPk(id)

      if(!trip){
          return itemNotFound(res)
      }

      trip.travelStatus = "Complete"

      trip.startTime = `${trip.pickupDate} ${trip.pickupTime}`
      trip.endTime = `${trip.returnDate} ${trip.returnTime}`
      trip.allocatorId = allocatorId
      trip.allocatorNote=allocatorNote
      trip.allocationMode = "Own Means"

      await trip.save()

      return successTransaction(res,'updated')


  }catch(err){
      return handleErrors(res,err)
  }
}

module.exports = {ownMeans}