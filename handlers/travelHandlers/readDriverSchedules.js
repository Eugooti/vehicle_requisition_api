const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const tripsModel = require('../../models/Trip.model');
const {Op} = require("sequelize");
const usersModel = require("../../models/user.model");
const departmentModel = require("../../models/departments.model");



const ReadDriverSchedules = async (req,res) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'

        const driverId = req.params.id;
        console.log("Driver ID:", driverId);

        if (!driverId) {
            console.log("Driver ID is missing");
            return res.status(400).json({
                success: false,
                message: "Driver ID is required"
            });
        }

        console.log("Searching for trips with date range:", today);

        const trips = await tripsModel.findAll({
            where:{
                pickupDate: { [Op.lte]: today },
                returnDate: { [Op.gte]: today },
                driverId: driverId,
            },
            raw: true
        });

        console.log("Found trips:", trips.length);

        const usersList = await usersModel.findAll({raw: true});
        const departmentList = await departmentModel.findAll({raw: true});


        // Early return if no trips
        if (trips.length === 0) {
            return successTransaction(res, 'No schedules found', []);
        }

        const findItem = (id, list) => {
            if (!id) return null;
            return list.find(item => item.id === id) || null;
        }

        const formatTime = (time) => {
            if (!time) return '';
            try {
                const [hour, minute] = time.split(':');
                return `${hour}:${minute}`;
            } catch (error) {
                console.log("Error formatting time:", error);
                return time; // Return original time if there's an error
            }
        }

        console.log("Formatting trip data");

        const formatData = trips.map((trip) => {
            const user = findItem(trip.userId, usersList);
            const approver = findItem(trip.approverId, usersList);
            const department = findItem(trip.departmentId, departmentList);

            if (!user) {
                console.log(`User not found for trip ${trip.id}, userId: ${trip.userId}`);
            }

            return {
                fullName: user ? `${user.firstName || ''} ${user.lastName || ''}` : 'Unknown User',
                pickupDate: trip.pickupDate,
                pickupTime: trip.pickupTime,
                returnDate: trip.returnDate,
                returnTime: trip.returnTime,
                designation: user ? user.designation : '',
                phone: user ? user.phone : '',
                pickup: trip.pickupPoint,
                destination: trip.destination,
                passengerNumber: trip.travellersCount,
                purpose: trip.purpose,
                id: trip.id,
                Approver: approver ? `${approver.firstName || ''} ${approver.lastName || ''}` : '',
                department: department ? department.name : '',
                approvalStatus: trip.approvalStatus,
                allocationMode: trip.allocationMode,
                end: trip.endTime,
                start: trip.startTime,
                driverId: trip.driverId,
                date: trip.pickupDate,
                time: formatTime(trip.pickupTime),
            };
        });


        return successTransaction(res,"read",formatData)



    } catch (err) {
        console.error("Error in ReadDriverSchedules:", err);
        return handleErrors(res, err);
    }
}

module.exports = {ReadDriverSchedules};
