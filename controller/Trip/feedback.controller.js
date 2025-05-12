const {CRUDMethods} = require("../../handlers/CRUDHandlers");
const model = require('../../models/feedback.model')
module.exports = CRUDMethods(model)