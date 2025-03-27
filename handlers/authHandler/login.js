const authConfig = require('../../config/auth/passportConfig');
const { JwtTokens } = require("../../config/auth/JWT/jwtTokens");
const rolesModel = require('../../models/roles.model')


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

                // Fetch user roles details
               const roles = await rolesModel.findAll({where:{userId:user.id}})

                const formattedUserRoles = roles.map((item) => (item.role))

                // Default user object
                const userResponse = {
                    userId: user.id,
                    email: user.email,
                    roles: formattedUserRoles,
                    departmentId: user.departmentId,
                    designation: user.designation,
                    phone: user.phone,
                    firstName: user.firstName,
                    lastName: user.lastName,
                };



                // Generate tokens
                const tokenGenerator = new JwtTokens();
                const authToken = tokenGenerator.generateAccessToken(userResponse);
                const refreshToken = tokenGenerator.generateRefreshToken(userResponse);

                const authorization = {
                    authToken,
                    refreshToken,
                }


                // Set headers and cookies
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
                    maxAge: 3600000, // 1 hour
                });

                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Strict',
                    maxAge: 3600000, // 1 hour
                });

                // Return successful login response
                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    user: userResponse,
                    authorization
                });
            });
        })(req, res, next);
    } catch (err) {
        return next(err); // Catch and forward any errors that may occur outside of passport logic
    }
};

module.exports = { Login };
