const express = require('express');
const authController = require('../controller/auth/authController')
const {catchErrors} = require("../utils/errorHandlers");
const router = express.Router();

router.route('/auth/login').post(catchErrors(authController.login))
router.route('/auth/logout').get(authController.logout);
router.route('/auth/updatePassword/:id').put(authController.updatePassword)
router.route('/auth/refreshToken').post(authController.refreshToken);

module.exports = router;