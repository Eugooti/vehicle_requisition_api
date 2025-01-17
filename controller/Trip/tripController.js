const model = require('../../models/Trip.model')
const {TravelHandlers} = require("../../handlers/travelHandlers");

module.exports = TravelHandlers(model)