const users = require("./user.model");
const departments = require("./departments.model");
const vehicle = require("./vehicle.model");
const trips = require("./Trip.model");
const roles = require('./roles.model');


const modelSync = async () => {
  try {
      await users.sync();
      await vehicle.sync();
      await departments.sync();
      await roles.sync();
      await trips.sync();

      console.log("Model sync successfully");
      return true

  }catch(err) {
      console.log(err);
      return false;
  }
}

module.exports = modelSync;