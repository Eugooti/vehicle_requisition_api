const jwt = require('jsonwebtoken');
const {JwtTokens} = require("./jwtTokens");


// Refresh token route

const refreshAccessToken = (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.headers?.authorization? req.headers?.authorization?.split(' ')[1]:null  // Get refresh token from cookies
    if (!refreshToken) {
        return res.status(403).json({ message: 'Refresh token not found, login again' });
    }

    jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const jwtGenerator = new JwtTokens()

        // Generate a new access token
        const authToken = jwtGenerator.generateAccessToken(user);

        res.setHeader('Authorization', `Bearer ${authToken}`);

        res.cookie('authToken', authToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 3600000, // 1 hour
        });

        return res.status(200).json({ message: 'Access token refreshed',authToken });
    });
};

module.exports = { refreshAccessToken };
