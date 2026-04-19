const nodemailer = require("nodemailer");

// Unified email configuration — uses GMAIL_USER + GMAIL_APP_PASSWORD only
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendEmail = async (options) => {
  // Validate config
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("⚠️  Email skipped: GMAIL_USER or GMAIL_APP_PASSWORD not set in .env");
    return { success: false, error: "Email not configured" };
  }

  try {
    const mailOptions = {
      from: `"ShopZone AI" <${process.env.GMAIL_USER}>`,
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
