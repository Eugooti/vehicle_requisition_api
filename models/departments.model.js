const {DataTypes}= require('sequelize');
const dbConnection=require('../config/Db/db.config');

const departmentModel = dbConnection.define('departments',{
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    type:{
        type: DataTypes.ENUM("Department","Directorate"),
        allowNull: false,
    },
    responsibility:{
        type: DataTypes.STRING,
        allowNull: false,
    }
})

departmentModel.sync()

module.exports = departmentModel;