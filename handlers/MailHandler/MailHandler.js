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
    
                        <!-- Enhanced Footer -->
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea;">
                            <p style="margin: 5px 0; font-size: 15px; color: #555;">Best regards,</p>
                            <p style="margin: 5px 0 10px 0; font-size: 16px;">
                                <strong style="color: #2c3e50;">Support Team</strong>
                             </p>
        
        <!-- Optional Contact Info -->
                            <div style="font-size: 13px; color: #777; margin-top: 15px;">
                                <p style="margin: 3px 0;">
                                    <span style="color: #666;">✉️</span> 
                                    <a href="mailto:info@ebk.go.ke" style="color: #3498db; text-decoration: none;">
                                            support@company.com
                                    </a>
                                </p>
                                <p style="margin: 3px 0;">
                                    <span style="color: #666;">☎️</span> 
                                    <span style="color: #555;">+254-20-2719974</span>
                                </p>
                                <p style="margin: 3px 0 0 0;">
                                    <span style="color: #666;">🏢</span> 
                                    <span style="color: #555;">Fortis Suites, 9th Floor, Hospital Rd</span>
                                </p>
                    </div>
            </div>
        </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (err) {
        console.log(err)
        return { success: false, error: err.message };
    }
};

module.exports = { MailHandler };
