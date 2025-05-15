const {CRUDMethods} = require("../CRUDHandlers");
const {resourceAllocation} = require("./resourceAllocation");
const {deallocate} = require("./deallocate");
const {AvailableVehicles} = require("./AvailableVehicles");
const {allocation} = require('./allocation')
const {readSchedules} = require("./readSchedules");
const {ownMeans} = require("./ownMeans");
const {readRequisitionsByDepartment, readAllRequisition, readTripsByUser} = require("./ReadRequisition");
const {approve} = require("./approve");
const {getDepartmentReport, getAllReport} = require("./ReadReports");
const {CreateRequisition} = require("./createRequisition");
const {ReadDriverSchedules} = require("./readDriverSchedules");
const {TripManagement} = require("./TripManagement");
const {updateTrip} = require("./updateTrip");


const TravelHandlers = (model) => {
    const methods = CRUDMethods(model)

    methods.createTravel = async (req,res)=>{
        await CreateRequisition(req,res)
    }

    methods.readRequisitionsByDepartment = async (req,res)=>{
        await readRequisitionsByDepartment(req,res)
    }

    methods.readAllRequisition = async (req,res)=>{
        await readAllRequisition(req,res)
    }

    methods.readTripsByUser=async (req,res)=>{
        await readTripsByUser(req,res)
    }

    methods.approveTravel = async (req,res)=>{
        await approve(req,res)
    }

    methods.allocation = async (req,res)=>{
        await resourceAllocation(model,req,res)
    }

    methods.deallocate = async (req,res)=>{
        await  deallocate(req,res)
    }


    methods.availableVehicles = async (req,res)=>{
        await AvailableVehicles(req,res)
    }

    methods.Allocation = async (req,res)=>{
        await allocation(req,res)
    }

    methods.readSchedules = async (req,res)=>{
        await readSchedules(req,res)
    }


    methods.ownMeans = async (req,res)=>{
        await ownMeans(req,res)
    }

    methods.readDepartmentReport = async (req,res)=>{
        await getDepartmentReport(req,res)
    }

    methods.getAllReport = async (req,res)=>{
        await getAllReport(req,res);
    }

    methods.driverSchedule = async (req,res)=>{
        await ReadDriverSchedules(req,res)
    }

    methods.endTrip = async (req,res)=>{
        await TripManagement(req,res)
    }

    methods.updateTrip=async (req,res)=>{
        await updateTrip(req,res)
    }

    return methods;
}

module.exports = {TravelHandlers};