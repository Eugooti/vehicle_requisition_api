const model = require('../../models/roles.model')
const {CRUDMethods} = require("../../handlers/CRUD Handlers/general");

module.exports = CRUDMethods(model)