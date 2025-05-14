const {handleErrors, successTransaction} = require("../../utils/errorHandlers");
const usersModel = require("../../models/user.model");
const tripsModel = require("../../models/Trip.model");
const {MailHandler} = require("../MailHandler/MailHandler");

const TripManagement = async (req, res) => {
    const sequelize = tripsModel.sequelize;
    const transaction = await sequelize.transaction();

    try {
        const {id} = req.params;
        const {link} = req.body;

        if (!id || !link) {
            throw new Error("Missing required parameters: id and link");
        }

        // First find the trip to get the userId
        const trip = await tripsModel.findByPk(id, {transaction});

        if (!trip) {
            throw new Error(`No trip found with id: ${id}`);
        }

        // Perform the update
        const [updatedRowsCount] = await tripsModel.update(req.body, {
            where: {id},
            transaction
        });

        if (updatedRowsCount === 0) {
            throw new Error(`Failed to update trip with id: ${id}`);
        }

        // Get the user associated with the trip
        const user = await usersModel.findByPk(trip.userId, {transaction});

        if (!user || !user.email) {
            throw new Error("User not found or missing email");
        }

        const applicantMail = await MailHandler(
            user.email,
            "✅ Trip Completed - Share Your Feedback",
            `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; background: #ffffff; border: 1px solid #e0e6ed; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header with checkmark icon -->
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="background: #ecfdf5; width: 70px; height: 70px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
        <span style="color: #10b981; font-size: 32px;">✓</span>
      </div>
      <h1 style="color: #111827; margin: 0; font-size: 24px;">Trip Successfully Completed</h1>
      <p style="color: #6b7280; margin: 8px 0 0;">Thank you for using our service!</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 25px;">
      <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
        Your recent trip has been marked as completed. We'd appreciate your feedback to help us improve our service.
      </p>

      <!-- Feedback CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" 
           style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.2s;"
           onmouseover="this.style.backgroundColor='#059669'; this.style.transform='translateY(-2px)'" 
           onmouseout="this.style.backgroundColor='#10b981'; this.style.transform='none'">
           ✨ Share Your Feedback
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
          Takes less than 2 minutes - your opinion matters!
        </p>
      </div>

      <!-- Trip summary -->
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #111827; font-size: 18px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">📅</span> Trip Summary
        </h3>
        <p style="color: #4b5563; margin: 10px 0;">
          <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
          <strong>Status:</strong> <span style="color: #10b981; font-weight: 500;">Completed</span>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px;">
      <p style="margin: 5px 0;">
        Having trouble with the link? Copy and paste this in your browser:<br>
        <span style="word-break: break-all; color: #3b82f6;">${link}</span>
      </p>
    </div>
  </div>
  `,
            true
        );

        if (!applicantMail.success) {
            throw new Error("Failed to send email notification");
        }

        await transaction.commit();
        return successTransaction(res, 'updated');

    } catch (err) {
        await transaction.rollback();
        console.error('Error in TripManagement:', err);
        return handleErrors(res, err);
    }
}

module.exports = {TripManagement}