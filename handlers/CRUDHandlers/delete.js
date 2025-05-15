const {handleErrors, itemNotFound, successTransaction} = require("../../utils/errorHandlers");

const remove = async (model, req, res) => {
    try {
        const {id} = req.params;

        // Check if id exists
        if (!id) {
            throw new Error('ID parameter is required');
        }

        const result = await model.findByPk(id);
        if (!result) {
            return itemNotFound(res);
        }

        await result.destroy();
        return successTransaction(res, "deleted");

    } catch(err) {
        return handleErrors(res, err);
    }
};

module.exports = {remove};