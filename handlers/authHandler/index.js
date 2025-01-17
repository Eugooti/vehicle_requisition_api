const { Login } = require("./login");
const { logout } = require("./LogOut");
const { updatePassword } = require("./updatePassword");
const {refreshAccessToken} = require("../../config/auth/JWT/refreshTokens");

const authHandlers = (model) => {
    const methods = {};

    methods.login = async (req, res, next) => {
        await Login(req, res, next);
    };

    methods.logout = async (req, res) => {
        await logout(req, res);
    };

    methods.updatePassword = async (req, res) => {
        await updatePassword(model, req, res);
    };

    methods.refreshToken = async (req, res) => {
        await refreshAccessToken(req, res);
    }

    return methods;
};

module.exports = { authHandlers };
