const { handleErrors } = require("../../utils/errorHandlers");
const scheduleModel = require('../../models/schedule.model');
const vehiclesModel = require('../../models/vehicle.model');

const AvailableVehicles = async (req, res) => {
    try {
        const { startDay, endDay } = req.body;
        const schedules = await scheduleModel.findAll();
        const vehicles = await vehiclesModel.findAll();

        const reqStart = new Date(startDay);
        const reqEnd = new Date(endDay);

        // Helper to build schedule Date objects
        const parseSchedule = (item) => ({
            tripStart: new Date(`${item.pickupDate}T${item.pickupTime}`),
            tripEnd: new Date(`${item.returnDate}T${item.returnTime}`)
        });

        // Step 1: Find vehicles available during the entire requisition window.
        const availableVehicles = vehicles.filter(vehicle => {
            const vehicleSchedule = schedules
                .filter(schedule => schedule.vehicleId === vehicle.id)
                .map(parseSchedule);

            // Vehicle is available if none of its schedules overlap the requisition window.
            return vehicleSchedule.every(schedule => {
                return reqEnd <= schedule.tripStart || reqStart >= schedule.tripEnd;
            });
        });

        // If we found any vehicles that are completely free, return them.
        if (availableVehicles.length > 0) {
            return res.json({
                availableVehicles: availableVehicles,
                earliestAvailableVehicle: null,
            });
        }

        // Step 2: No vehicle is completely free. Find the vehicle that becomes available earliest.
        let earliestAvailableVehicle = null;
        let earliestAvailableTime = null;

        for (const vehicle of vehicles) {
            const vehicleSchedule = schedules
                .filter(schedule => schedule.vehicleId === vehicle.id)
                .map(parseSchedule)
                .sort((a, b) => a.tripStart - b.tripStart);

            // Start with the requisition start time.
            let vehicleFreeTime = reqStart;

            for (const sched of vehicleSchedule) {
                if (vehicleFreeTime < sched.tripStart) {
                    // There is a gap before the next schedule; vehicle is free at vehicleFreeTime.
                    break;
                }
                if (vehicleFreeTime < sched.tripEnd) {
                    // Vehicle is busy until this schedule ends.
                    vehicleFreeTime = sched.tripEnd;
                }
            }

            // Update if this vehicle becomes free earlier than the current earliest.
            if (!earliestAvailableTime || vehicleFreeTime < earliestAvailableTime) {
                earliestAvailableTime = vehicleFreeTime;
                earliestAvailableVehicle = vehicle;
            }
        }

        return res.json({
            availableVehicles: [],
            earliestAvailableVehicle: {
                vehicle: earliestAvailableVehicle,
                availableAfter: {
                    date: earliestAvailableTime.toLocaleDateString('en-KE'),  // Kenyan format (change to your locale if needed)
                    time: earliestAvailableTime.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })  // Formats time properly
                }
            },
        });


    } catch (err) {
        return handleErrors(res, err);
    }
};

module.exports = { AvailableVehicles };
