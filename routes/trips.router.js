const express = require("express");
const tripsController = require('../controller/Trip/tripController')
const {catchErrors} = require("../utils/errorHandlers");
const {accessControl} = require("../config/auth/RoleBasedAccess/accessControl");

const router = express.Router();

router.route('/trip/create').post(accessControl(["apply"]),catchErrors(tripsController.createTravel))
// router.route('/trip/read').get(catchErrors(tripsController.read))
// router.route('/trip/read/:id').get(catchErrors(tripsController.readById))
// router.route('/trip/update/:id').put(catchErrors(tripsController.update))
// router.route('/trip/delete/:id').post(catchErrors(tripsController.delete))

module.exports = router