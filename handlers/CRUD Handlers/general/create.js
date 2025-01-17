const {handleErrors, successTransaction} = require("../../../utils/errorHandlers");
const {mergeDefaults} = require("sequelize/lib/utils");
const create = async (model,req,res) => {
    try {
        const result = await model.create(req.body);
        if (result) {
            return successTransaction(res,"created")
        }

    }catch(err){
        return handleErrors(res,err)
    }
}

const createMany = async (model,req,res) => {
    try {

        const data = req.body;

        if (Array.isArray(data)) {
            return res.status(400).json({ error: 'Request body must be an array' });
        }

        const result = await model.bulkCreate(req.body);

        const result2 = successTransaction(res,"created")

        if (result) {
            return {success:true,result2};
        }

    }catch(err){
        return handleErrors(res,err)
    }
}

module.exports = {create,createMany}