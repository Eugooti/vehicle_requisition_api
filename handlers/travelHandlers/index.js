const {createTravel} = require("./createTravel");
const TravelHandlers = (model) => {
    const methods = {}

    methods.createTravel = async (req,res)=>{
        await createTravel(model,req,res)
    }

    return methods;
}

module.exports = {TravelHandlers};