const express = require("express");
const tripsController = require('../controller/Trip/tripController')
const {catchErrors} = require("../utils/errorHandlers");
const {accessControl} = require("../config/auth/RoleBasedAccess/accessControl");

const router = express.Router();

router.route('/trip/create').post(catchErrors(tripsController.createTravel))
router.route('/trip/read').get(catchErrors(tripsController.read))
router.route('/trip/read/:id').get(catchErrors(tripsController.readById))
router.route('/trip/read/department/:id').get(catchErrors(tripsController.readByDpt))
router.route('/trip/approve/:id').put(catchErrors(tripsController.approveTravel))
router.route('/trip/assign/:id').put(catchErrors(tripsController.allocation))
router.route('/trip/startEnd/:id').put(catchErrors(tripsController.update))

module.exports = router