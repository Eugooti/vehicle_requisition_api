const { handleErrors, successTransaction } = require("../../utils/errorHandlers");
const tripsModel = require('../../models/Trip.model');
const vehicleModel = require('../../models/vehicle.model');
const userModel = require('../../models/user.model');
const {Op} = require('sequelize');

const readSchedules = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch relevant trips
        const trips = await tripsModel.findAll({
            where: { pickupDate: today },
            raw: true
        });


        // Early return if no trips
        if (trips.length === 0) {
            return successTransaction(res, 'No schedules found', []);
        }


        const users = await userModel.findAll({raw: true});

        const findUser = (id)=>{
            return users.find(user=>user.id === id);
        }

        const formatTrips = trips.map(trip => ({
            ...trip,
            applicant:`${findUser(trip.userId)?.firstName} ${findUser(trip.userId)?.lastName}`,
            driverName:`${findUser(trip.driverId)?.firstName} ${findUser(trip.driverId)?.lastName}`,
            driverID:trip.driverId
        }))



        // Get unique vehicle IDs from trips
        const vehicleIds = [...new Set(formatTrips.map(t => t.vehicleId))];

        // Skip querying vehicles if there are no vehicleIds
        if (vehicleIds.length === 0) {
            return successTransaction(res, 'No schedules found', []);
        }

        // Fetch associated vehicles
        const vehicles = await vehicleModel.findAll({
            where: { id:{[Op.in]:vehicleIds} },
            raw: true
        });

        // Create vehicle map for O(1) lookups
        const vehicleMap = vehicles.reduce((acc, vehicle) => {
            acc[vehicle.id] = vehicle;
            return acc;
        }, {});

        // Function to clean up trip data
        const cleanTripData = ({ allocatorId,allocationMode,vehicleId, createdAt, updatedAt,userId,driverId,approverId,departmentId, ...trip }) => trip;

        // Group trips by vehicle
        const groupedSchedules = formatTrips.reduce((acc, trip) => {
            const vehicle = vehicleMap[trip.vehicleId];
            if (vehicle) {
                if (!acc[vehicle.id]) {
                    acc[vehicle.id] = {
                        vehicle: { make:vehicle.make,model:vehicle.model,numberPlate:vehicle.numberPlate,vId:vehicle.id, },
                        trips: []
                    };
                }
                acc[vehicle.id].trips.push(cleanTripData(trip));
            }
            return acc;
        }, {});

        const trialFormat =Object.values(groupedSchedules)

        const formattedData = trialFormat.flatMap(vehicle=>{
            return vehicle.trips.map(trip=>({
                ...trip,
                vehicleMake:vehicle.vehicle.make,
                model:vehicle.vehicle.model,
                numberPlate:vehicle.vehicle.numberPlate,
                vehicleID:vehicle.vehicle.vId
            }))
        })

        return successTransaction(res, 'retrieved', formattedData);

    } catch (err) {
        console.log(err)
        return handleErrors(res, err);
    }
};

module.exports = { readSchedules };
