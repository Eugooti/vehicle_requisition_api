const dbConnection = require('../config/Db/db.config')
const {DataTypes} = require('sequelize');

const rolesModel = dbConnection.define('roles', {
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    userId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
    },
    role:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    departmentId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id'
        },
        onUpdate: 'CASCADE'
    }
})

// rolesModel.sync()

module.exports = rolesModel;