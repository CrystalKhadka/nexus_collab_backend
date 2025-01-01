const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

const sendVerificationEmail = async (email, otp) => {
  console.log(process.cwd());
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
    subject: 'Welcome to [Your Company] - Verify Your Email',
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
                Verify Your Email Address
              </h1>
              
              <p style="margin: 0 0 20px; color: #555;">
                Hello,
              </p>
              
              <p style="margin: 0 0 20px; color: #555;">
                Welcome to [Your Company]! To get started, please verify your email address by entering this verification code:
              </p>
              
              <!-- OTP Container -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f8f9fa; border: 2px dashed #2a7d73; border-radius: 8px; padding: 20px; display: inline-block;">
                  <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #2a7d73; letter-spacing: 4px;">
                    ${otp}
                  </span>
                </div>
                <p style="margin-top: 15px; font-size: 14px; color: #666;">
                  This code will expire in 10 minutes
                </p>
              </div>
              
              <p style="margin: 0 0 20px; color: #555;">
                If you didn't request this verification, please ignore this email or contact our support team if you have concerns.
              </p>
              
              <!-- Security Notice -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 30px 0; border-left: 4px solid #2a7d73;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  For your security, never share this verification code with anyone, including [Your Company] staff.
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
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = sendVerificationEmail;
