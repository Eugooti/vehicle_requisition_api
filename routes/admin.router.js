const express = require("express");
const userController = require("../controller/adminController/userController");
const departmentController = require("../controller/adminController/departmentController");
const rolesController = require("../controller/adminController/rolesController");
const vehicleController = require("../controller/adminController/vehicleController");
const {catchErrors} = require("../utils/errorHandlers");
const {accessControl} = require("../config/auth/RoleBasedAccess/accessControl");

const router = express.Router();

router.route("/user/create").post(accessControl(['all']),catchErrors(userController.createUser))
router.route("/users/read").get(catchErrors(userController.read))
router.route("/users/read/:id").get(catchErrors(userController.readById))
router.route('/users/read/department/:id').get(catchErrors(userController.readByDpt))
router.route("/users/update/:id").put(catchErrors(userController.update))
router.route("/users/delete/:id").delete(catchErrors(userController.delete))

router.route('/dpt/create').post(catchErrors(departmentController.create))
router.route('/dpt/read').get(catchErrors(departmentController.read))
router.route('/dpt/read/:id').get(catchErrors(departmentController.readById))
router.route('/dpt/read/user/:id').get(catchErrors(departmentController.readByUserId))
router.route('/dpt/update/:id').put(catchErrors(departmentController.update))
router.route('/dpt/delete/:id').delete(catchErrors(departmentController.delete))

router.route('/role/create').post(catchErrors(rolesController.create))
router.route('/role/createMany').post(accessControl(['assign-roles']),catchErrors(rolesController.createMany))
router.route('/role/read').get(catchErrors(rolesController.read))
router.route('/role/read/:id').get(catchErrors(rolesController.readById))
router.route('/role/read/department/:id').get(catchErrors(rolesController.readByDpt))
router.route('/role/read/user/:id').get(catchErrors(rolesController.readByUserId))
router.route('/role/update/:id').put(catchErrors(rolesController.update))
router.route('/role/delete/:id').delete(accessControl(['remove-role']),catchErrors(rolesController.delete))

router.route('/vehicle/create').post(accessControl(['add-Vehicle']),catchErrors(vehicleController.create))
router.route('/vehicle/read').get(accessControl(['read-vehicles']),catchErrors(vehicleController.read))
router.route('/vehicle/read/:id').get(accessControl(['read-vehicles']),catchErrors(vehicleController.readById))
router.route('/vehicle/update/:id').put(accessControl(['update-vehicle']),catchErrors(vehicleController.update))
router.route('/vehicle/delete/:id').delete(accessControl(['all']),catchErrors(vehicleController.delete))




module.exports = router;