const usersModel = require('../../models/user.model');
const requisitionsModel = require('../../models/Trip.model');
const departmentModel = require('../../models/departments.model');
const vehicleModel = require('../../models/vehicle.model');
const signatures = require('../../models/signatures.model');
const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const {Op} = require("sequelize");

/**
 * Get reports for a specific driver
 * @param {Object} req - Request object with driver ID in params
 * @param {Object} res - Response object
 * @returns {Object} - Formatted driver reports
 */
const getDriverReport = async (req, res) => {
  try {
    const driverId = req.params.id;
    
    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: "Driver ID is required"
      });
    }
    
    // Get all trips assigned to this driver
    const tripsList = await requisitionsModel.findAll({
      where: {
        driverId: driverId,
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
      return successTransaction(res, 'No reports found for this driver', []);
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
      
      // Approver details
      approver: `${findItem(trip.approverId, usersList)?.firstName || ''} ${findItem(trip.approverId, usersList)?.lastName || ''}`,
      approverSign: findSignature(trip.approverId, signatureList)?.signature,
      
      // Vehicle details
      vehicle: findItem(trip.vehicleId, vehicleList)?.numberPlate,
      
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
    console.error("Error in getDriverReport:", err);
    return handleErrors(res, err);
  }
};

/**
 * Get reports for all drivers
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} - Formatted driver reports grouped by driver
 */
const getAllDriversReports = async (req, res) => {
  try {
    // Get all completed trips
    const tripsList = await requisitionsModel.findAll({
      where: {
        driverId: { [Op.not]: null }, // Only trips with assigned drivers
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
      return successTransaction(res, 'No driver reports found', []);
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
      driverId: trip.driverId,
      
      // Approver details
      approver: `${findItem(trip.approverId, usersList)?.firstName || ''} ${findItem(trip.approverId, usersList)?.lastName || ''}`,
      approverSign: findSignature(trip.approverId, signatureList)?.signature,
      
      // Vehicle details
      vehicle: findItem(trip.vehicleId, vehicleList)?.numberPlate,
      
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
    
    // Group reports by driver
    const groupedByDriver = {};
    formattedData.forEach(report => {
      const driverId = report.driverId;
      if (!groupedByDriver[driverId]) {
        groupedByDriver[driverId] = {
          driverId: driverId,
          driverName: report.driver,
          trips: []
        };
      }
      groupedByDriver[driverId].trips.push(report);
    });
    
    return successTransaction(res, 'read', Object.values(groupedByDriver));
  } catch (err) {
    console.error("Error in getAllDriversReports:", err);
    return handleErrors(res, err);
  }
};

module.exports = { getDriverReport, getAllDriversReports };