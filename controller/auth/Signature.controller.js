const signatureModel = require('../../models/signatures.model')
const {CRUDMethods} = require("../../handlers/CRUDHandlers");

module.exports = CRUDMethods(signatureModel);