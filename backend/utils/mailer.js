import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify connection configuration
        await transporter.verify();

        const info = await transporter.sendMail({
            from: `"Ticket AI System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text, 
        });
        console.log("Message sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw new Error("Failed to send email");
    }
}
