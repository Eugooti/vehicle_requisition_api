const model = require('../../models/vehicle.model')
const {CRUDMethods} = require("../../handlers/CRUDHandlers");

module.exports = CRUDMethods(model)