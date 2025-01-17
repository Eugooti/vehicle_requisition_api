const model  = require('../../models/approvers.model')
const {CRUDMethods} = require("../../handlers/CRUD Handlers/general");

module.exports = CRUDMethods(model)