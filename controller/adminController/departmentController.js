const model = require('../../models/departments.model')
const {CRUDMethods} = require("../../handlers/CRUD Handlers");

module.exports = CRUDMethods(model)