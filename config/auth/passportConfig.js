const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../../models/user.model');
const Department = require('../../models/departments.model');
const logs = require('../../models/logs.model');
const crypto = require('crypto');
const { Op } = require('sequelize');
const {getClientInfo} = require("../../utils/errorHandlers");
require('dotenv').config();

// // Hardcoded setup credentials
// const SETUP_EMAIL = "firstaccount@ebk.go.ke";
// const SETUP_PASSWORD = "E8K@1cT2025#";

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id, {
            attributes: { exclude: ["password", 'salt'] },
        });

        if (!user) {
            await logs.create({
                userId: id,
                action: "Session",
                loginEmail: null,
                entity: "User",
                entityId: id,
                status: "Failed",
                description: "User session deserialization failed",
                ipAddress: null,
                metadata: {
                    event: "deserializeUser",
                    errorType: "user_not_found"
                }
            });
            return done(null, false);
        }
        done(null, user);

    } catch(err) {
        await logs.create({
            userId: null,
            action: "Session",
            loginEmail: null,
            entity: "User",
            entityId: null,
            status: "Failed",
            description: "Session deserialization error",
            ipAddress: null,
            metadata: {
                error: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            }
        });
        done(err);
    }
});

passport.use(
    new LocalStrategy(
        {
            username: "email",
            password: "password",
            passReqToCallback: true
        },
        async (req, email, password, done) => {
            const clientInfo = getClientInfo(req);
            const baseLog = {
                userId: null,
                loginEmail: email,
                action: "Login",
                entity: "User",
                ipAddress: clientInfo.ipAddress,
                metadata: {
                    client: {
                        userAgent: clientInfo.userAgent,
                        protocol: clientInfo.protocol,
                        endpoint: req.originalUrl
                    },
                    timestamps: {
                        attempt: new Date().toISOString()
                    }
                }
            };

            try {
                // ADD DEBUG LOGGING
                console.log('🔍 [DEBUG] Login attempt received:', {
                    email,
                    password,
                    setupEmail: process.env.SETUP_EMAIL,
                    setupPassword: process.env.SETUP_PASSWORD
                });
                console.log('🔍 [DEBUG] Email match?', email === process.env.SETUP_EMAIL);
                console.log('🔍 [DEBUG] Password match?', password === process.env.SETUP_PASSWORD);

                // Check if setup credentials are being used
                if (email === process.env.SETUP_EMAIL && password === process.env.SETUP_PASSWORD) {
                    console.log('✅ [DEBUG] Setup credentials matched!');

                    // Check if system is already set up
                    const userCount = await User.count();
                    const departmentCount = await Department.count();
                    console.log('🔍 [DEBUG] System status:', { userCount, departmentCount });

                    if (userCount > 0 || departmentCount > 0) {
                        console.log('❌ [DEBUG] System already initialized, rejecting setup credentials');
                        await logs.create({
                            ...baseLog,
                            status: "Failed",
                            description: "Setup credentials used after system initialization",
                            metadata: {
                                ...baseLog.metadata,
                                security: {
                                    isKnownEmail: false,
                                    threatLevel: "high",
                                    reason: "Setup credentials attempted after initialization"
                                },
                                system: {
                                    userCount,
                                    departmentCount,
                                    status: "initialized"
                                }
                            }
                        });
                        return done(null, false, { message: 'User not found' });
                    }

                    // System not set up - create temporary setup user object
                    const setupUser = {
                        id: 'setup-user-' + Date.now(),
                        email: process.env.SETUP_EMAIL,
                        firstName: 'Setup',
                        lastName: 'Admin',
                        departmentId: null,
                        designation: 'System Administrator',
                        phone: null,
                        isSetupUser: true, // Flag to identify setup user
                        isSystemAdmin: true,
                        permissions: ['*']
                    };

                    console.log('✅ [DEBUG] Created setup user:', setupUser);

                    await logs.create({
                        ...baseLog,
                        status: "Success",
                        description: "Setup authentication successful - system not initialized",
                        metadata: {
                            ...baseLog.metadata,
                            user: {
                                type: "setup_user",
                                isTemporary: true
                            },
                            system: {
                                status: "uninitialized",
                                userCount,
                                departmentCount
                            },
                            session: {
                                initiatedAt: new Date().toISOString(),
                                purpose: "system_setup"
                            }
                        }
                    });

                    return done(null, setupUser);
                }

                console.log('🔍 [DEBUG] Not setup credentials, checking normal users...');

                // Normal user authentication
                const user = await User.findOne({ where: { email } });

                if (!user) {
                    console.log('❌ [DEBUG] User not found in database');
                    await logs.create({
                        ...baseLog,
                        status: "Failed",
                        description: "Authentication failed - user not found",
                        metadata: {
                            ...baseLog.metadata,
                            security: {
                                isKnownEmail: false,
                                threatLevel: "low"
                            }
                        }
                    });
                    return done(null, false, { message: 'User not found' });
                }

                // Rest of your normal authentication code...
                // Update base log with user context
                baseLog.userId = user.id;
                baseLog.entityId = user.id;

                const hashedPassword = crypto.createHash('sha256')
                    .update(password + user.salt)
                    .digest('hex');

                if (hashedPassword !== user.password) {
                    const logData = {
                        ...baseLog,
                        status: "Failed",
                        description: "Authentication failed - invalid password",
                        metadata: {
                            ...baseLog.metadata,
                            security: {
                                isKnownEmail: true,
                                failedAttempts: await getRecentFailedAttempts(user.id),
                                threatLevel: "medium"
                            }
                        }
                    };

                    if (user.lastLoginAttempt) {
                        logData.metadata.user = {
                            lastLoginAttempt: new Date(user.lastLoginAttempt).toISOString()
                        };
                    }

                    await logs.create(logData);
                    return done(null, false, { message: 'Invalid password' });
                }

                // Successful authentication
                console.log('✅ [DEBUG] Normal user authentication successful');
                await logs.create({
                    ...baseLog,
                    status: "Success",
                    description: "Authentication successful",
                    metadata: {
                        ...baseLog.metadata,
                        user: {
                            id: user.id,
                            department: user.departmentId
                        },
                        session: {
                            initiatedAt: new Date().toISOString()
                        }
                    }
                });

                return done(null, user);

            } catch(err) {
                console.error('❌ [DEBUG] Authentication error:', err);
                await logs.create({
                    ...baseLog,
                    status: "Failed",
                    description: "Authentication system error",
                    metadata: {
                        ...baseLog.metadata,
                        error: {
                            message: err.message,
                            type: err.name,
                            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
                        },
                        system: {
                            nodeVersion: process.version,
                            environment: process.env.NODE_ENV
                        }
                    }
                });
                return done(err);
            }
        }
    )
);

// Helper functions remain the same
async function getRecentFailedAttempts(userId) {
    try {
        return await logs.count({
            where: {
                userId: userId,
                action: "Login",
                status: "Failed",
                createdAt: {
                    [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });
    } catch {
        return 0;
    }
}

module.exports = passport;