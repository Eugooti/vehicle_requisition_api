const dbConnection = require('../config/Db/db.config')
const {DataTypes} = require('sequelize');

const reservations = dbConnection.define('reservations', {
    id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    vehicleId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'vehicles',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        unique:true
    },
    tripId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'trips',
            key: 'id',
        },
        onUpdate: 'CASCADE',
        unique:true
    },
    pickupDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    pickupTime: {
        type: DataTypes.TIME,
        allowNull: false,
    }
})

reservations.sync()
module.exports = reservations;