const model = require('../../models/roles.model')
const {CRUDMethods} = require("../../handlers/CRUD Handlers");

module.exports = CRUDMethods(model)