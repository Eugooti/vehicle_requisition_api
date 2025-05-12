const sequelize = require('../config/Db/db.config')
const {DataTypes} = require('sequelize');

const feedback = sequelize.define('feedback', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    tripId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'trips',
            key: 'id',
        },
        onDelete: 'CASCADE',
        unique:true
    },
    carCleanliness: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    chooseSameDriver: {
        type: DataTypes.ENUM('yes', 'no'),
        allowNull: false,
    },
    chooseSameDriverReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    driverCourtesy: {
        type: DataTypes.ENUM('yes', 'no'),
        allowNull: false,
    },
    driverGrooming: {
        type: DataTypes.ENUM('yes', 'no'),
        allowNull: false,
    },
    overallRating: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    safety: {
        type: DataTypes.ENUM('yes', 'no'),
        allowNull: false,
    },
    timeManagement: {
        type: DataTypes.ENUM('yes', 'no'),
        allowNull: false,
    }
});

feedback.sync()

module.exports = feedback