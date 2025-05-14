const { handleErrors, successTransaction } = require("../../utils/errorHandlers");
const tripsModel = require("../../models/Trip.model");
const usersModel = require("../../models/user.model");
const { SMSHandler } = require("../MailHandler/SMSHandler");
const {MailHandler} = require("../MailHandler/MailHandler");
const rolesModel = require("../../models/roles.model");
const userModel = require("../../models/user.model");
const {Op} = require("sequelize");


const approve = async (req, res) => {
    const sequelize = tripsModel.sequelize;
    const transaction = await sequelize.transaction(); // Initialize transaction
    try {
        const id = req.params.id;
        const { approverId, approvalStatus,reason } = req.body; // Ensure this is req.body, not res.body

        const trip = await tripsModel.findByPk(id);
        if (!trip) throw new Error("Trip not found");

        trip.approverId = approverId;
        trip.approvalStatus = approvalStatus;
        const user = await usersModel.findByPk(trip.userId);

        if (approvalStatus === "Rejected") {
            trip.travelStatus ='Canceled'
            trip.denialReason = reason;
            const user = await usersModel.findByPk(trip.userId);
            const message = `Hello, Your requisition from ${trip.pickupPoint} to ${trip.destination} on ${trip.pickupDate} has been rejected.\nReason: ${reason}`;

            const sendEmail = await MailHandler(
                user.email,
                "Requisition Rejected: Trip from " + trip.pickupPoint + " to " + trip.destination,
                `
                REQUISITION REJECTION NOTICE
                
                We regret to inform you that your transportation requisition has not been approved.
            
              Trip Details:
              - Route: ${trip.pickupPoint} to ${trip.destination}
              - Date: ${new Date(trip.pickupDate).toLocaleDateString()}
              - Time: ${trip.pickupTime || 'Not specified'}
              - Status: Rejected
            
              Rejection Reason:
              ${reason || 'No specific reason provided'}
            
              Next Steps:
              If you believe this decision was made in error or would like to discuss alternatives, please contact your manager or the transport team at transport@company.com.
            
              We appreciate your understanding.
              `,
                false
            );
            const sendMessage = await SMSHandler(user.phone, message);

            if (!sendMessage.success||!sendEmail.success) {
                // Rollback transaction first before throwing
                await transaction.rollback();
                throw new Error(`Failed to send notification`);
            }
        }

        const findHRMRoles = await rolesModel.findAll({
            where: {role:'hrm'},
            raw: true
        })

        const hrmIds = findHRMRoles.map(item=>item.userId)

        const findHrms = await userModel.findAll({
            where: {
                id:{[Op.in]:hrmIds},
            }
        })

        const hrmMails = findHrms.map(item => item.email)


        const sendMails = await MailHandler(
            hrmMails,
            "📋 Action Required: New Requisition Allocation Request",
            `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; border-radius: 12px; background: #ffffff; border: 1px solid #e0e6ed; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="background: #f0f9ff; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
        <span style="color: #0369a1; font-size: 28px;">📌</span>
      </div>
      <h1 style="color: #0c4a6e; margin: 0; font-size: 24px;">New Requisition Allocation Request</h1>
      <p style="color: #4b5563; margin: 8px 0 0; font-weight: 500;">Your attention is required for resource allocation</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 25px;">
      <p style="color: #1f2937; line-height: 1.6; margin-bottom: 20px;">
        A new requisition requires your team's attention for resource allocation. Please review the details below and take appropriate action.
      </p>

      <!-- Requisition details card -->
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0369a1;">
        <h3 style="margin-top: 0; color: #0c4a6e; font-size: 18px;">📋 Request Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #4b5563; width: 140px;">Request Number:</td>
            <td style="padding: 8px 0; font-weight: 500;">REQ-${trip.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563;">Requested By:</td>
            <td style="padding: 8px 0;">${user.firstName} ${user.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563;">Date Submitted:</td>
            <td style="padding: 8px 0;">${trip.pickupDate}</td>
          </tr>
        </table>
      </div>

      <!-- Action buttons -->
      <div style="text-align: center; margin: 30px 0 20px;">
        <a href="http://localhost:5173" 
           style="display: inline-block; background: #0369a1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; transition: all 0.2s;"
           onmouseover="this.style.backgroundColor='#075985'" 
           onmouseout="this.style.backgroundColor='#0369a1'">
           👉 Review Full Requisition
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px;">
      <p style="margin: 5px 0;">
        This is an automated notification. Need help? 
        <a href="mailto:${process.env.SUPPORT_MAIL}" style="color: #3b82f6; text-decoration: none;">Contact Support</a>
      </p>
    </div>
  </div>
  `,
            true
        );
        if (!sendMails.success){
            throw new Error("Error sending mail")
        }

        await trip.save({ transaction });


        // Commit only once at the end
        await transaction.commit();
        return successTransaction(res, "updated");

    } catch (err) {
        // Check if transaction is still active before rolling back
        if (!transaction.finished) {
            await transaction.rollback();
        }
        return handleErrors(res, err);
    }
};

module.exports = { approve };