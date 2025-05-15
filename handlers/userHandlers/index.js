const {CRUDMethods} = require("../CRUDHandlers");
const {CreateUser} = require("./CreateUser");
const {ReadUsers, readUsersByRole, readUsersForSelection} = require("./readUsers");
const userHandlers =  (model) => {
  const methods = CRUDMethods(model)

    methods.createUser = async (req, res) => {
        await CreateUser(model,req,res)
    }

    methods.readUsers = async (req, res) => {
      await ReadUsers(req,res)
    }

    methods.readUsersByRole = async (req, res) => {
        await readUsersByRole(req,res)
    }

    methods.readUsersForSelection = async (req,res)=>{
        await readUsersForSelection(req,res)
    }

    return methods
}

module.exports = {userHandlers}