const {handleErrors, successTransaction, notFound} = require("../../utils/errorHandlers");
const userModel = require("../../models/user.model");
const departmentModel = require("../../models/departments.model");
const rolesModel = require("../../models/roles.model");
const {Op} = require("sequelize");

const ReadUsers = async (req,res) => {
  try {
      const usersList = await userModel.findAll();
      const departmentsList = await departmentModel.findAll();

      const findDepartment = (departmentId) => {
        return departmentsList.find((department) => department.id === departmentId);
      }

      const formattedData = usersList.map((user,index) => ({
          key: index+1,
          fullName:`${user.firstName} ${user.lastName}`,
          email:user.email,
          designation:user.designation,
          department: findDepartment(user.departmentId).name,
          phone:user.phone,
          activeState:user.available,
          departmentId: user.departmentId,
          userId: user.id,
      }))

      return successTransaction(res,"read", formattedData);


  }catch(err) {
      return handleErrors(res, err);
  }
}

const readUsersByRole = async (req,res) => {
  try {
      const {role} = req.params;

      const roles = await rolesModel.findAll({where:{role:role}});

      if(roles.length <= 0){
          return notFound(res,"No roles found");
      }

      const uniqueUserIds = [...new Set(roles.map(r => r.userId))];

      const findUsers = await userModel.findAll({where:{id:{[Op.in]:uniqueUserIds},}});

      const formatUsers = findUsers.map((user,index) => ({
          id:user.id,
          name:`${user.firstName} ${user.lastName}`,
      }))

      return successTransaction(res,"read", formatUsers);

  }catch(err) {
      return handleErrors(res, err);
  }
}

module.exports = {ReadUsers,readUsersByRole}