const sequelize = require('../config/Db/db.config');
const { DataTypes } = require('sequelize');

const logs = sequelize.define('logs',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'SET NULL', // Changed from CASCADE to preserve logs if user is deleted
    },
    loginEmail: {
        type: DataTypes.STRING(255), // Added length limit
        allowNull: true,
    },
    action: {
        type: DataTypes.STRING(100), // Added length limit
        allowNull: false,
    },
    entity: {
        type: DataTypes.STRING(100), // Added length limit
        allowNull: false,
    },
    entityId: {
        type: DataTypes.STRING, // Changed to STRING to support UUIDs or other ID types
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('Success', 'Failed', 'Pending'), // Added more statuses
        allowNull: false,
    },
    ipAddress: {
        type: DataTypes.STRING(45), // Supports IPv6 (max 45 chars)
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT, // Changed from STRING to TEXT for longer descriptions
        allowNull: false
    },
    metadata: {
        type: DataTypes.JSON, // For MySQL 5.7+ (stores as JSON type)
        allowNull: true,
        defaultValue: null,
        get() {
            const rawValue = this.getDataValue('metadata');
            return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
            this.setDataValue('metadata', value ? JSON.stringify(value) : null);
        }
    },
    timestamp: {
        type: DataTypes.DATE, // Explicit timestamp field
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false, // Disable default createdAt/updatedAt since we have our own timestamp
    paranoid: false, // Don't soft delete logs
    tableName: 'audit_logs', // More descriptive table name
    indexes: [
        {
            fields: ['entity'] // Index for faster filtering by entity
        },
        {
            fields: ['entityId'] // Index for faster filtering by entityId
        },
        {
            fields: ['userId'],
            name: 'audit_logs_user_id_manual' // Give it a unique name to avoid conflict with auto-generated FK index
        },
        {
            fields: ['status'] // Index for status filtering
        },
        {
            fields: ['timestamp'] // Index for time-based queries
        },
        {
            fields: ['action'] // Index for action filtering
        }
    ]
});

// For MySQL 5.6 or if JSON type isn't working, use TEXT instead:
// metadata: {
//     type: DataTypes.TEXT,
//     allowNull: true,
//     get() {
//         const rawValue = this.getDataValue('metadata');
//         return rawValue ? JSON.parse(rawValue) : null;
//     },
//     set(value) {
//         this.setDataValue('metadata', value ? JSON.stringify(value) : null);
//     }
// }

// logs.sync();

module.exports = logs;