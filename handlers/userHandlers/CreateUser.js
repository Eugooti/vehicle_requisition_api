const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const crypto = require("crypto");
const CreateUser = async (model,req,res) => {
  try {
      const {email} = req.body;
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.createHash('sha256').update(email + salt).digest('hex');

      const user  = {
          ...req.body,
          password: hashedPassword,
          salt
      }
      const result = await model.create(user);

      const {id,departmentId} = result

      const data = {id:id,departmentId:departmentId};

      if (result) {
          return successTransaction(res,'created', data);
      }

  }catch(err) {
      return handleErrors(res,err)
  }
}

module.exports = {CreateUser}