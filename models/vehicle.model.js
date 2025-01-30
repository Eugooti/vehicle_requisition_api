const { DataTypes} = require('sequelize')
const dbConnection = require('../config/Db/db.config')

const vehicle = dbConnection.define('vehicle', {
    id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
    },
    make:{
      type: DataTypes.STRING,
      allowNull: false
    },
    model:{
        type: DataTypes.STRING,
        allowNull: false
    },
    numberPlate:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    createdBy:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE'  // Update department when the associated user's id is updated
    },
    availability:{
        type: DataTypes.ENUM("Reserved","Available","Maintenance","In Transit"),
        allowNull: false,
        defaultValue: "Available"
    }

})

vehicle.sync()

module.exports = vehicle