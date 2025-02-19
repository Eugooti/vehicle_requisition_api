const usersModel = require('../../models/user.model');
const requisitionsModel = require('../../models/Trip.model');
const departmentModel = require('../../models/departments.model');
const {handleErrors, successTransaction} = require("../../utils/errorHandlers");

const readRequisitionsByDepartment= async (req,res)=>{
    try {
        const usersList = await usersModel.findAll()
        const tripsList = await requisitionsModel.findAll({where:{departmentId:req.params.id}})

        const findUser = (id)=>{
            return usersList.find(item=>item.id === id);
        }
        const formatTrips = tripsList.map((trip,index) => ({
            fullName:`${findUser(trip.userId).firstName} ${findUser(trip.userId).lastName}`,
            date:trip.pickupDate,
            pickup:trip.pickupPoint,
            destination:trip.destination,
            passengerNumber:trip.travellersCount,
            purpose:trip.purpose,
            id:trip.id,
            approvalStatus:trip.approvalStatus
        }))

        return successTransaction(res,"read",formatTrips)

    }catch(err){
        console.log(err)
        return handleErrors(res,err)
    }
}

const readAllRequisition = async (req,res) => {
  try {
      const usersList = await usersModel.findAll()
      const tripsList = await requisitionsModel.findAll()
      const departmentList = await departmentModel.findAll()

      const findItem = (id,list)=>{
          return list.find(item=>item.id === id);
      }

      const formatTime =(time)=>{
          const [hour, minute] = time.split(':');

          return `${hour}:${minute}`;
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
      }))

      return successTransaction(res,"read",formatData)

  }catch(err){
      return handleErrors(res,err)
  }
}

module.exports = {readRequisitionsByDepartment,readAllRequisition};