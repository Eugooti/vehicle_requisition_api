const {CRUDMethods} = require("../CRUD Handlers");
const {CreateUser} = require("./CreateUser");
const {ReadUsers, readUsersByRole} = require("./readUsers");
const userHandlers =  (model) => {
  const methods = CRUDMethods(model)

    methods.createUser = async (req, res) => {
        await CreateUser(model,req,res)
    }

    methods.readUsers = async (req, res) => {
      await ReadUsers(req,res)
    }

    methods.readUsersByRole = async (req, res) => {
     return  await readUsersByRole(req,res)
    }

    return methods
}

module.exports = {userHandlers}