import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import fs from "fs";
import path from "path";

require("dotenv").config();
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SENDER_EMAIL,
  RECIPIENT_EMAIL,
  EMAIL_SUBJECT,
} = process.env;

const sendMail = async (options: any) => {
  // Create a Nodemailer transporter
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 587,
    secure: false, // Set to true for SSL
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const { email, subject, template, data } = options;
  // Load the EJS template
  const templatePath = path.join(__dirname, "../mails", template);
  const html: string = await ejs.renderFile(templatePath, data);
  // Define email data
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to: email,
    subject,
    html,
  };
  // Send the email
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email: ", error);
    } else {
      console.log("Email sent: ", info.response);
    }
  });
};
export default sendMail;
