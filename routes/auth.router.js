const express = require('express');
const authController = require('../controller/auth/authController')
const sigController = require('../controller/auth/Signature.controller')
const {catchErrors} = require("../utils/errorHandlers");
const feedbackController = require('../controller/Trip/feedback.controller')
const {authenticateToken} = require("../config/auth/JWT/JWTAuthentication");


const router = express.Router();

router.route('/auth/login').post(catchErrors(authController.login))
router.route('/auth/logout').get(authenticateToken,catchErrors(authController.logout));
router.route('/auth/updatePassword/:id').put(catchErrors(authController.updatePassword))
router.route('/auth/refreshToken').post(catchErrors(authController.refreshToken));
router.route('/auth/getCode').put(catchErrors(authController.getCode));
router.route('/auth/verifyCode').put(catchErrors(authController.verifyResetCode));
router.route('/auth/changePassword/:id').put(catchErrors(authController.changePassword));
router.route('/auth/signature/create').post(catchErrors(sigController.create))


router.route('/feedback/create').post(catchErrors(feedbackController.create))


module.exports = router;