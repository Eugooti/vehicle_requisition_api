const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const users = require("../../models/user.model")
const vehicles = require("../../models/vehicle.model")
const trips = require("../../models/Trip.model")
const readDriverCompleteTrips = async (req,res) => {
  try {
      const {id} = req.params;

      const driverTrips = await trips.findAll({where:{driverId:id,travelStatus:"Complete"}})
      const vehiclesList = await vehicles.findAll();
      const usersList = await users.findAll();

      const findItem = (id,list)=>{
          return list.find(item=>item.id === id);
      }

      const formattedData = driverTrips.map(item => ({
          fullName:`${findItem(item.userId,usersList).firstName} ${findItem(item.userId,usersList).lastName}`,
          designation:findItem(item.userId,usersList).designation,
          daysCount:item.numberOfDays,
          pickup:item.pickupPoint,
          destination:item.destination,
          passengerNumber:item.travellersCount,
          purpose:item.purpose,
          id:item.id,
          vehicle:`${findItem(item.vehicleId,vehiclesList).make} ${findItem(item.vehicleId,vehiclesList).model} - ${findItem(item.vehicleId,vehiclesList).numberPlate}`,
          date:item.pickupDate,
          time:item.pickupTime,
          returnDate:item.returnDate,
          returnTime:item.returnTime,
      }))

      return successTransaction(res,'read',formattedData)

  }catch (err) {
      console.log(err)
      return handleErrors(res,err)
  }
}

module.exports = {readDriverCompleteTrips}