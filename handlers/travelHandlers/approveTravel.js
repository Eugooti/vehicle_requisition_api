const {handleErrors, itemNotFound} = require("../../utils/errorHandlers");
const approveTravel = async (model,req,res) => {
  try {
      const {id} = req.params

      const {} = req.body

      const trip = await model.findByPk(id)
      if (!trip) {
          return itemNotFound(req,'Trip')
      }


  }catch(err){
      return handleErrors(res, err);
  }
}