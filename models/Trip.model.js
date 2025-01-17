const dbConnection  = require('../config/Db/db.config')
const {DataTypes} = require('sequelize')

const trip = dbConnection.define('trip', {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    UserId:{
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
    scheduleDate:{
      type: DataTypes.DATE,
      allowNull: false,
    },
    scheduleTime:{
        type: DataTypes.TIME,
        allowNull: false,
    },
    approvalStatus:{
        type: DataTypes.ENUM('Pending','Approved','Rejected'),
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
        references: {
            model: 'vehicles',
            key: 'id'
        },
        onUpdate: 'CASCADE'  // Update trip when the associated vehicle's id is updated

    },
    driverId:{
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE'  // Update trip when the associated user's id is updated
    },
    startTime:{
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: new Date()
    },
    endTime:{
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: new Date()
    }

})

trip.sync()

module.exports = trip