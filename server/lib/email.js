import nodemailer from "nodemailer";

const smtpUser = process.env.EMAIL_USER?.trim();
const smtpPassword = process.env.EMAIL_PASSWORD?.trim();

const transportConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.EMAIL_PORT || "587", 10),
  secure: false,
};

if (smtpUser && smtpPassword) {
  transportConfig.auth = {
    user: smtpUser,
    pass: smtpPassword,
  };
}

const transporter = nodemailer.createTransport(transportConfig);

export const sendEmail = async (to, subject, html, text) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@schupa.org",
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (name, email) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1B5E20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>Welcome to SCHUPA!</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
        <p>Hi ${name},</p>
        <p>Your email has been verified successfully.</p>
        <p>Your scholarship application is now pending admin approval. You can sign in once your account is approved.</p>
        <p style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:8081'}/signin" style="background-color: #1B5E20; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Go To Sign In
          </a>
        </p>
        <p style="color: #666; font-size: 12px;">
          If you did not create this account, please ignore this email.
        </p>
      </div>
    </div>
  `;

  const text = `Your email has been verified. Your scholarship application is pending admin approval. Sign in after approval at ${process.env.FRONTEND_URL}/signin`;

  return sendEmail(email, "Welcome to SCHUPA", html, text);
};

export const sendSignupVerificationCodeEmail = async (name, email, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1B5E20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>Verify Your Email</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
        <p>Hi ${name},</p>
        <p>Use this verification code to complete your SCHUPA signup:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; text-align: center; margin: 24px 0; color: #1B5E20;">${code}</p>
        <p>This code expires in 15 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  `;

  const text = `Hi ${name},\n\nYour SCHUPA verification code is: ${code}\nThis code expires in 15 minutes.`;
  return sendEmail(email, "SCHUPA Verification Code", html, text);
};

export const sendPasswordResetEmail = async (name, email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1B5E20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>Password Reset Request</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        <p style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Your Password
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          Or copy this link: <br/><code style="background-color: #e0e0e0; padding: 5px 10px; border-radius: 3px;">${resetLink}</code>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours.<br/>
          If you did not request a password reset, please ignore this email.
        </p>
      </div>
    </div>
  `;

  const text = `Your password reset link: ${resetLink}\n\nThis link expires in 24 hours.`;

  return sendEmail(email, "SCHUPA Password Reset", html, text);
};

export const sendUploadConfirmationEmail = async (name, email, fileName, type) => {
  const label = type === "result" ? "academic result" : type === "fee_statement" ? "fee statement" : "school ID";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1B5E20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>Upload Received</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
        <p>Hi ${name},</p>
        <p>Your ${label} document has been uploaded successfully.</p>
        <p><strong>File:</strong> ${fileName}</p>
        <p>You can review this document in your dashboard.</p>
      </div>
    </div>
  `;

  const text = `Hi ${name}, your ${label} upload (${fileName}) was received successfully.`;
  return sendEmail(email, "SCHUPA Upload Confirmation", html, text);
};

export const sendAdminMessageEmail = async (name, email, subject, body) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1B5E20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>New SCHUPA Message</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
        <p>Hi ${name},</p>
        <p>You have received a new message on SCHUPA.</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p style="white-space: pre-wrap;">${body}</p>
      </div>
    </div>
  `;

  const text = `Hi ${name},\n\nNew SCHUPA message\nSubject: ${subject}\n\n${body}`;
  return sendEmail(email, "New SCHUPA Message", html, text);
};

export const sendInquiryReceivedEmail = async (name, email, message) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1B5E20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>We Received Your Inquiry</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
        <p>Hi ${name},</p>
        <p>Thank you for contacting SCHUPA. We have received your inquiry and our team will respond as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
    </div>
  `;

  const text = `Hi ${name},\n\nThank you for contacting SCHUPA. We received your inquiry and will respond as soon as possible.\n\nYour message:\n${message}`;
  return sendEmail(email, "SCHUPA Inquiry Received", html, text);
};

export const sendInquiryReplyEmail = async (name, email, replyMessage) => {
  console.log(`[Email] Sending inquiry reply to ${email}`);
  console.log(`[Email] Response message: "${replyMessage.substring(0, 100)}..." (length: ${replyMessage.length})`);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1B5E20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>Reply From SCHUPA</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
        <p>Hi ${name},</p>
        <p>Our admin team has responded to your inquiry.</p>
        <p style="white-space: pre-wrap;">${replyMessage}</p>
      </div>
    </div>
  `;

  const text = `Hi ${name},\n\nOur admin team has responded to your inquiry:\n\n${replyMessage}`;
  
  console.log(`[Email] HTML body will contain: ${replyMessage.substring(0, 50)}`);
  return sendEmail(email, "SCHUPA Inquiry Reply", html, text);
};
