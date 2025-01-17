const model = require('../../models/user.model')
const {authHandlers} = require("../../handlers/authHandler");

module.exports = authHandlers(model)