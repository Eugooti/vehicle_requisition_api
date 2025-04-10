const express = require('express');
const authController = require('../controller/auth/authController')
const sigController = require('../controller/auth/Signature.controller')
const {catchErrors} = require("../utils/errorHandlers");
const router = express.Router();

router.route('/auth/login').post(catchErrors(authController.login))
router.route('/auth/logout').get(authController.logout);
router.route('/auth/updatePassword/:id').put(authController.updatePassword)
router.route('/auth/refreshToken').post(authController.refreshToken);
router.route('/auth/getCode').put(authController.getCode);
router.route('/auth/verifyCode').put(authController.verifyResetCode);
router.route('/auth/changePassword/:id').put(authController.changePassword);
router.route('/auth/signature/create').post(catchErrors(sigController.create))

module.exports = router;