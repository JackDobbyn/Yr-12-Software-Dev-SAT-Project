const nodemailer = require('nodemailer');

const sendEmail = async (recipient, subject, message) => {
    console.log('processing email...')
    try {
      // Create a transporter with your SMTP configuration
      const transporter = nodemailer.createTransport({
        host: 'smtp.elasticemail.com',
        port: 2525,
        secure: false,
        auth: {
          user: 'jackdobbyn@outlook.com',
          pass: 'BE9DBBF4C73D21E05E6D414D50D291D91709',
        },
      });
  
      // Define the email options
      const mailOptions = {
        from: 'jackdobbyn@outlook.com',
        to: recipient,
        subject: subject,
        text: message,
      };
  
      // Send the email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
    }
};

module.exports = {sendEmail};
  