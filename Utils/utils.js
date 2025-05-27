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

async function notifyOwnerTaskStatus(project, owner, ownerEmail,user, task, column) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: `"Task Updates - ${process.env.APP_NAME}" <${process.env.GMAIL_USER}>`,
    to: ownerEmail,
    subject: `[${project.name}] Task Update: "${task}" moved to ${column}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e8e8e8; border-radius: 8px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">Task Status Update</h1>
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 5px;">${currentDate}</p>
        </div>
        
        <div style="background-color: white; border-radius: 6px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h2 style="color: #3498db; margin-top: 0; font-size: 18px;">Project: ${project.name}</h2>
          
          <div style="margin: 15px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #3498db; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #2c3e50;">Task Updated:</p>
            <p style="margin: 5px 0 0 0; font-size: 16px;">${task}</p>
          </div>
          
          <div style="display: flex; margin: 20px 0;">
            <div style="flex: 1; text-align: center; background-color: #e8f4fc; padding: 10px; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #7f8c8d;">NEW STATUS</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: #27ae60;">${column}</p>
            </div>
          </div>
          
          <p style="margin: 20px 0 10px 0;">Hello ${owner || 'Project Owner'},</p>
          <p style="margin: 0 0 15px 0;">The task <strong>"${task}"</strong> has been updated and moved to the <strong>${column}</strong> column in your project by <strong>${user || 'Team Member'}</strong>.</p>
          
          <p style="margin: 0 0 15px 0;">Please log in to your account to view the updated task details.</p>
          
          <p style="margin: 0 0 15px 0;">Best regards,<br>${process.env.APP_NAME}</p>
        </div>
        
        <div style="text-align: center; color: #95a5a6; font-size: 12px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ecf0f1;">
          <p style="margin: 5px 0;">This is an automated notification from ${process.env.APP_NAME}.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Task status notification email sent successfully');
  } catch (err) {
    console.error('Failed to send task status notification:', err.message);
    // Consider adding error handling/retry logic here
  }
}

module.exports = {
  sendProjectInvitations,
  sendProjectInvitationsStaus,
  notifyOwnerTaskStatus
};
