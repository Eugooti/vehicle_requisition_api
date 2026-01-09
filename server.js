// server.js - Fixed version
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const modelSync = require('./models/Sync.model');
const crypto = require("crypto");
const authRoutes = require('./routes/auth.router');
const tripsRoutes = require('./routes/trips.router');
const adminRoutes = require('./routes/admin.router');
const reportRoutes = require('./routes/report.router');
const {notFound, developmentErrors, productionErrors} = require("./utils/errorHandlers");
const {authenticateToken} = require("./config/auth/JWT/JWTAuthentication");
require('dotenv').config();
const cron = require('node-cron');
const routineUpdates = require('./handlers/automatedTasks/approvalSchedule');
const notifications = require('./handlers/automatedTasks/notifications');

const port = process.env.PORT || 4500;
const host = '0.0.0.0'; // Important for Docker

const generateSecretKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

const app = express();

// Health endpoint
app.get('/ebk/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'vehicle-api'
    });
});

modelSync().then(connection => {
    if (connection) {
        console.log('Database connected successfully');

        // Set timezone for cron
        const timezone = process.env.TZ || 'UTC';
        console.log(`Using timezone: ${timezone}`);

        // FIXED: Proper cron syntax with timezone
        if (process.env.NODE_ENV !== 'test') {
            // Reminders at 1:00 PM daily
            cron.schedule('0 13 * * *', async () => {
                console.log(`${new Date().toISOString()}: Running reminder notifications`);
                try {
                    await notifications.notifyRequisitions();
                    await notifications.notifyManagers();
                    await notifications.notifyAdmins();
                } catch (error) {
                    console.error('Error in reminder cron job:', error);
                }
            }, {
                scheduled: true,
                timezone: timezone
            });

            // Updates at 12:01 AM daily
            cron.schedule('1 0 * * *', async () => {
                console.log(`${new Date().toISOString()}: Running scheduled updates`);
                try {
                    await routineUpdates.updateUnapprovedTrips();
                    await routineUpdates.updateUnallocatedTrips();
                    await routineUpdates.updateCompletedTrips();
                } catch (error) {
                    console.error('Error in update cron job:', error);
                }
            }, {
                scheduled: true,
                timezone: timezone
            });
        }

        app.use(cors({
            origin: process.env.ALLOWED_ORIGINS ?
                process.env.ALLOWED_ORIGINS.split(',') :
                ['http://localhost:5174','http://localhost:5173'],
            methods: ['GET', 'POST', 'DELETE', 'PUT'],
            credentials: true
        }));
        app.use(morgan('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(cookieParser());
        app.use(session({
            secret: process.env.SESSION_SECRET || generateSecretKey(),
            resave: false,
            saveUninitialized: false,
        }));

        app.use('/ebk', authRoutes);
        app.use('/ebk', authenticateToken, tripsRoutes);
        app.use('/ebk', authenticateToken, adminRoutes);
        app.use('/ebk', authenticateToken, reportRoutes);

        app.use(notFound);

        if (process.env.NODE_ENV === 'development') {
            app.use(developmentErrors);
        } else {
            app.use(productionErrors);
        }

        const server = app.listen(port, () => {
            console.log(`✅ Server running on http://${'localhost'}:${port}/ebk`);
            console.log(`🕒 Timezone: ${timezone}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received: shutting down gracefully');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT received: shutting down gracefully');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    } else {
        console.log('Unable to connect to the database.');
        process.exit(1);
    }
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});