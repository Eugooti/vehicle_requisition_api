const { handleErrors, itemNotFound, successTransaction } = require('../../utils/errorHandlers');
const tripsModel = require('../../models/Trip.model');
const vehiclesModel = require('../../models/Vehicle.model');
const reservationsModel = require('../../models/reservations.model');

const reservation = async (req, res) => {
    const sequelize = tripsModel.sequelize;
    const transaction = await sequelize.transaction();

    try {
        console.log('Transaction started');

        // Validate request data
        const { id } = req.params;
        const { vehicleId, driverId, allocatorId, availability, allocatorNote } = req.body;

        if (!id || !vehicleId || !driverId || !allocatorId || availability === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Prepare data for updates
        const tripData = { vehicleId, driverId, allocatorId, allocatorNote };
        const vehicleData = { availability };

        // Update trip
        const [tripUpdatedCount] = await tripsModel.update(tripData, {
            where: { id },
            transaction,
        });

        if (tripUpdatedCount === 0) {
            await transaction.rollback();
            return itemNotFound(res);
        }

        // Fetch updated trip details
        const updatedTrip = await tripsModel.findOne({
            where: { id },
            transaction,
        });

        if (!updatedTrip || !updatedTrip.pickupDate || !updatedTrip.pickupTime) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Pickup date and time are required' });
        }

        // Update vehicle
        const vehicleUpdatedCount = await vehiclesModel.update(vehicleData, {
            where: { id: vehicleId },
            transaction,
        });

        if (vehicleUpdatedCount === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Vehicle update failed' });
        }

        // Create reservation record
        const reservationData = {
            vehicleId,
            tripId: id,
            pickupDate: updatedTrip.pickupDate,
            pickupTime: updatedTrip.pickupTime,
        };

        const result = await reservationsModel.create(reservationData, { transaction });

        if (!result) {
            await transaction.rollback();
            return res.status(500).json({ message: 'Reservation creation failed' });
        }

        // Commit transaction
        await transaction.commit();
        console.log('Transaction committed');
        return successTransaction(res, "updated");

    } catch (err) {
        if (transaction) {
            await transaction.rollback();
            console.log('Transaction rolled back due to error');
        }
        return handleErrors(res, err);
    }
};

module.exports = { reservation };
