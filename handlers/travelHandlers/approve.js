const { handleErrors, successTransaction, getClientInfo, sanitizeEntityData } = require("../../utils/errorHandlers");
const tripsModel = require("../../models/Trip.model");
const usersModel = require("../../models/user.model");
const { SMSHandler } = require("../MailHandler/SMSHandler");
const { MailHandler } = require("../MailHandler/MailHandler");
const rolesModel = require("../../models/roles.model");
const userModel = require("../../models/user.model");
const { Op } = require("sequelize");
const logs = require('../../models/logs.model');

// Helper functions
const sendRejectionNotifications = async (trip, user, reason, transaction) => {
    const message = `Hello, Your requisition from ${trip.pickupPoint} to ${trip.destination} on ${trip.pickupDate} has been rejected.\nReason: ${reason}`;

    const [sendEmail, sendMessage] = await Promise.all([
        MailHandler(
            user.email,
            `Requisition Rejected: Trip from ${trip.pickupPoint} to ${trip.destination}`,
            `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
        <h1 style="color: #d32f2f; margin: 0;">Requisition Rejected</h1>
        <p style="margin: 5px 0 0; font-size: 16px;">We regret to inform you that your transportation request was not approved</p>
    </div>
    
    <div style="padding: 25px; background-color: #ffffff;">
        <h2 style="color: #1976d2; margin-top: 0;">Trip Details</h2>
        
        <div style="display: flex; margin-bottom: 15px;">
            <div style="width: 120px; font-weight: bold;">Route:</div>
            <div>${trip.pickupPoint} to ${trip.destination}</div>
        </div>
        
        <div style="display: flex; margin-bottom: 15px;">
            <div style="width: 120px; font-weight: bold;">Date:</div>
            <div>${new Date(trip.pickupDate).toLocaleDateString()}</div>
        </div>
        
        <div style="display: flex; margin-bottom: 15px;">
            <div style="width: 120px; font-weight: bold;">Time:</div>
            <div>${trip.pickupTime || 'Not specified'}</div>
        </div>
        
        <div style="display: flex; margin-bottom: 15px;">
            <div style="width: 120px; font-weight: bold;">Status:</div>
            <div style="color: #d32f2f; font-weight: bold;">Rejected</div>
        </div>
        
        <div style="margin: 25px 0; padding: 15px; background-color: #fff8e1; border-left: 4px solid #ffa000;">
            <h3 style="margin-top: 0; color: #ff6f00;">Rejection Reason</h3>
            <p>${reason || 'No specific reason provided'}</p>
        </div>
        
        <div style="margin-top: 30px;">
            <h3 style="color: #1976d2;">Next Steps</h3>
            <p>If you believe this decision was made in error or would like to discuss alternatives, please contact:</p>
            <ul style="padding-left: 20px;">
                <li>Your manager</li>
                <li>Transport team at <a href="mailto:transport@company.com" style="color: #1976d2; text-decoration: none;">transport@company.com</a></li>
            </ul>
        </div>
    </div>
    
    <div style="padding: 15px; text-align: center; background-color: #f5f5f5; font-size: 12px; color: #757575;">
        <p>This is an automated notification. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} Company Name. All rights reserved.</p>
    </div>
</div>
`,
            true
        ),
        SMSHandler(user.phone, message)
    ]);

    if (!sendMessage.success || !sendEmail.success) {
        throw new Error('Failed to send rejection notifications');
    }
};

const notifyHRMsForAllocation = async (trip, user, transaction) => {
    const findHRMRoles = await rolesModel.findAll({
        where: { role: 'hrm' },
        raw: true,
        transaction
    });

    const hrmIds = findHRMRoles.map(item => item.userId);
    const findHrms = await userModel.findAll({
        where: { id: { [Op.in]: hrmIds } },
        transaction
    });

    const hrmMails = findHrms.map(item => item.email);
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

    if (!sendMails.success) {
        throw new Error("Error sending mail to HRMs");
    }

    return hrmMails;
};

const prepareTripUpdateData = (approverId, approvalStatus, reason) => {
    const updateData = {
        approverId,
        approvalStatus
    };

    if (approvalStatus === "Rejected") {
        updateData.travelStatus = 'Canceled';
        updateData.denialReason = reason;
    }

    return updateData;
};

const getChangesForLog = (currentTripState, updatedTrip, approvalStatus, approverId, reason) => {
    const changes = {
        approvalStatus: {
            from: currentTripState.approvalStatus,
            to: approvalStatus
        },
        approverId: {
            from: currentTripState.approverId,
            to: approverId
        }
    };

    if (approvalStatus === "Rejected") {
        changes.travelStatus = {
            from: currentTripState.travelStatus,
            to: 'Canceled'
        };
        changes.denialReason = {
            from: currentTripState.denialReason,
            to: reason
        };
    }

    return changes;
};

const approve = async (req, res) => {
    const sequelize = tripsModel.sequelize;
    const transaction = await sequelize.transaction();
    const { id } = req.params;
    const { approverId, approvalStatus, reason } = req.body;
    const clientInfo = getClientInfo(req);

    const baseLog = {
        userId: req.user?.id || null,
        loginEmail: req.user?.email || null,
        action: `Approve Trip`,
        entity: 'Trip',
        entityId: id,
        ipAddress: clientInfo.ipAddress,
        metadata: {
            client: {
                userAgent: clientInfo.userAgent,
                protocol: clientInfo.protocol,
                endpoint: req.originalUrl
            },
            request: {
                method: req.method,
                params: req.params,
                query: req.query,
                body: sanitizeEntityData(req.body)
            }
        }
    };

    try {
        // 1. Get current trip state before update
        const trip = await tripsModel.findByPk(id, { transaction });
        if (!trip) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "Trip not found",
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        type: "NOT_FOUND",
                        message: "Trip record not found"
                    }
                }
            });
            throw new Error("Trip not found");
        }

        const currentTripState = trip.get({ plain: true });
        const user = await usersModel.findByPk(trip.userId, { transaction });

        // 2. Prepare and apply update data
        const updateData = prepareTripUpdateData(approverId, approvalStatus, reason);
        Object.assign(trip, updateData);
        await trip.save({ transaction });

        // 3. Handle notifications based on approval status
        let hrmMails = [];
        if (approvalStatus === "Rejected") {
            await sendRejectionNotifications(trip, user, reason, transaction);
        } else {
            hrmMails = await notifyHRMsForAllocation(trip, user, transaction);
        }

        // 4. Log the successful operation
        const updatedTrip = await tripsModel.findByPk(id, { transaction, raw: true });
        const changes = getChangesForLog(currentTripState, updatedTrip, approvalStatus, approverId, reason);

        await logs.create({
            ...baseLog,
            status: "Success",
            description: `Trip ${approvalStatus.toLowerCase()}`,
            metadata: {
                ...baseLog.metadata,
                changes,
                notifications: {
                    userNotified: approvalStatus === "Rejected",
                    hrmNotified: approvalStatus !== "Rejected",
                    notificationCount: hrmMails.length + (approvalStatus === "Rejected" ? 1 : 0)
                },
                system: {
                    environment: process.env.NODE_ENV,
                    updatedAt: updatedTrip.updatedAt || new Date().toISOString()
                }
            }
        }, { transaction });

        await transaction.commit();
        return successTransaction(res, "updated", updatedTrip);

    } catch (err) {
        // Error logging
        const errorLog = {
            ...baseLog,
            status: "Failed",
            description: `Failed to approve trip`,
            metadata: {
                ...baseLog.metadata,
                error: {
                    name: err.name,
                    message: err.message,
                    code: err.code || 'TRIP_APPROVAL_ERROR'
                },
                timestamps: {
                    attemptedAt: new Date().toISOString()
                }
            }
        };

        try {
            await logs.create(errorLog);
        } catch (logErr) {
            console.error('Failed to write error log:', logErr);
        }

        if (!transaction.finished) {
            await transaction.rollback();
        }
        return handleErrors(res, err);
    }
};

module.exports = { approve };

