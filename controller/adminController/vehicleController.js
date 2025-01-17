const model = require('../../models/vehicle.model')
const {CRUDMethods} = require("../../handlers/CRUD Handlers/general");

module.exports = CRUDMethods(model)