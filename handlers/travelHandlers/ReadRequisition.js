const usersModel = require('../../models/user.model');
const requisitionsModel = require('../../models/Trip.model');
const departmentModel = require('../../models/departments.model');
const coTravellersModel = require('../../models/coTravellers.model');
const {handleErrors, successTransaction} = require("../../utils/errorHandlers");

const readRequisitionsByDepartment= async (req,res)=>{
    try {
        const usersList = await usersModel.findAll()
        const tripsList = await requisitionsModel.findAll({where:{departmentId:req.params.id}})
        const coTravellersList = await coTravellersModel.findAll()

        const findUser = (id)=>{
            return usersList.find(item=>item.id === id);
        }

        function getCoTravellersNames(tripId) {
            return coTravellersList
                .filter(item => item.tripId === tripId)
                .map(item => {
                    const user = findUser(item.userId);
                    return `${user.firstName} ${user.lastName}`;
                });
        }

        const formatTrips = tripsList.map((trip,index) => ({
            fullName:`${findUser(trip.userId).firstName} ${findUser(trip.userId).lastName}`,
            date:trip.pickupDate,
            pickup:trip.pickupPoint,
            destination:trip.destination,
            passengerNumber:trip.travellersCount,
            purpose:trip.purpose,
            id:trip.id,
            approvalStatus:trip.approvalStatus,
            coTravellers:getCoTravellersNames(trip.id)
        }))

        return successTransaction(res,"read",formatTrips)

    }catch(err){
        return handleErrors(res,err)
    }
}

const readAllRequisition = async (req,res) => {
  try {
      const usersList = await usersModel.findAll()
      const tripsList = await requisitionsModel.findAll()
      const departmentList = await departmentModel.findAll()
      const coTravellersList = await coTravellersModel.findAll()


      const findItem = (id,list)=>{
          return list.find(item=>item.id === id);
      }

      const formatTime =(time)=>{
          const [hour, minute] = time.split(':');

          return `${hour}:${minute}`;
      }

      const findUser = (id)=>{
          return usersList.find(item=>item.id === id);
      }

      function getCoTravellersNames(tripId) {
          return coTravellersList
              .filter(item => item.tripId === tripId)
              .map(item => {
                  const user = findUser(item.userId);
                  return `${user.firstName} ${user.lastName}`;
              });
      }

      const formatData = tripsList.map((trip)=>({
          fullName:`${findItem(trip.userId,usersList).firstName} ${findItem(trip.userId,usersList).lastName}`,
          pickupDate:trip.pickupDate,
          pickupTime:trip.pickupTime,
          returnDate:trip.returnDate,
          returnTime:trip.returnTime,
          designation: findItem(trip.userId,usersList).designation,
          phone: findItem(trip.userId,usersList).phone,
          pickup:trip.pickupPoint,
          destination:trip.destination,
          passengerNumber:trip.travellersCount,
          purpose:trip.purpose,
          id:trip.id,
          Approver:`${findItem(trip.approverId,usersList)?.firstName} ${findItem(trip.approverId,usersList)?.lastName}`,
          department:findItem(trip?.departmentId,departmentList)?.name,
          approvalStatus:trip.approvalStatus,
          allocationMode:trip.allocationMode,
          end:trip.endTime,
          start: trip.startTime,
          driverId:trip.driverId,
          date:trip.pickupDate,
          time:formatTime(trip.pickupTime),
          coTravellers:getCoTravellersNames(trip.id)
      }))

      return successTransaction(res,"read",formatData)

  }catch(err){
      return handleErrors(res,err)
  }
}


const readTripsByUser = async (req,res) => {
    try {

        const requisitions = await requisitionsModel.findAll({where:{userId:req.params.id},raw:true})
        const coTravellersList = await coTravellersModel.findAll()
        const usersList = await usersModel.findAll()



        const findUser = (id)=>{
            return usersList.find(item=>item.id === id);
        }

        function getCoTravellersNames(tripId) {
            return coTravellersList
                .filter(item => item.tripId === tripId)
                .map(item => {
                    const user = findUser(item.userId);
                    return {label:`${user.firstName} ${user.lastName}`,value:user.id};
                });
        }

        const result = requisitions.map(item=>({
            ...item,
            coTravellers:getCoTravellersNames(item.id)
        }))


        return successTransaction(res,null,result)

    }catch (err) {
        return handleErrors(res,err)
    }

}

module.exports = {readRequisitionsByDepartment,readAllRequisition,readTripsByUser};