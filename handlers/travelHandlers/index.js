const {createTravel} = require("./createTravel");
const {CRUDMethods} = require("../CRUD Handlers/general");
const {approveTravel} = require("./approveTravel");
const {resourceAllocation} = require("./resourceAllocation");
const {reservation} = require("./reservation");
const TravelHandlers = (model) => {
    const methods = CRUDMethods(model)

    methods.createTravel = async (req,res)=>{
        await createTravel(model,req,res)
    }

    methods.approveTravel = async (req,res)=>{
        await approveTravel(model,req,res)
    }

    methods.allocation = async (req,res)=>{
        await resourceAllocation(model,req,res)
    }

    methods.reservation = async (req,res)=>{
        await reservation(req,res)
    }

    return methods;
}

module.exports = {TravelHandlers};