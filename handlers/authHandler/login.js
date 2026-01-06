const authConfig = require('../../config/auth/passportConfig');
const { JwtTokens } = require("../../config/auth/JWT/jwtTokens");
const rolesModel = require('../../models/roles.model')
const signatureModel = require("../../models/signatures.model")

const Login = async (req, res, next) => {
    try {
        authConfig.authenticate('local', async (err, user, info) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: info.message
                });
            }

            req.login(user, async (err) => {
                if (err) {
                    return next(err);
                }

                // Check if this is a setup user
                if (user.isSetupUser) {
                    // Setup user - only allow access to setup endpoints
                    const setupUserResponse = {
                        userId: user.id,
                        initials: 'SA',
                        email: user.email,
                        roles: ['admin','manager','driver','applicant'],
                        departmentId: user.departmentId,
                        designation: user.designation,
                        phone: user.phone,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        signature: null,
                        isSetupUser: true,
                        setupStatus: 'pending',
                        permissions: ['setup_access']
                    };

                    // Generate limited tokens for setup
                    const tokenGenerator = new JwtTokens();
                    const authToken = tokenGenerator.generateAccessToken(setupUserResponse);
                    const refreshToken = tokenGenerator.generateRefreshToken(setupUserResponse);

                    const authorization = {
                        authToken,
                        refreshToken,
                        isSetupToken: true
                    }

                    // Set headers and cookies (short-lived for setup)
                    res.setHeader('Authorization', `Bearer ${authToken}`);
                    res.setHeader('RefreshToken', `Bearer ${refreshToken}`);

                    res.cookie('sessionCookie', req.sessionID, {
                        httpOnly: true,
                        secure: req.secure,
                        sameSite: 'strict',
                    });

                    res.cookie('authToken', authToken, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'Strict',
                        maxAge: 1800000, // 30 minutes for setup
                    });

                    res.cookie('refreshToken', refreshToken, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'Strict',
                        maxAge: 1800000, // 30 minutes for setup
                    });

                    return res.status(200).json({
                        success: true,
                        message: 'Setup access granted. Please complete system initialization.',
                        user: setupUserResponse,
                        authorization,
                        setupRequired: true
                    });
                }

                // Normal user authentication flow
                const roles = await rolesModel.findAll({where:{userId:user.id}})
                const signature = await signatureModel.findOne({where:{userId:user.id}})

                const formattedUserRoles = roles.map((item) => (item.role))

                const userResponse = {
                    userId: user.id,
                    initials:`${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}`,
                    email: user.email,
                    roles: formattedUserRoles,
                    departmentId: user.departmentId,
                    designation: user.designation,
                    phone: user.phone,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    signature: signature,
                };

                const tokenGenerator = new JwtTokens();
                const authToken = tokenGenerator.generateAccessToken(userResponse);
                const refreshToken = tokenGenerator.generateRefreshToken(userResponse);

                const authorization = {
                    authToken,
                    refreshToken,
                }

                res.setHeader('Authorization', `Bearer ${authToken}`);
                res.setHeader('RefreshToken', `Bearer ${refreshToken}`);

                res.cookie('sessionCookie', req.sessionID, {
                    httpOnly: true,
                    secure: req.secure,
                    sameSite: 'strict',
                });

                res.cookie('authToken', authToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Strict',
                    maxAge: 3600000,
                });

                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Strict',
                    maxAge: 3600000,
                });

                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    user: userResponse,
                    authorization
                });
            });
        })(req, res, next);
    } catch (err) {
        return next(err);
    }
};

module.exports = { Login };