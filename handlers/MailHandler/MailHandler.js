const nodemailer = require('nodemailer');
require('dotenv').config();

const MailHandler = async (to, subject, body) => {
    try {
       const transporter = nodemailer.createTransport({
            host: process.env.HOST_NAME,
            port: 587,
            secure: false, // Must be false for TLS on port 587
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false, // Bypass SSL certificate issues
            },
        });

        // Verify connection before sending the email
        await transporter.verify();

        const mailOptions = {
            from: `Vehicle Requisition <noreply@ebk.go.ke>`,
            to,
            subject,
            text: `Hello,\n\n${body}\n\nBest regards,\nSupport Team`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2c3e50;">Hello,</h2>
                    <p>${body}</p>
                    <p style="margin-top: 20px;">Best regards,</p>
                    <p><strong>Support Team</strong></p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

module.exports = { MailHandler };
