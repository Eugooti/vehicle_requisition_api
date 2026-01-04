const { Sequelize } = require('sequelize');

// DO NOT call dotenv here in production containers
// dotenv is already handled by Docker
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const sequelize = new Sequelize(
    process.env.DBNAME,
    process.env.DBUSER,
    process.env.DBPASSWORD,
    {
        host: process.env.DB_HOST, // MUST be 'db'
        port: 3306,
        dialect: 'mysql',
        logging: false,
        timezone: '+03:00',
    }
);

module.exports = sequelize;
