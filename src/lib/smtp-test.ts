/**
 * SMTP Configuration Test for FundiFlow
 * 
 * This script tests the SMTP email configuration to ensure
 * emails can be sent successfully.
 */

import nodemailer from 'nodemailer';

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

// Get SMTP configuration from environment
function getSMTPConfig(): SMTPConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER || '',
    fromName: process.env.FROM_NAME || 'FundiFlow'
  };
}

// Test SMTP connection
export async function testSMTPConnection(): Promise<boolean> {
  try {
    const config = getSMTPConfig();
    
    console.log('🔧 Testing SMTP Configuration...');
    console.log(`Host: ${config.host}:${config.port}`);
    console.log(`User: ${config.user}`);
    console.log(`From: ${config.fromName} <${config.fromEmail}>`);
    
    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.pass
      },
      // Additional options for Gmail
      ...(config.host.includes('gmail') && {
        service: 'gmail'
      })
    });
    
    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    
    console.log('✅ SMTP connection successful!');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
}

// Send test email via SMTP
export async function sendSMTPTestEmail(recipientEmail: string): Promise<boolean> {
  try {
    const config = getSMTPConfig();
    
    if (!config.user || !config.pass) {
      throw new Error('SMTP credentials not configured');
    }
    
    console.log(`📧 Sending test email to ${recipientEmail}...`);
    
    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass
      },
      // Additional options for Gmail
      ...(config.host.includes('gmail') && {
        service: 'gmail'
      })
    });
    
    // Email content
    const mailOptions = {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: recipientEmail,
      subject: '🧪 FundiFlow SMTP Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🎉 SMTP Test Successful!</h2>
          <p>Hello!</p>
          <p>This is a test email from your FundiFlow notification system.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>SMTP Host:</strong> ${config.host}:${config.port}</li>
              <li><strong>From Email:</strong> ${config.fromEmail}</li>
              <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Status:</strong> ✅ Working</li>
            </ul>
          </div>
          
          <p>If you received this email, your SMTP configuration is working correctly!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>This is a test email from FundiFlow notification system.</p>
          </div>
        </div>
      `,
      text: `
FundiFlow SMTP Test Email

Hello!

This is a test email from your FundiFlow notification system.

Configuration Details:
- SMTP Host: ${config.host}:${config.port}
- From Email: ${config.fromEmail}
- Test Time: ${new Date().toLocaleString()}
- Status: ✅ Working

If you received this email, your SMTP configuration is working correctly!

---
This is a test email from FundiFlow notification system.
      `
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log(`Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    return false;
  }
}

// Complete SMTP test (connection + email)
export async function runSMTPTest(recipientEmail?: string): Promise<void> {
  console.log('\n🧪 FundiFlow SMTP Test');
  console.log('=====================');
  
  // Test connection
  const connectionOk = await testSMTPConnection();
  
  if (!connectionOk) {
    console.log('\n❌ SMTP connection failed. Please check your configuration.');
    return;
  }
  
  // Test email sending if recipient provided
  if (recipientEmail) {
    console.log('\n📧 Testing email sending...');
    const emailOk = await sendSMTPTestEmail(recipientEmail);
    
    if (emailOk) {
      console.log(`\n🎉 Success! Check ${recipientEmail} for the test email.`);
    } else {
      console.log('\n❌ Email sending failed. Check the error above.');
    }
  } else {
    console.log('\n✅ SMTP connection test passed!');
    console.log('💡 To test email sending, provide a recipient email address.');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. If connection failed, check your SMTP credentials');
  console.log('2. For Gmail, ensure you\'re using an App Password');
  console.log('3. Check firewall settings if connection times out');
  console.log('4. Test with a real email address to verify delivery');
}

// Gmail-specific setup instructions
export function showGmailSetupInstructions(): void {
  console.log('\n📧 Gmail SMTP Setup Instructions');
  console.log('================================');
  console.log('1. Enable 2-Factor Authentication on your Google account');
  console.log('2. Go to Google Account settings > Security > App passwords');
  console.log('3. Generate an App Password for "Mail"');
  console.log('4. Use the generated 16-character password (not your regular password)');
  console.log('5. Update SMTP_PASS in your .env.local file');
  console.log('\n🔗 More info: https://support.google.com/accounts/answer/185833');
}

export default {
  testSMTPConnection,
  sendSMTPTestEmail,
  runSMTPTest,
  showGmailSetupInstructions
};