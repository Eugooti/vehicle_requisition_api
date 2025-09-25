// This file is used to close database connections after all tests have completed
const sequelize = require('../config/Db/db.config');

module.exports = async () => {
  // Close the Sequelize connection
  if (sequelize) {
    await sequelize.close();
    console.log('Database connection closed');
  }
};