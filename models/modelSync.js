const departments = require("./departments.model");
const users = require("./user.model");
const vehicle = require("./vehicle.model");
const trips = require("./Trip.model");
const roles = require('./roles.model');
const reservations = require('./reservations.model');


const modelSync = async () => {
  try {
      await departments.sync();
      await users.sync();
      await vehicle.sync();
      await roles.sync();
      await trips.sync();
      await reservations.sync();

      console.log("Model sync successfully");
      return true

  }catch(err) {
      console.log(err);
      return false;
  }
}

module.exports = modelSync;