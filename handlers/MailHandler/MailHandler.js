const nodemailer = require('nodemailer');

const MailHandler = async (to, subject, body) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.example.com',
            port: 587,
            secure: false, // Use `true` for port 465
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: 'Vehicle Requisition <transport@ebk.go.ke>',
            to,
            subject,
            text: `Hello ${name},\n\n${body}\n\nBest regards,\nSupport Team`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2c3e50;">Hello,</h2>
                    <p>I hope this message find you well. You have a new vehicle requisition ${body} request.</p>
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
