const usersModel = require('../../models/user.model');
const requisitionsModel = require('../../models/Trip.model');
const departmentModel = require('../../models/departments.model');
const vehicleModel = require('../../models/vehicle.model');
const signatures = require('../../models/signatures.model');
const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const {Op} = require("sequelize");

/**
 * Get reports for a specific vehicle
 * @param {Object} req - Request object with vehicle ID in params
 * @param {Object} res - Response object
 * @returns {Object} - Formatted vehicle reports
 */
const getVehicleReport = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    
    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: "Vehicle ID is required"
      });
    }
    
    // Get all trips assigned to this vehicle
    const tripsList = await requisitionsModel.findAll({
      where: {
        vehicleId: vehicleId,
        endTime: { [Op.not]: null } // Only completed trips
      },
      raw: true
    });
    
    // Get related data
    const usersList = await usersModel.findAll({raw: true});
    const departmentList = await departmentModel.findAll({raw: true});
    const vehicleList = await vehicleModel.findAll({raw: true});
    const signatureList = await signatures.findAll({raw: true});
    
    // Early return if no trips
    if (tripsList.length === 0) {
      return successTransaction(res, 'No reports found for this vehicle', []);
    }
    
    // Helper functions
    const findItem = (id, list) => {
      if (!id) return null;
      return list.find(item => item.id === id) || null;
    };
    
    const findSignature = (id, items) => {
      return items?.find(item => item.userId === id);
    };
    
    // Format the data
    const formattedData = tripsList.map(trip => ({
      id: trip.id,
      date: trip.pickupDate,
      time: trip.pickupTime,
      returnDate: trip.returnDate,
      returnTime: trip.returnTime,
      
      // Trip details
      pickup: trip.pickupPoint,
      destination: trip.destination,
      purpose: trip.purpose,
      passengerNumber: trip.travellersCount,
      allocationMode: trip.allocationMode,
      
      // Timing details
      startTime: trip.startTime,
      endTime: trip.endTime,
      numberOfDays: trip.numberOfDays,
      
      // User (requester) details
      requester: `${findItem(trip.userId, usersList)?.firstName || ''} ${findItem(trip.userId, usersList)?.lastName || ''}`,
      requesterDesignation: findItem(trip.userId, usersList)?.designation,
      requesterPhone: findItem(trip.userId, usersList)?.phone,
      requesterSign: findSignature(trip.userId, signatureList)?.signature,
      
      // Driver details
      driver: `${findItem(trip.driverId, usersList)?.firstName || ''} ${findItem(trip.driverId, usersList)?.lastName || ''}`,
      driverSign: findSignature(trip.driverId, signatureList)?.signature,
      
      // Vehicle details
      vehicle: findItem(trip.vehicleId, vehicleList)?.numberPlate,
      vehicleMake: findItem(trip.vehicleId, vehicleList)?.make,
      vehicleModel: findItem(trip.vehicleId, vehicleList)?.model,
      vehicleCapacity: findItem(trip.vehicleId, vehicleList)?.capacity,
      
      // Approver details
      approver: `${findItem(trip.approverId, usersList)?.firstName || ''} ${findItem(trip.approverId, usersList)?.lastName || ''}`,
      approverSign: findSignature(trip.approverId, signatureList)?.signature,
      
      // Allocator details
      allocator: `${findItem(trip.allocatorId, usersList)?.firstName || ''} ${findItem(trip.allocatorId, usersList)?.lastName || ''}`,
      allocatorSign: findSignature(trip.allocatorId, signatureList)?.signature,
      allocatorNote: trip.allocatorNote,
      
      // Department details
      department: findItem(trip.departmentId, departmentList)?.name,
      departmentId: trip.departmentId,
      
      // Status details
      travelStatus: trip.travelStatus,
      approvalStatus: trip.approvalStatus,
    }));
    
    return successTransaction(res, 'read', formattedData);
  } catch (err) {
    console.error("Error in getVehicleReport:", err);
    return handleErrors(res, err);
  }
};

/**
 * Get reports for all vehicles
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} - Formatted vehicle reports grouped by vehicle
 */
const getAllVehiclesReports = async (req, res) => {
  try {
    // Get all completed trips
    const tripsList = await requisitionsModel.findAll({
      where: {
        vehicleId: { [Op.not]: null }, // Only trips with assigned vehicles
        endTime: { [Op.not]: null }   // Only completed trips
      },
      raw: true
    });
    
    // Get related data
    const usersList = await usersModel.findAll({raw: true});
    const departmentList = await departmentModel.findAll({raw: true});
    const vehicleList = await vehicleModel.findAll({raw: true});
    const signatureList = await signatures.findAll({raw: true});
    
    // Early return if no trips
    if (tripsList.length === 0) {
      return successTransaction(res, 'No vehicle reports found', []);
    }
    
    // Helper functions
    const findItem = (id, list) => {
      if (!id) return null;
      return list.find(item => item.id === id) || null;
    };
    
    const findSignature = (id, items) => {
      return items?.find(item => item.userId === id);
    };
    
    // Format the data
    const formattedData = tripsList.map(trip => ({
      id: trip.id,
      date: trip.pickupDate,
      time: trip.pickupTime,
      returnDate: trip.returnDate,
      returnTime: trip.returnTime,
      
      // Trip details
      pickup: trip.pickupPoint,
      destination: trip.destination,
      purpose: trip.purpose,
      passengerNumber: trip.travellersCount,
      allocationMode: trip.allocationMode,
      
      // Timing details
      startTime: trip.startTime,
      endTime: trip.endTime,
      numberOfDays: trip.numberOfDays,
      
      // User (requester) details
      requester: `${findItem(trip.userId, usersList)?.firstName || ''} ${findItem(trip.userId, usersList)?.lastName || ''}`,
      requesterDesignation: findItem(trip.userId, usersList)?.designation,
      requesterPhone: findItem(trip.userId, usersList)?.phone,
      requesterSign: findSignature(trip.userId, signatureList)?.signature,
      
      // Driver details
      driver: `${findItem(trip.driverId, usersList)?.firstName || ''} ${findItem(trip.driverId, usersList)?.lastName || ''}`,
      driverSign: findSignature(trip.driverId, signatureList)?.signature,
      
      // Vehicle details
      vehicle: findItem(trip.vehicleId, vehicleList)?.numberPlate,
      vehicleMake: findItem(trip.vehicleId, vehicleList)?.make,
      vehicleModel: findItem(trip.vehicleId, vehicleList)?.model,
      vehicleCapacity: findItem(trip.vehicleId, vehicleList)?.capacity,
      vehicleId: trip.vehicleId,
      
      // Approver details
      approver: `${findItem(trip.approverId, usersList)?.firstName || ''} ${findItem(trip.approverId, usersList)?.lastName || ''}`,
      approverSign: findSignature(trip.approverId, signatureList)?.signature,
      
      // Allocator details
      allocator: `${findItem(trip.allocatorId, usersList)?.firstName || ''} ${findItem(trip.allocatorId, usersList)?.lastName || ''}`,
      allocatorSign: findSignature(trip.allocatorId, signatureList)?.signature,
      allocatorNote: trip.allocatorNote,
      
      // Department details
      department: findItem(trip.departmentId, departmentList)?.name,
      departmentId: trip.departmentId,
      
      // Status details
      travelStatus: trip.travelStatus,
      approvalStatus: trip.approvalStatus,
    }));
    
    // Group reports by vehicle
    const groupedByVehicle = {};
    formattedData.forEach(report => {
      const vehicleId = report.vehicleId;
      if (!groupedByVehicle[vehicleId]) {
        const vehicleInfo = findItem(vehicleId, vehicleList);
        groupedByVehicle[vehicleId] = {
          vehicleId: vehicleId,
          numberPlate: vehicleInfo?.numberPlate,
          make: vehicleInfo?.make,
          model: vehicleInfo?.model,
          capacity: vehicleInfo?.capacity,
          trips: []
        };
      }
      groupedByVehicle[vehicleId].trips.push(report);
    });
    
    return successTransaction(res, 'read', Object.values(groupedByVehicle));
  } catch (err) {
    console.error("Error in getAllVehiclesReports:", err);
    return handleErrors(res, err);
  }
};

module.exports = { getVehicleReport, getAllVehiclesReports };