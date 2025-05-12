const model = require('../../models/roles.model')
const {CRUDMethods} = require("../../handlers/CRUDHandlers");

module.exports = CRUDMethods(model)