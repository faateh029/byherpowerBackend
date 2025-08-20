import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

export const sendEmail = async (options) => {
  // 1. Create a Nodemailer transporter with your SMTP details from environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Optional: Add secure: true if your port is 465 (TLS)
    secure: process.env.SMTP_PORT == 465,
  });

  // 2. Define the mail options
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`, // Sender address
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  // 3. Send the email
  await transporter.sendMail(mailOptions);
};


export const signToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};