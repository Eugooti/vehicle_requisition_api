const {handleErrors, successTransaction, getClientInfo, sanitizeEntityData} = require("../../utils/errorHandlers");
const tripsModel = require("../../models/Trip.model");
const rolesModel = require("../../models/roles.model");
const userModel = require("../../models/user.model");
const departmentsModel = require("../../models/departments.model");
const coTravellersModel = require("../../models/coTravellers.model");
const {SMSHandler} = require("../MailHandler/SMSHandler");
const {Op} = require("sequelize");
const {MailHandler} = require("../MailHandler/MailHandler");
const logs = require('../../models/logs.model');


const CreateRequisition = async (req,res) => {
    const sequelize = tripsModel.sequelize;
    const transaction = await sequelize.transaction();

    const clientInfo = getClientInfo(req); // Get detailed client information
    const baseLog = {
        userId: req.user?.id || null,
        loginEmail: req.user?.email || null,
        action: `Create Travel Requisition`,
        entity: 'Trip',
        ipAddress: clientInfo.ipAddress,
        timestamp: new Date(),
        metadata: {
            client: {
                userAgent: clientInfo.userAgent,
                protocol: clientInfo.protocol,
                endpoint: req.originalUrl
            },
            request: {
                method: req.method,
                params: req.params,
                query: req.query
            }
        }
    };

  try {
      const {departmentId,userId,travellers}= req.body;

     const newRequisition = await tripsModel.create(req.body,{transaction});
     const department = await departmentsModel.findByPk(departmentId);
     const requester = await userModel.findByPk(userId);

      const coTravellers = travellers?.length > 0
          ? travellers.map(item => ({ userId: item, tripId: newRequisition.id }))
          : [];

      await coTravellersModel.bulkCreate(coTravellers,{transaction})

      const findManagerRoles = await rolesModel.findAll({
          where: {
              [Op.and]:[
                  {departmentId:departmentId},
                  {role:'manager'}
              ]
          },
          raw: true
      })

      const getManagerIds = findManagerRoles.map(item => item.userId);
      const findManagers = await userModel.findAll({
          where: {
              id:{[Op.in]:getManagerIds},
          }
      })

      const managerMails = findManagers.map(item => item.email)

      const sendMails = await MailHandler(
          managerMails,
          "🔄 Action Required: New Requisition Approval Request",
          `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; border-radius: 12px; background: #ffffff; border: 1px solid #e0e6ed; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="background: #f0f7ff; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
        <span style="color: #3b82f6; font-size: 28px;">📋</span>
      </div>
      <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">New Requisition Approval Request</h1>
      <p style="color: #4b5563; margin: 8px 0 0; font-weight: 500;">Your review and approval is required</p>
    </div>

    <!-- Main content -->
    <div style="margin-bottom: 25px;">
      <p style="color: #1f2937; line-height: 1.6; margin-bottom: 20px;">
        You have received a new requisition request that requires your approval. Please review the details and take appropriate action.
      </p>

      <!-- Requisition details card -->
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
        <h3 style="margin-top: 0; color: #1e3a8a; font-size: 18px;">📝 Requisition Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #4b5563; width: 120px;">Requested By:</td>
            <td style="padding: 8px 0; font-weight: 500;">${requester.firstName} ${requester.lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563;">Department:</td>
            <td style="padding: 8px 0;">${department.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563;">Date Submitted:</td>
            <td style="padding: 8px 0;">${new Date().toLocaleDateString()}</td>
          </tr>
        </table>
      </div>

      <!-- Action buttons -->
      <div style="text-align: center; margin: 30px 0 20px;">
        <div style="display: flex; justify-content: center; gap: 15px;">
          <a href="http://localhost:5173/" 
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; transition: all 0.2s;"
             onmouseover="this.style.backgroundColor='#059669'" 
             onmouseout="this.style.backgroundColor='#10b981'">
             ✅ Approve Request
          </a>
        </div>
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

      // Prepare success log metadata
      const successMetadata = {
          ...baseLog.metadata,
          entityData: sanitizeEntityData(req.body),
          system: {
              environment: process.env.NODE_ENV,
              nodeVersion: process.version
          },
          travelDetails: {
              requisitionId: newRequisition.id,
              departmentId: departmentId,
              departmentName: department?.name || 'Unknown',
              coTravellersCount: travellers?.length || 0
          }
      };

      // Async log creation (fire-and-forget)
      logs.create({
          ...baseLog,
          status: "Success",
          entityId: newRequisition.id,
          description: `Successfully created travel requisition`,
          metadata: successMetadata
      }).catch(logErr => console.error('Logging failed', logErr));

      await transaction.commit();
      return successTransaction(res, 'created');


  }catch(err){
      // Prepare error metadata
      const errorMetadata = {
          ...baseLog.metadata,
          error: {
              name: err.name,
              message: err.message,
              code: err.code || 'REQUISITION_CREATION_ERROR',
              stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
          },
          attemptedData: sanitizeEntityData(req.body)
      };

      // Ensure the original error isn't lost if logging fails
      try {
          await logs.create({
              ...baseLog,
              status: "Failed",
              description: `Failed to create travel requisition`,
              metadata: errorMetadata
          });
      } catch (logErr) {
          console.error('Failed to write error log', logErr);
          // Fallback to basic error logging
          console.error('Original error:', {
              error: err.message,
              route: req.originalUrl,
              body: sanitizeEntityData(req.body)
          });
      }

      await transaction.rollback()
      return handleErrors(res, err);
  }
}

module.exports = {CreateRequisition};
