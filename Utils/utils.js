const nodemailer = require('nodemailer');

// Configure the mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/**
 * Send invitation emails to team members
 * @param {Array} members - Array of { email, username }
 * @param {String} projectName - Name of the project
 */
const sendProjectInvitations = async (members, projectName) => {
  for (const member of members) {
    const { email, username } = member;

    const mailOptions = {
      from: `"No Reply - ${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `You've Been Invited to Join Project: ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Project Invitation</h2>
          <p>Hello ${username || 'Team Member'},</p>
          <p>You have been invited to join the project <strong>${projectName}</strong>.</p>
          <p>Please log in to your account to view and accept the invitation.</p>
          <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">This is an automated message, please do not reply.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Invitation sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error.message);
    }
  }
};

const sendProjectInvitationsStaus = async (adminEmail, admin, username, status, projectName) => {
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    const currentTime = new Date().toLocaleString();

    const mailOptions = {
        from: `"No Reply - ${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `Project Invitation Update : ${username} ${formattedStatus}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Team Member Invitation Status</h2>
                <p>Hi <strong>${admin}</strong>,</p>
                <p><strong>${username}</strong> has <span style="color: ${status === 'accepted' ? '#28a745' : '#dc3545'};"><strong>${formattedStatus}</strong></span> the invitation to join the project <strong>"${projectName}"</strong>.</p>
                <p style="margin-top: 10px;">This response was received on:</p>
                <p style="background-color: #f8f9fa; padding: 10px 15px; border-radius: 5px; font-size: 14px;">${currentTime}</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
                <p>You can review this update in your dashboard.</p>
                <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                    This is an automated message from ${process.env.APP_NAME}, please do not reply to this email.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Status notification sent to ${adminEmail}`);
    } catch (error) {
        console.error(`Failed to send status email to ${adminEmail}:`, error.message);
    }
};

module.exports = {
  sendProjectInvitations,
  sendProjectInvitationsStaus
};
