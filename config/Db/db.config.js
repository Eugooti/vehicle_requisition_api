const Sequelize = require('sequelize');

// Create a Sequelize instance
const sequelize = new Sequelize('ebk_travel_management', 'root', 'IN16/00054/19', {
    host: 'localhost', // MySQL server host
    dialect: 'mysql',
    port: 3306,
    logging: false,
    timezone: '+03:00', // Set timezone to EAT
});

module.exports=sequelize;