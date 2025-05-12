const model = require('../../models/departments.model')
const {CRUDMethods} = require("../../handlers/CRUDHandlers");

module.exports = CRUDMethods(model)