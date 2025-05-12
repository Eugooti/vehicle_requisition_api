const {handleErrors, successTransaction, itemNotFound} = require("../../utils/errorHandlers");
const update = async (model,req,res) => {
  try {
      const {id} = req.params;

      const [updatedRowsCount, updatedRows] = await model.update(req.body, {
          where: { id },
          returning: true, // Return the updated rows
      });

      if (updatedRowsCount === 0) {
          return itemNotFound(res)
      }

      return successTransaction(res,"updated",updatedRows[0])

  }catch(err){
      return handleErrors(res,err);
  }
}

module.exports = {update}