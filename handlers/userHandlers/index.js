const {CRUDMethods} = require("../CRUD Handlers");
const {CreateUser} = require("./CreateUser");
const {ReadUsers} = require("./readUsers");
const userHandlers =  (model) => {
  const methods = CRUDMethods(model)

    methods.createUser = async (req, res) => {
        await CreateUser(model,req,res)
    }

    methods.readUsers = async (req, res) => {
      await ReadUsers(req,res)
    }

    return methods
}

module.exports = {userHandlers}