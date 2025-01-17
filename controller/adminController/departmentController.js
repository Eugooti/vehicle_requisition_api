const model = require('../../models/departments.model')
const {CRUDMethods} = require("../../handlers/CRUD Handlers/general");

module.exports = CRUDMethods(model)