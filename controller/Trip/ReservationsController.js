const model = require('../../models/schedule.model')
const {TravelHandlers} = require("../../handlers/travelHandlers");

module.exports = TravelHandlers(model);