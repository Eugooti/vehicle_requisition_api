const express = require('express')
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const modelSync = require('./models/modelSync')
const crypto = require("crypto");
const authRoutes = require('./routes/auth.router')
const tripsRoutes = require('./routes/trips.router')
const adminRoutes = require('./routes/admin.router')
const {notFound} = require("./utils/errorHandlers");
const {authenticateToken} = require("./config/auth/JWT/JWTAuthentication");
require('dotenv').config();


const port = process.env.PORT || 4500;
const generateSecretKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

const app = express()

modelSync().then(connection => {
    if (connection) {
        app.use(cors({
            origin: ['http://localhost:5174','http://localhost:5173'], // Frontend URL
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
        app.use('/ebk',tripsRoutes)
        app.use('/ebk',adminRoutes)

        app.use(notFound)

        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}/ebk`);
        })
    }
    else console.log(`Unable to connect to the database.`);
})

