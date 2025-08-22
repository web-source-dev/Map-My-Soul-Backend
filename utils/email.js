const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Load email template
const loadEmailTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '..', 'emailTemplates', `${templateName}.html`);
    let template = await fs.readFile(templatePath, 'utf8');
    
    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(placeholder, data[key]);
    });
    
    return template;
  } catch (error) {
    console.error(`Error loading email template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
};

// Send email function
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    const templateData = {
      resetUrl: resetUrl,
      resetToken: resetToken,
      expiryTime: '1 hour',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@mapmysoul.com'
    };

    const htmlContent = await loadEmailTemplate('passwordReset', templateData);
    const subject = 'Password Reset Request - Map My Soul';

    return await sendEmail(email, subject, htmlContent);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, firstName) => {
  try {
    const templateData = {
      firstName: firstName,
      loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000/auth',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@mapmysoul.com'
    };

    const htmlContent = await loadEmailTemplate('welcome', templateData);
    const subject = 'Welcome to Map My Soul!';

    return await sendEmail(email, subject, htmlContent);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Send email verification
const sendVerificationEmail = async (email, verificationToken, verificationUrl) => {
  try {
    const templateData = {
      verificationUrl: verificationUrl,
      verificationToken: verificationToken,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@mapmysoul.com'
    };

    const htmlContent = await loadEmailTemplate('emailVerification', templateData);
    const subject = 'Verify Your Email - Map My Soul';

    return await sendEmail(email, subject, htmlContent);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  loadEmailTemplate
};
