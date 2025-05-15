    const express = require("express");
    const tripsController = require('../controller/Trip/tripController')
    const {catchErrors} = require("../utils/errorHandlers");
    const reservationController = require("../controller/Trip/ReservationsController");
    const router = express.Router();

    router.route('/trip/create').post(catchErrors(tripsController.createTravel))
    router.route('/trip/update/:id').put(catchErrors(tripsController.updateTrip))
    router.route('/trip/read').get(catchErrors(tripsController.readAllRequisition))
    router.route('/trip/read/:id').get(catchErrors(tripsController.readById))
    router.route('/trip/read/department/:id').get(catchErrors(tripsController.readRequisitionsByDepartment))
    router.route('/trip/read/user/:id').get(catchErrors(tripsController.readTripsByUser))
    router.route('/trip/approve/:id').put(catchErrors(tripsController.approveTravel))
    router.route('/trip/assign/:id').put(catchErrors(tripsController.Allocation))
    router.route('/trip/ownMeans/:id').put(catchErrors(tripsController.ownMeans))
    router.route('/trip/start/:id').put(catchErrors(tripsController.update))
    router.route('/trip/end/:id').put(catchErrors(tripsController.endTrip))
    router.route('/trip/recall/:id').delete(catchErrors(tripsController.delete))
    router.route('/trip/deallocate/:id').put(catchErrors(tripsController.deallocate))
    router.route('/vehicle/available').put(catchErrors(tripsController.availableVehicles))

//reports

    router.route('/trip/reports').get(catchErrors(tripsController.getAllReport))
    router.route('/trip/reports/:id').get(catchErrors(tripsController.readDepartmentReport))

    router.route('/reservation/create').post(catchErrors(reservationController.create))
    router.route('/reservation/read').get(catchErrors(reservationController.read))
    router.route('/reservation/read/:id').get(catchErrors(reservationController.readById))
    router.route('/reservation/update/:id').put(catchErrors(reservationController.update))
    router.route('/reservation/delete/:id').put(catchErrors(reservationController.deallocateReservation))


    router.route('/schedule/read').get(catchErrors(tripsController.readSchedules))
    router.route('/schedule/driver/:id').get(catchErrors(tripsController.driverSchedule))



module.exports = router