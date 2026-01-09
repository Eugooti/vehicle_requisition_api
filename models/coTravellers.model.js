const {DataTypes}= require('sequelize');
const dbConnection=require('../config/Db/db.config');

const coTravellers = dbConnection.define('cotravellers',{
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    tripId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'trips',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    userId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onUpdate: 'CASCADE',
    }
})

// coTravellers.sync()

module.exports = coTravellers