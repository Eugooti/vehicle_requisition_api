const { getDriverReport, getAllDriversReports } = require('./driverReports');
const { getVehicleReport, getAllVehiclesReports } = require('./vehicleReports');


const reportHandler = () => {
  const methods = {};


  methods.getDriverReport = async (req, res) => {
    await getDriverReport(req, res);
  };
  methods.getAllDriversReports = async (req, res) => {
    await getAllDriversReports(req, res);
  };
  methods.getVehicleReport = async (req, res) => {
    await getVehicleReport(req, res);
  };
  methods.getAllVehiclesReports = async (req, res) => {
    await getAllVehiclesReports(req, res);
  };

  return methods;

}

module.exports = {reportHandler};
