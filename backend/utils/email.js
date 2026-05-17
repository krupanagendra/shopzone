const nodemailer = require("nodemailer");

// Unified email configuration — uses EMAIL + EMAIL_PASS only
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false,
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const sendEmail = async (options) => {
  // Validate config
  if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
    console.warn("⚠️  Email skipped: EMAIL or EMAIL_PASS not set in .env");
    return { success: false, error: "Email not configured" };
  }

  try {
    const mailOptions = {
      from: `"OmniKart AI" <${process.env.EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    console.error("Email Error:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
