const requisitions = require('../../models/Trip.model');
const users = require('../../models/user.model');
const coTravellers = require('../../models/coTravellers.model');
const rolesModel = require('../../models/roles.model');
const { SMSHandler } = require('../MailHandler/SMSHandler');
const { MailHandler } = require("../MailHandler/MailHandler");
const { Op } = require('sequelize'); // Import Sequelize operators

// Utility function for timezone handling
const getFormattedDate = (daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
};

// Preload user data for better performance
const getUserEmailMap = async () => {
    const userRecords = await users.findAll({
        attributes: ['id', 'email'],
        raw: true
    });
    return new Map(userRecords.map(user => [user.id, user.email]));
};


// Helper functions
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatDateTime(dateString) {
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function getTripDetailsLink(tripId) {
    return `${process.env.APP_BASE_URL}/trips/${tripId}`;
}

const notifyRequisitions = async () => {
    try {
        console.log('Starting requisition notification job...');
        const tomorrowDate = getFormattedDate(1);

        // 1. Fetch data more efficiently with single queries
        const [tomorrowTrips, userEmailMap, coTravellersList] = await Promise.all([
            requisitions.findAll({
                where: {
                    pickupDate: tomorrowDate,
                    allocationMode: 'Allocated'
                },
                attributes: ['id', 'userId', 'pickupDate', 'pickupPoint']
            }),
            getUserEmailMap(),
            coTravellers.findAll({
                where: { tripId: { [Op.not]: null } },
                attributes: ['tripId', 'userId'],
                raw: true
            })
        ]);

        if (tomorrowTrips.length === 0) {
            console.log(`No trips found for ${tomorrowDate}`);
            return;
        }

        // 2. Group co-travellers by tripId for O(1) lookups
        const coTravellersByTrip = coTravellersList.reduce((acc, curr) => {
            if (!acc[curr.tripId]) acc[curr.tripId] = [];
            acc[curr.tripId].push(curr.userId);
            return acc;
        }, {});

        // 3. Process notifications with better error handling
        const notificationPromises = tomorrowTrips.map(async trip => {
                const applicantEmail = userEmailMap.get(trip.userId);
                if (!applicantEmail) {
                    console.warn(`No email found for applicant ID: ${trip.userId}`);
                    return;
                }

                const coTravellerEmails = (coTravellersByTrip[trip.id] || [])
                    .map(userId => userEmailMap.get(userId))
                    .filter(Boolean);

                const recipients = [applicantEmail, ...coTravellerEmails];
                const subject = `Reminder: Your Trip Tomorrow (${formatDate(trip.pickupDate)})`;

                const message = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f7fa; padding: 20px;">
    <div style="max-width: 650px; margin: 0 auto; padding: 30px; border-radius: 12px; background: #ffffff; border: 1px solid #e0e6ed; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 25px;">
            <div style="background: #fff7ed; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <span style="color: #f97316; font-size: 28px;">⏰</span>
            </div>
            <h1 style="color: #ea580c; margin: 0; font-size: 24px;">Trip Reminder</h1>
            <p style="color: #4b5563; margin: 8px 0 0; font-weight: 500;">Your allocated trip is scheduled for tomorrow</p>
        </div>

        <div style="margin-bottom: 25px;">
            <div style="color: #1f2937; line-height: 1.6; margin-bottom: 20px;">
                This is a reminder about your <strong>allocated trip</strong> scheduled for <strong>${formatDateTime(trip.pickupDate)}</strong>.
            </div>

            <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f97316;">
                <div style="font-weight: 600; color: #9a3412; font-size: 18px; margin-bottom: 12px;">🚗 Trip Details</div>
                <div style="display: flex; margin-bottom: 8px;">
                    <div style="color: #4b5563; width: 120px;">Date & Time:</div>
                    <div style="font-weight: 500;">${formatDateTime(trip.pickupDate)}</div>
                </div>
                <div style="display: flex; margin-bottom: 8px;">
                    <div style="color: #4b5563; width: 120px;">Pickup Location:</div>
                    <div>${trip.pickupPoint || 'As previously specified'}</div>
                </div>
                <div style="display: flex;">
                    <div style="color: #4b5563; width: 120px;">Participants:</div>
                    <div>${1 + (coTravellersByTrip[trip.id]?.length || 0)} traveler(s)</div>
                </div>
            </div>

            <div style="margin: 25px 0;">
                <div style="font-weight: 600; color: #9a3412; font-size: 16px; margin-bottom: 12px;">📌 Important Notes</div>
                <div style="color: #1f2937; line-height: 1.6;">
                    <div style="display: flex; margin-bottom: 8px;">
                        <div style="margin-right: 8px;">•</div>
                        <div>Arrive 15 minutes before scheduled pickup time</div>
                    </div>
                    <div style="display: flex; margin-bottom: 8px;">
                        <div style="margin-right: 8px;">•</div>
                        <div>Bring your required identification and documents</div>
                    </div>
                    <div style="display: flex;">
                        <div style="margin-right: 8px;">•</div>
                        <div>Contact support immediately if you cannot make this trip</div>
                    </div>
                </div>
            </div>

        </div>

        <div style="text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px;">
            <div style="margin: 5px 0;">
                Need to make changes? Contact <a href="mailto:${process.env.SUPPORT_MAIL}" style="color: #f97316; text-decoration: none;">Travel Support</a>
            </div>
        </div>
    </div>
</div>
                `;

                await MailHandler(recipients,subject,message)
        });

        await Promise.all(notificationPromises);
        console.log(`Processed ${tomorrowTrips.length} trips for ${tomorrowDate}`);

    } catch (err) {
        console.error('Error in requisition notification job:', err);
        throw err;
    }
};


const notifyManagers = async () => {
    try {
        console.log('Starting manager notification job...');
        const tomorrowDate = getFormattedDate(1);

        const pendingApprovals = await requisitions.findAll({
            where: {
                pickupDate: tomorrowDate,
                approvalStatus: 'Pending'
            },
            attributes: ['departmentId']
        });




        const uniqueDepartments = [...new Set(pendingApprovals.map(trip => trip.departmentId))];

        const departmentManagers = await rolesModel.findAll({
            where: {
                role: 'Manager',
                departmentId: { [Op.in]: uniqueDepartments }
            },
            attributes: ['userId', 'departmentId'],
            raw: true
        });

        const usersMail = await getUserEmailMap();

        const notificationPromise = uniqueDepartments.map(async department => {
            const managers = departmentManagers.filter(manager => manager.departmentId === department);
            const managersEmail = managers.map(manager => usersMail.get(manager.userId));
            const pendingCount = pendingApprovals.filter(trip => trip.departmentId === department).length;
            const recipients = [...new Set(managersEmail)];
            const subject = `Reminder: Pending Approvals (${formatDate(tomorrowDate)})`;
            const message = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; background: #ffffff; border-radius: 8px; border: 1px solid #e3e8ee; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <!-- Header -->
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="background: #f0f5ff; width: 50px; height: 50px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                    <span style="color: #3b82f6; font-size: 24px;">!</span>
                </div>
                <h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">Pending Approvals Notification</h2>
            </div>
    
               <!-- Content -->
            <div style="margin-bottom: 25px;">
                <p style="margin-bottom: 15px; color: #4b5563; line-height: 1.5;">
                    You have <strong style="color: #1e3a8a; font-size: 18px;">${pendingCount} trip ${pendingCount>1?"requisitions":"requisition"}</strong> 
                    awaiting your approval for <strong>${formatDate(tomorrowDate)}</strong>.
                </p>
                
            </div>
                <!-- Footer -->
            <div style="text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px;">
                <p style="margin: 5px 0;">
                    This is an automated notification. Need help? 
                    <a href="mailto:${process.env.SUPPORT_MAIL}" style="color: #3b82f6; text-decoration: none;">Contact support</a>
                </p>
            </div>
       </div>
    `;

            await MailHandler(recipients,subject,message)
        })

        await Promise.all(notificationPromise)
        console.log(`Processed ${uniqueDepartments.length} approval reminders`);

    }catch (err) {
        console.error('Error in manager notification job:', err);
    }
}

const notifyAdmins = async ()=>{
    try {

        const tomorrowDate = getFormattedDate(1);

        const pendingAllocation = await requisitions.findAll({
            where: {
                pickupDate: tomorrowDate,
                approvalStatus: 'Approved',
                allocationMode:null
            },
        });

        if (pendingAllocation.length === 0) {
            console.log('No pending allocations found for tomorrow');
            return;
        }

        const roles = await rolesModel.findAll({
            where: {
                role: {[Op.in]: ['hrm','admin']},

            },
            attributes: ['userId'],
            raw: true
        });

        const uniqueUsers = [...new Set(roles.map(role => role.userId))];

        const usersMail = await getUserEmailMap();

        const adminMails = uniqueUsers.map(user => usersMail.get(user));
        const subject = `Reminder: Pending Allocation (${formatDate(tomorrowDate)})`;
        const message = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; background: #ffffff; border-radius: 8px; border: 1px solid #e3e8ee; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 20px;">
        <div style="background: #fef2f2; width: 50px; height: 50px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
            <span style="color: #dc2626; font-size: 24px;">!</span>
        </div>
        <h2 style="color: #b91c1c; margin: 0; font-size: 22px;">Pending Allocations Notification</h2>
    </div>
    
    <!-- Content -->
    <div style="margin-bottom: 25px;">
        <p style="margin-bottom: 15px; color: #4b5563; line-height: 1.5;">
            There ${pendingAllocation.length>1?'are':'is'} <strong style="color: #b91c1c; font-size: 18px;">${pendingAllocation.length} approved ${pendingAllocation.length>1?'trips':'trip'}</strong> 
            requiring vehicle allocation for <strong>${formatDate(tomorrowDate)}</strong>.
        </p>
        
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px;">
        <p style="margin: 5px 0;">
            This is an automated notification. Please address before EOD.
            <a href="mailto:${process.env.SUPPORT_MAIL}" style="color: #3b82f6; text-decoration: none;">Contact support</a> if needed.
        </p>
    </div>
</div>
        `;

        await MailHandler(adminMails,subject,message)
        console.log(`Processed ${pendingAllocation.length} allocation reminders`);

    }catch (err) {
        console.error('Error in admin/HR notification job:', err);

    }
}


const notifyDrivers = () => {

}

const notifications = ()=>({
    notifyRequisitions,
    notifyManagers,
    notifyAdmins,
    notifyDrivers
})

module.exports = notifications();