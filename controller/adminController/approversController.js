const model  = require('../../models/approvers.model')
const {CRUDMethods} = require("../../handlers/CRUDHandlers");

module.exports = CRUDMethods(model)