const nodemailer = require("nodemailer");

async function sendMail(email) {
  const codeResetPassword = Math.floor(Math.random() * 9000) + 1000;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_ADDRESS,
      pass: process.env.GMAIL_PASSWORD_APP,
    },
  });
  const mailOptions = {
    from: "ManarLahwel55@gmail.com",
    to: email,
    subject: "Password reset request",
    text: String(codeResetPassword),
    html: `The confirmation code to reset your password: <strong>${String(
      codeResetPassword
    )}</strong>`,
  };
  await transporter.sendMail(mailOptions);
  return codeResetPassword;
}

module.exports = sendMail;
