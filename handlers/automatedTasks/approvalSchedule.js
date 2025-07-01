const tripsModel = require('../../models/Trip.model');
const { Op } = require("sequelize");

const getCurrentDate = () => new Date().toISOString().split('T')[0]; // Format: 'YYYY-MM-DD'

const updateUnapprovedTrips = async () => {
    try {
        const today = getCurrentDate();

        const updateCount = await tripsModel.update(
            {
                approvalStatus: "Unapproved",
                travelStatus: "Canceled",
                denialReason: "Passed set trip time",
                allocationMode: "Unallocated",
            },
            {
                where: {
                    [Op.and]: [
                        { approvalStatus: "Pending" },
                        { pickupDate: { [Op.lt]: today } },
                        { returnDate: { [Op.lt]: today } }
                    ]
                }
            }
        );

        return { success: true, count: updateCount[0] };

    } catch (err) {
        console.error("Failed to update unapproved trips:", err);
        return { success: false, error: err.message };
    }
};

const updateUnallocatedTrips = async () => {
    try {
        const today = getCurrentDate();

        const updateCount = await tripsModel.update(
            {
                allocationMode: "Unallocated",
                travelStatus: "Canceled",
                allocatorNote: "Passed set trip time"
            },
            {
                where: {
                    [Op.and]: [
                        { approvalStatus: "Approved" },
                        { allocationMode: null },
                        { pickupDate: { [Op.lt]: today } },
                        { returnDate: { [Op.lt]: today } }
                    ]
                }
            }
        );

        return { success: true, count: updateCount[0] };

    } catch (err) {
        console.error("Failed to update unallocated trips:", err);
        return { success: false, error: err.message };
    }
};

const updateCompletedTrips = async () => {
    try {
        const today = getCurrentDate();
        const yesterdayEnd = new Date();

        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);

        const updateCount = await tripsModel.update(
            {
                endTime: yesterdayEnd,
                travelStatus: "Complete",
            },
            {
                where: {
                    [Op.and]: [
                        { endTime: null },
                        { allocationMode: "Allocated" },
                        { pickupDate: { [Op.lt]: today } },
                        { returnDate: { [Op.lt]: today } }
                    ]
                }
            }
        );

        return { success: true, count: updateCount[0] };

    } catch (err) {
        console.error("Failed to update completed trips:", err);
        return { success: false, error: err.message };
    }
};

const scheduleUpdateMethods = () => ({
    updateUnapprovedTrips,
    updateUnallocatedTrips,
    updateCompletedTrips
});

module.exports = scheduleUpdateMethods();
