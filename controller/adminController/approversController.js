const model  = require('../../models/approvers.model')
const {CRUDMethods} = require("../../handlers/CRUD Handlers");

module.exports = CRUDMethods(model)