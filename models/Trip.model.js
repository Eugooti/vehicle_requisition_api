const dbConnection  = require('../config/Db/db.config')
const {DataTypes} = require('sequelize')

const trip = dbConnection.define('trip', {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    userId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE'  // Update department when the associated user's id is updated
    },
    departmentId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id'
        },
        onUpdate: 'CASCADE'  // Update department when the associated user's id is updated
    },

    purpose:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    pickupPoint:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    destination:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    travellersCount:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    pickupDate:{
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    pickupTime:{
        type: DataTypes.TIME,
        allowNull: false,
    },
    returnDate:{
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    returnTime:{
        type: DataTypes.TIME,
        allowNull: false,
    },
    numberOfDays:{
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    travelStatus:{
        type: DataTypes.ENUM('Complete','Canceled','Travelling','Processing'),
        allowNull: false,
        defaultValue: 'Processing'
    },
    approvalStatus:{
        type: DataTypes.ENUM('Pending','Approved','Rejected',"Unapproved"),
        allowNull: false,
        defaultValue: 'Pending'
    },
    approverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE'  // Update trip when the associated vehicle's id is updated
    },
    vehicleId:{
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'vehicles',
            key: 'id'
        },
        onUpdate: 'CASCADE'  // Update trip when the associated vehicle's id is updated

    },
    driverId:{
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE'  // Update trip when the associated user's id is updated
    },
    allocationMode:{
        type: DataTypes.ENUM("Own Means","Allocated","Unallocated"),
        allowNull: true,
    },
    allocatorId:{
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE'
    },
    allocatorNote:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    startTime:{
        type: DataTypes.DATE,
        allowNull: true,
    },
    endTime:{
        type: DataTypes.DATE,
        allowNull: true,
    },
    denialReason:{
        type: DataTypes.STRING,
        allowNull: true,
    }

})

trip.sync()

module.exports = trip