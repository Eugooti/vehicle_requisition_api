const {handleErrors, itemNotFound, successTransaction} = require("../../utils/errorHandlers");
const usersModel = require("../../models/user.model");
const {JwtTokens} = require("../../config/auth/JWT/jwtTokens");
const {MailHandler} = require("../MailHandler/MailHandler");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();

const getCode = async (req,res) => {
  try {
      const {email} = req.body
      const findUser = await usersModel.findOne({where:{email:email}})

      if(!findUser){
          return itemNotFound(res,'User')
      }

      const JWTGenerator = new JwtTokens()

      const code = JWTGenerator.generateRandomCode()

      const user = {
          id:findUser.id,
          code:code,
      }

      const generateResetToken = JWTGenerator.generatePasswordResetToken(user)

      const sendCode = await MailHandler(email,'Password Reset Code.',
          `Your password reset OTP is: \n${code}`
          )

      if (!sendCode.success) {
          throw new Error("Failed to send email");
      }
      
      const ResetToken = {
          token:generateResetToken,
      }
      
      return successTransaction(res,null,ResetToken,'OTP has been sent to your email')

  }catch(err){
      return handleErrors(res,err)
  }
}

const verifyResetCode = async (req,res) => {
    const {token,code} = req.body
    if(!token || !code){
        return res.status(404).json({message: 'Token or Code Not Found'})
    }
    jwt.verify(token,process.env.REFRESH_SECRET_KEY,(err, user) => {
        if (err) {
            return res.status(404).json({message: 'Invalid token Provided.'})
        }

        if (user.code !== code){
            return res.status(404).json({message: 'Invalid code'})
        }

        return successTransaction(res,null,user,'Recovery code successfully verified')

    })
}

const changePassword = async (req,res) => {
    try {
        const {id} = req.params;
        const {newPassword} = req.body;
        const user = await usersModel.findByPk(id);
        if (!user) {
            return itemNotFound(res,"User")
        }
        const salt = crypto.randomBytes(16).toString('hex');
        user.password = crypto.createHash('sha256').update(newPassword + salt).digest('hex');
        user.salt = salt;
        await user.save();

        return successTransaction(res,"updated",user)

    }catch(err){
        return handleErrors(res,err)
    }
}

module.exports = {getCode,verifyResetCode,changePassword}