const {handleErrors, itemNotFound, successTransaction} = require("../../utils/errorHandlers");
const crypto = require("crypto");
const updatePassword = async (model,req,res) => {
  try {
      const {id} = req.params;
      const {password,newPassword} = req.body;

      const user = await model.findByPk(id);
      if (!user) {
          return itemNotFound(res,"User")
      }

      const hashedPassword = crypto.createHash('sha256').update(password+user.salt).digest('hex');

      if (hashedPassword !== user.password) {
          return res.status(404).json({
              success: false,
              message:"Passwords do not match."
          });
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

module.exports = {updatePassword};