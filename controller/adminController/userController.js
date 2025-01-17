const model = require('../../models/user.model')
const {userHandlers} = require("../../handlers/userHandlers");

module.exports = userHandlers(model)