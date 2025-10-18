const model = require('../../models/reservations.model')
const {CRUDMethods} = require("../../handlers/CRUD Handlers/general");

module.exports = CRUDMethods(model)