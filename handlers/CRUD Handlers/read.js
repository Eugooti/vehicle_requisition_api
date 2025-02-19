const {successTransaction, handleErrors, itemNotFound} = require("../../utils/errorHandlers");
const read = async (model,req,res) => {
    try {
        const result = await model.findAll()

        return successTransaction(res,'read',result)

    }catch(err){
        return handleErrors(res,err)
    }

}

const readByPk = async (model,req,res) => {
    try {
        const result = await model.findByPk(req.params.id)

        if (!result) {
            return itemNotFound(res)
        }

        return successTransaction(res,'read',result)

    }catch(err){
        return handleErrors(res,err)
    }

}

const readByUserId = async (model,req,res)=>{
    try {

        const result = await model.findAll({where:{userId:req.params.id}});

        return successTransaction(res,'read',result)


    }catch (err) {
        return handleErrors(res,err)
    }
}


const readByDpt = async (model,req,res)=>{
    try {
        const result = await model.findAll({where:{departmentId:req.params.id}})

        return successTransaction(res,'read',result)

    }catch(err){
        return handleErrors(res,err)
    }
}

module.exports = {read,readByPk,readByUserId,readByDpt}