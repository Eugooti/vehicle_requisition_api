require('dotenv').config();
const jwt = require('jsonwebtoken');

class JwtTokens {

    generateAccessToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            roles:user.roles
        };

        return jwt.sign(payload, process.env.SECRET_KEY, {
            expiresIn: '10m',
        })
    }

    generateRefreshToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            roles:user.roles
        };
        return jwt.sign(payload, process.env.REFRESH_SECRET_KEY, {
            expiresIn: '1h'
        })
    }

    generatePasswordResetToken(user) {
        const payload = {
            id: user.id,
            code:user.code,
        }
        return jwt.sign(payload, process.env.REFRESH_SECRET_KEY, {
            expiresIn: '3m'
        })
    }

    generateRandomCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let code = '';
        const codeLength = 6;

        for (let i = 0; i < codeLength; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            code += characters.charAt(randomIndex);
        }

        return code;
    }

}

module.exports = {JwtTokens}