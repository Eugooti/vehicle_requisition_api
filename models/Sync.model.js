const departments = require("./departments.model");
const users = require("./user.model");
const vehicle = require("./vehicle.model");
const roles = require('./roles.model');
const trips = require("./Trip.model");
const schedule = require('./schedule.model');
const signature = require("./signatures.model");


const syncModel = async () => {
  try {
      await departments.sync();
      await users.sync();
      await vehicle.sync();
      await roles.sync();
      await trips.sync();
      await schedule.sync();
      await signature.sync();

      console.log("Model sync successfully");
      return true

  }catch(err) {
      return false;
  }
}

module.exports = syncModel;