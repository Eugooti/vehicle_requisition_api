const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
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

        if (!Array.isArray(req.body)) {
            return res.status(400).json({ error: 'Request body must be an array' });
        }

        const result = await model.bulkCreate(req.body);

        successTransaction(res,"created",result)


    }catch(err){
        return handleErrors(res,err)
    }
}

module.exports = {create,createMany}