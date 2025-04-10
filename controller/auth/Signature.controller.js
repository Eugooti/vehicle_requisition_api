const signatureModel = require('../../models/signatures.model')
const {CRUDMethods} = require("../../handlers/CRUD Handlers");

module.exports = CRUDMethods(signatureModel);