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

      const sendCode = await MailHandler(
          email,
          "🔒 Your Password Reset Code (Expires in 3 Minutes)",
          `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border-radius: 10px; background: #ffffff; border: 1px solid #e0e6ed; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <!-- Header with lock icon -->
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="background: #f0f7ff; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
        <span style="color: #3b82f6; font-size: 28px;">🔐</span>
      </div>
      <h1 style="color: #1e3a8a; margin: 0; font-size: 22px;">Password Reset Request</h1>
      <p style="color: #6b7280; margin: 8px 0 0;">Use this one-time code to verify your identity</p>
    </div>

    <!-- Main content -->
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="color: #374151; margin: 0 0 15px; line-height: 1.5;">
        We received a request to reset your password. For security reasons, this code will expire in <strong>3 minutes</strong>.
      </p>
      
      <!-- OTP Box with copy functionality -->
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; position: relative;"
           onclick="navigator.clipboard.writeText('${code}')"
           onmouseover="this.style.background='#ebf4ff'; this.style.boxShadow='0 0 0 2px #bfdbfe'"
           onmouseout="this.style.background='#f5f5f5'; this.style.boxShadow='none'">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a; font-family: 'Courier New', monospace;">${code}</span>
        <div style="font-size: 12px; color: #64748b; margin-top: 10px; display: flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 5px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
          </svg>
          Click to copy
        </div>
        <div style="position: absolute; top: 5px; right: 5px; font-size: 10px; color: #ef4444; font-weight: bold;">VALID FOR 3 MIN</div>
      </div>

      <!-- Security notice -->
      <div style="background: #fef2f2; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 3px solid #ef4444;">
        <p style="color: #7f1d1d; margin: 0; font-size: 13px; display: flex; align-items: flex-start;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" style="margin-right: 8px; flex-shrink: 0;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <span>For your security, never share this code with anyone. Our support team will never ask for it.</span>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 15px;">
      <p style="margin: 5px 0;">If you didn't request this, please ignore this email or <a href={${process.env.SUPPORT_MAIL}} style="color: #3b82f6; text-decoration: none;">contact support</a> if concerned.</p>
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} Engineers Board of Kenya. All rights reserved.</p>
    </div>
  </div>
  `,
          true
      );

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