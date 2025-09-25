const logs = require('../../models/logs.model');
const {getClientInfo} = require("../../utils/errorHandlers");


const logout = async (req, res) => {
    // Capture user and client info
    const { id, email, role } = req.user || {};
    const clientInfo = getClientInfo(req); // Returns { ipAddress, userAgent, protocol }

    const baseLog = {
        userId: id || null,
        loginEmail: email || null,
        action: 'Logout',
        entity: 'Session',
        ipAddress: clientInfo.ipAddress,
        metadata: {
            client: {
                userAgent: clientInfo.userAgent,
                protocol: clientInfo.protocol
            },
            session: {
                id: req.sessionID
            }
        }
    };

    try {
        req.session.destroy(async (err) => {
            if (err) {
                // Failed logout
                await logs.create({
                    ...baseLog,
                    status: "Failed",
                    description: "Session destruction failed",
                    metadata: {
                        ...baseLog.metadata,
                        error: {
                            message: err.message,
                            code: err.code || 'SESSION_DESTROY_ERROR'
                        },
                        timestamps: {
                            attemptedAt: new Date().toISOString()
                        }
                    }
                });
                return res.status(500).json({
                    success: false,
                    message: 'Logout failed'
                });
            }

            // Successful logout
            await logs.create({
                ...baseLog,
                status: "Success",
                description: "User logged out successfully",
                metadata: {
                    ...baseLog.metadata,
                    user: {
                        role: role || null,
                        sessionDuration: req.session?.cookie?.originalMaxAge
                            ? `${Math.floor(req.session.cookie.originalMaxAge / 1000)}s`
                            : null
                    },
                    timestamps: {
                        loggedOutAt: new Date().toISOString()
                    }
                }
            });

            // Clear all auth tokens
            res.clearCookie('authToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            res.clearCookie('sessionCookie', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            return res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        });
    } catch (error) {
        // System error during a logout process
        await logs.create({
            ...baseLog,
            status: "Failed",
            description: "System error during logout",
            metadata: {
                ...baseLog.metadata,
                error: {
                    message: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                },
                system: {
                    nodeVersion: process.version
                }
            }
        });
        return res.status(500).json({
            success: false,
            message: 'Logout processing failed'
        });
    }
};

module.exports = { logout };