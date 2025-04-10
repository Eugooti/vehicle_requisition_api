const usersModel = require('../../models/user.model');
const requisitionsModel = require('../../models/Trip.model');
const departmentModel = require('../../models/departments.model');
const vehicleModel = require('../../models/vehicle.model');
const signatures = require('../../models/signatures.model');
const {handleErrors, successTransaction} = require("../../utils/errorHandlers");

const getDepartmentReport =async (req,res) => {
  try {


         const tripsList= await requisitionsModel.findAll({where:{departmentId:req.params.id},raw:true})
         const usersList = await usersModel.findAll({raw:true})
         const department = await departmentModel.findByPk(req.params.id)
         const vehicleList = await vehicleModel.findAll({raw:true})
         const signatureList = await signatures.findAll({raw:true})

      const findItem = (id,items)=>{
          return items?.find(item=>item.id === id);
      }


      const formattedData = tripsList.filter(item=>item.endTime).map(item => ({
          fullName:`${findItem(item.userId,usersList).firstName} ${findItem(item.userId,usersList)?.lastName}`,
          applicantSign:findItem(item.userId,signatureList)?.signature||'NA',
          date:item.pickupDate,
          time:item.pickupTime,
          designation: findItem(item.userId,usersList).designation,
          phone: findItem(item.userId,usersList).phone,
          grade: findItem(item.userId,usersList).grade,
          pickup:item.pickupPoint,
          destination:item.destination,
          passengerNumber:item.travellersCount,
          purpose:item.purpose,
          id:item.id,
          driver:`${findItem(item.driverId,usersList)?.firstName} ${findItem(item.driverId,usersList)?.lastName}`,
          driverSign:findItem(item.driverId,signatureList)?.signature||'NA',
          approver:`${findItem(item.approverId,usersList)?.firstName} ${findItem(item.approverId,usersList)?.lastName}`,
          approverSign:findItem(item.approverId,signatureList)?.signature||'NA',
          vehicle:findItem(item.vehicleId,vehicleList)?.numberPlate,
          allocator:`${findItem(item.allocatorId,usersList)?.firstName} ${findItem(item.allocatorId,usersList)?.lastName}`,
          allocatorSign:findItem(item.allocatorId,signatureList)?.signature||'NA',
          department:department?.name,
          returnDate:item?.returnDate,
          notes:item.allocatorNote,
          allocationMode:item.allocationMode,
      }))
      return successTransaction(res,'read',formattedData)

  }catch(err){
      return handleErrors(res,err)
  }
}
const getAllReport =async (req,res) => {
  try {
      const tripsList = await requisitionsModel.findAll({ raw: true });
      const usersList = await usersModel.findAll({ raw: true });
      const departmentList = await departmentModel.findAll({ raw: true });
      const vehicleList = await vehicleModel.findAll({ raw: true });
      const signatureList = await signatures.findAll({ raw: true });


      const findItem = (id,list)=>{
          return list.find(item=>item.id === id);
      }

      const formattedData = tripsList.filter(item=>item.endTime).map(item => ({
          fullName:`${findItem(item.userId,usersList)?.firstName} ${findItem(item.userId,usersList)?.lastName}`,
          applicantSign:findItem(item.userId,signatureList)?.signature,
          date:item.pickupDate,
          time:item.pickupTime,
          designation: findItem(item.userId,usersList).designation,
          phone: findItem(item.userId,usersList).phone,
          grade: findItem(item.userId,usersList).grade,
          pickup:item.pickupPoint,
          destination:item.destination,
          passengerNumber:item.travellersCount,
          purpose:item.purpose,
          id:item.id,
          driver:`${findItem(item.driverId,usersList)?.firstName} ${findItem(item.driverId,usersList)?.lastName}`,
          driverSign:findItem(item.driverId,signatureList)?.signature,
          approver:`${findItem(item.approverId,usersList)?.firstName} ${findItem(item.approverId,usersList)?.lastName}`,
          approverSign:findItem(item.approverId,signatureList)?.signature,
          vehicle:findItem(item.vehicleId,vehicleList)?.numberPlate,
          allocator:`${findItem(item.allocatorId,usersList)?.firstName} ${findItem(item.allocatorId,usersList)?.lastName}`,
          allocatorSign:findItem(item.allocatorId,signatureList)?.signature,
          department:findItem(item.departmentId,departmentList).name,
          returnDate:item?.returnDate,
          notes:item.allocatorNote,
          allocationMode:item.allocationMode,
      }))

      return successTransaction(res,'read',formattedData)

  }catch(err){
      console.log(err)
      return handleErrors(res,err)
  }
}




module.exports= {getDepartmentReport, getAllReport};