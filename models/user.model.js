const { DataTypes} = require('sequelize')
const dbConnection = require('../config/Db/db.config')

const users = dbConnection.define('users', {
    id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true
    },
        firstName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName:{
        type: DataTypes.STRING,
        allowNull: false
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    grade:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    designation:{
        type: DataTypes.STRING,
        allowNull: false
    },
    departmentId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id'
        },
        onUpdate: 'CASCADE'
    },
    available:{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    password:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    salt:{
      type: DataTypes.STRING,
      allowNull: false,
    }
})

users.sync()

module.exports = users;