const Sequelize = require('sequelize');
require('dotenv').config();

// Create a Sequelize instance
const sequelize = new Sequelize(process.env.DBNAME, process.env.DBUSER, process.env.DBPASSWORD, {
    host: 'localhost', // MySQL server host
    dialect: 'mysql',
    port: 3306,
    logging: false,
    timezone: '+03:00', // Set timezone to EAT
});

module.exports=sequelize;