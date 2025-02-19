const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const userModel = require("../../models/user.model");
const departmentModel = require("../../models/departments.model");
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

module.exports = {ReadUsers}