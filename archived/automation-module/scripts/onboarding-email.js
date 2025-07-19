// scripts/onboarding-email.js
// Usage: node scripts/onboarding-email.js <recipient_email> <name>

const nodemailer = require('nodemailer');

const recipient = process.argv[2];
const name = process.argv[3] || 'New Teammate';

if (!recipient) {
  console.error('Usage: node scripts/onboarding-email.js <recipient_email> <name>');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.example.com', // TODO: Update SMTP host
  port: 587,
  secure: false,
  auth: {
    user: 'your_smtp_user',
    pass: 'your_smtp_password',
  },
});

const mailOptions = {
  from: 'onboarding@finishthisidea.com',
  to: recipient,
  subject: 'Welcome to FinishThisIdea! 🚀',
  text: `Hi ${name},\n\nWelcome to the FinishThisIdea team!\n\nSee the onboarding guide in /cursor/mvp-improvements-module/onboarding-guide.md for your first steps.\n\nBest,\nThe FinishThisIdea Team`,
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error('Error sending email:', error);
  }
  console.log('Onboarding email sent:', info.response);
}); 