const nodemailer = require('nodemailer');

//sends an email
const sendEmail = async (recipient, subject, message) => {
    console.log('processing email...');
    try {
      //create connection with smtp provider
      const transporter = nodemailer.createTransport({
        host: 'smtp.elasticemail.com',
        port: 2525,
        secure: false,
        auth: {
          user: 'laundryhand32@gmail.com',
          pass: '986EB23FDDCE9F3EFFC5507A3BE5E72F6196', //you better not login to my account
        },
      });
  
      // Define the email options
      const mailOptions = {
        from: 'laundryhand32@gmail.com',
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
  