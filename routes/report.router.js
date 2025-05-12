const router = require('express').Router()
const reportsController = require('../controller/reportsController/reports.controller')
const {catchErrors} = require("../utils/errorHandlers");

router.route('/report/driver').get(catchErrors(reportsController.getAllDriversReports))
router.route('/report/driver/:id').get(catchErrors(reportsController.getDriverReport))
router.route('/report/vehicle').get(catchErrors(reportsController.getAllVehiclesReports))
router.route('/report/vehicle/:id').get(catchErrors(reportsController.getVehicleReport))

module.exports = router;

