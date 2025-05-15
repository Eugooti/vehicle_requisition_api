const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const rolesModel = require("../../models/roles.model")
const signatureModel = require("../../models/signatures.model")
const crypto = require("crypto");
const CreateUser = async (model,req,res) => {
    const sequelize = model.sequelize;
    const transaction =  await sequelize.transaction();
  try {
      const {email,roles,departmentId,sign} = req.body;
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.createHash('sha256').update(email + salt).digest('hex');

      const user  = {
          ...req.body,
          password: hashedPassword,
          salt
      }
      const result = await model.create(user,{transaction});

      const formatRoles = roles.some(item=>item==='applicant')?roles.map(role=>({
          role: role,
          userId:result.id,
          departmentId
      })):[...roles,"applicant"].map((role)=>({
          role: role,
          userId:result.id,
          departmentId
      }))

      const signatureData = {
          signature:sign,
          userId:result.id,
      }

      await signatureModel.create(signatureData,{transaction});
      await rolesModel.bulkCreate(formatRoles,{transaction});

      await transaction.commit();
      return successTransaction(res,'created');


  }catch(err) {
      await transaction.rollback()
      return handleErrors(res,err)
  }
}

module.exports = {CreateUser}