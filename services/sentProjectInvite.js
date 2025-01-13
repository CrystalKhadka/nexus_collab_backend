const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

const sendProjectInviteEmail = async ({
  email,
  projectName,
  invitedBy,
  inviteLink,
}) => {
  console.log(process.cwd());
  console.log(email);
  // Read and convert logo to base64
  const logoPath = path.join(process.cwd(), 'public', 'logo', 'logo.png');
  let logoBase64;

  try {
    const logoBuffer = await fs.readFile(logoPath);
    logoBase64 = logoBuffer.toString('base64');
  } catch (error) {
    console.error('Error reading logo:', error);
    // Continue without logo if there's an error
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'khadkacrystal23@gmail.com',
      pass: 'kxkl upkk ynup uqwv',
    },
  });

  const logoHtml = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" alt="Company Logo" style="max-width: 150px; height: auto; margin-bottom: 20px;" />`
    : `<h1 style="color: #2a7d73; font-size: 28px; font-weight: bold; margin: 0 0 20px 0;">[Your Company]</h1>`;

  const mailOptions = {
    from: 'khadkacrystal23@gmail.com',
    to: email,
    subject: `You've Been Invited to Join ${projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f7f7f7;">
          <!-- Main Container -->
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- Content Card -->
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="margin: 0 0 20px; color: #2a7d73; font-size: 24px; font-weight: 600; text-align: center;">
                You're Invited to Collaborate!
              </h1>
              
              <p style="margin: 0 0 20px; color: #555;">
                Hello,
              </p>
              
              <p style="margin: 0 0 20px; color: #555;">
                ${invitedBy} has invited you to collaborate on the project "${projectName}". Join the team and start contributing to this exciting project!
              </p>
              
              <!-- Action Button Container -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="display: inline-block; background-color: #2a7d73; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; text-align: center;">
                  Accept Invitation
                </a>
                <p style="margin-top: 15px; font-size: 14px; color: #666;">
                  This invitation will expire in 7 days
                </p>
              </div>
              
              <p style="margin: 0 0 20px; color: #555;">
                If you're having trouble with the button above, copy and paste this link into your browser:
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 10px 0; word-break: break-all;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  ${inviteLink}
                </p>
              </div>
              
              <!-- Security Notice -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 30px 0; border-left: 4px solid #2a7d73;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  For security reasons, this invitation link can only be used once and will expire after 7 days.
                </p>
              </div>
              
              <p style="margin: 0; color: #555;">
                Best regards,<br>
                The [Your Company] Team
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                © ${new Date().getFullYear()} [Your Company]. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 14px; color: #666;">
                Our address: [Your Company Address]
              </p>
              <div style="margin-top: 15px;">
                <a href="#" style="color: #2a7d73; text-decoration: none; margin: 0 10px; font-size: 14px;">Privacy Policy</a>
                <a href="#" style="color: #2a7d73; text-decoration: none; margin: 0 10px; font-size: 14px;">Terms of Service</a>
                <a href="#" style="color: #2a7d73; text-decoration: none; margin: 0 10px; font-size: 14px;">Contact Us</a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Project invite email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending project invite email:', error);
    return false;
  }
};

module.exports = sendProjectInviteEmail;
