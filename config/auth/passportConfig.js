const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../../models/user.model');
const logs = require('../../models/logs.model');
const crypto = require('crypto');
const { Op } = require('sequelize');
const {getClientInfo} = require("../../utils/errorHandlers"); // Make sure to import Op



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
            passReqToCallback: true // Added to access request
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
                const user = await User.findOne({ where: { email } });

                if (!user) {
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

                    // Only add lastLoginAttempt if it exists
                    if (user.lastLoginAttempt) {
                        logData.metadata.user = {
                            lastLoginAttempt: new Date(user.lastLoginAttempt).toISOString()
                        };
                    }

                    await logs.create(logData);
                    return done(null, false, { message: 'Invalid password' });
                }

                // Successful authentication
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

// Helper functions
async function getRecentFailedAttempts(userId) {
    try {
        return await logs.count({
            where: {
                userId: userId,
                action: "Login",
                status: "Failed",
                createdAt: {
                    [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }
        });
    } catch {
        return 0;
    }
}

module.exports = passport;