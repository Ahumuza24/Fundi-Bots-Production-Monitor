#!/usr/bin/env node

/**
 * SMTP Test Script for FundiFlow
 * 
 * This script tests the SMTP configuration independently
 * Usage: node scripts/test-smtp.js [recipient-email]
 */

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testSMTP(recipientEmail) {
  console.log('🧪 FundiFlow SMTP Test');
  console.log('======================');
  
  // Get configuration
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER || '',
    fromName: process.env.FROM_NAME || 'FundiFlow'
  };
  
  console.log(`📧 SMTP Host: ${config.host}:${config.port}`);
  console.log(`👤 User: ${config.user}`);
  console.log(`📤 From: ${config.fromName} <${config.fromEmail}>`);
  
  if (!config.user || !config.pass) {
    console.log('❌ SMTP credentials not configured in .env.local');
    console.log('💡 Make sure SMTP_USER and SMTP_PASS are set');
    return;
  }
  
  try {
    // Create transporter
    console.log('\n🔧 Creating SMTP transporter...');
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass
      },
      service: config.host.includes('gmail') ? 'gmail' : undefined
    });
    
    // Test connection
    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Send test email if recipient provided
    if (recipientEmail) {
      console.log(`\n📧 Sending test email to ${recipientEmail}...`);
      
      const mailOptions = {
        from: `${config.fromName} <${config.fromEmail}>`,
        to: recipientEmail,
        subject: '🧪 FundiFlow SMTP Test - Success!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">🎉 SMTP Test Successful!</h2>
            <p>Congratulations! Your FundiFlow SMTP configuration is working perfectly.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Test Details:</h3>
              <ul>
                <li><strong>SMTP Host:</strong> ${config.host}:${config.port}</li>
                <li><strong>From Email:</strong> ${config.fromEmail}</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Status:</strong> ✅ Working</li>
              </ul>
            </div>
            
            <p>Your notification system is ready to send emails!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>This is a test email from FundiFlow SMTP configuration test.</p>
            </div>
          </div>
        `,
        text: `
FundiFlow SMTP Test - Success!

Congratulations! Your FundiFlow SMTP configuration is working perfectly.

Test Details:
- SMTP Host: ${config.host}:${config.port}
- From Email: ${config.fromEmail}
- Test Time: ${new Date().toLocaleString()}
- Status: ✅ Working

Your notification system is ready to send emails!

---
This is a test email from FundiFlow SMTP configuration test.
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully!');
      console.log(`📬 Message ID: ${info.messageId}`);
      console.log(`📧 Check ${recipientEmail} for the test email`);
    }
    
    console.log('\n🎉 SMTP test completed successfully!');
    console.log('💡 Your email notifications are ready to use.');
    
  } catch (error) {
    console.log('\n❌ SMTP test failed:');
    console.error(error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. For Gmail:');
      console.log('1. Enable 2-Factor Authentication');
      console.log('2. Generate an App Password');
      console.log('3. Use the App Password in SMTP_PASS');
      console.log('🔗 https://support.google.com/accounts/answer/185833');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Check:');
      console.log('1. Internet connection');
      console.log('2. Firewall settings');
      console.log('3. SMTP host and port');
    }
  }
}

// Get recipient email from command line argument
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.log('Usage: node scripts/test-smtp.js <recipient-email>');
  console.log('Example: node scripts/test-smtp.js test@example.com');
  console.log('\nTesting connection only...\n');
}

testSMTP(recipientEmail);