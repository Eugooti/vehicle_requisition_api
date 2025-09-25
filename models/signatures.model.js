const sequelize = require('../config/Db/db.config')
const {DataTypes} = require('sequelize');

const signatures = sequelize.define('signatures', {
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
        onDelete: 'CASCADE',
    },
    signature:{
        type: DataTypes.TEXT,
        allowNull: false,
    }
})

signatures.sync()

module.exports = signatures