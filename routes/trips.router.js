const express = require("express");
const tripsController = require('../controller/Trip/tripController')
const {catchErrors} = require("../utils/errorHandlers");
const reservationController = require("../controller/Trip/ReservationsController");
const router = express.Router();

router.route('/trip/create').post(catchErrors(tripsController.create))
router.route('/trip/read').get(catchErrors(tripsController.read))
router.route('/trip/read/:id').get(catchErrors(tripsController.readById))
router.route('/trip/read/department/:id').get(catchErrors(tripsController.readByDpt))
router.route('/trip/read/user/:id').get(catchErrors(tripsController.readByUserId))
router.route('/trip/approve/:id').put(catchErrors(tripsController.update))
router.route('/trip/assign/:id').put(catchErrors(tripsController.update))
router.route('/trip/startEnd/:id').put(catchErrors(tripsController.update))
router.route('/trip/recall/:id').delete(catchErrors(tripsController.delete))
router.route('/vehicle/reservation/:id').put(catchErrors(tripsController.reservation))

router.route('/reservation/create').post(catchErrors(reservationController.create))
router.route('/reservation/read').get(catchErrors(reservationController.read))
router.route('/reservation/read/:id').get(catchErrors(reservationController.readById))
router.route('/reservation/update/:id').put(catchErrors(reservationController.update))
router.route('/reservation/delete/:id').delete(catchErrors(reservationController.delete))



module.exports = router