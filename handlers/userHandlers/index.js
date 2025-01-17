const {CRUDMethods} = require("../CRUD Handlers/general");
const {CreateUser} = require("./CreateUser");
const userHandlers =  (model) => {
  const methods = CRUDMethods(model)

    methods.createUser = async (req, res) => {
        await CreateUser(model,req,res)
    }

    return methods
}

module.exports = {userHandlers}