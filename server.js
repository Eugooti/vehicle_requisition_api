const express = require('express')
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const modelSync = require('./models/Sync.model')
const crypto = require("crypto");
const authRoutes = require('./routes/auth.router')
const tripsRoutes = require('./routes/trips.router')
const adminRoutes = require('./routes/admin.router')
const reportRoutes = require('./routes/report.router')
const {notFound, developmentErrors, productionErrors} = require("./utils/errorHandlers");
const {authenticateToken} = require("./config/auth/JWT/JWTAuthentication");
require('dotenv').config();
const cron = require('node-cron');
const routineUpdates = require('./handlers/automatedTasks/approvalSchedule')
const notifications = require('./handlers/automatedTasks/notifications')



const port = process.env.PORT || 4500;
const host='192.168.1.82'
const scheduleTime = '56 14'

const generateSecretKey = () => {
    return crypto.randomBytes(32).toString('hex');
};


const app = express()

modelSync().then(connection => {
    if (connection) {

        cron.schedule(`${scheduleTime} * * *`, async () => {
            console.log(`Running the scheduled task at ${scheduleTime} HRS`);

            await notifications.notifyRequisitions()
            await notifications.notifyManagers()
            await notifications.notifyAdmins()

            await routineUpdates.updateUnapprovedTrips().then(state=>{
                if(state.success){
                    console.log(`Successfully updated ${state.count} unapproved trip records`);
                }else{
                    console.error("Failed to update unapproved trips:", state.error);
                }
            })

                await routineUpdates.updateUnallocatedTrips().then(state2=>{
                if(state2.success){
                    console.log(`Successfully updated ${state2.count} unallocated trip records`);
                }else{
                    console.error("Failed to update unallocated trips:", state2.error);
                }
            })

            await routineUpdates.updateCompletedTrips().then(state3=>{
                if(state3.success){
                    console.log(`Successfully updated ${state3.count} completed trip records`);
                }else{
                    console.error("Failed to update completed trips:", state3.error);
                }
            })
        });

        app.use(cors({
            origin: ['http://localhost:5174','http://localhost:5173',`http://${host}:5173`], // Frontend URL
            methods: ['GET', 'POST', 'DELETE', 'PUT'],
            credentials: true
        }));
        app.use(morgan('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(cookieParser());
        app.use(session({
            secret: generateSecretKey(),
            resave: false,
            saveUninitialized: false,
        }));

        app.use('/ebk',authRoutes);
        app.use('/ebk',authenticateToken,tripsRoutes)
        app.use('/ebk',authenticateToken,adminRoutes)
        app.use('/ebk',authenticateToken,reportRoutes)

        app.use(notFound)

        if (process.env.NODE_ENV === 'development') {
            app.use(developmentErrors)
        }else {
            app.use(productionErrors)
        }

        app.listen(port,() => {
            console.log(`Server running on http://localhost:${port}/ebk`);
            console.log(`Server running on http://${host}:${port}/ebk`);
        })
    }
    else console.log(`Unable to connect to the database.`);
})

