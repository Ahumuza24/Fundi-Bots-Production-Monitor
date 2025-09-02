import { NextRequest, NextResponse } from 'next/server';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface EmailConfig {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail: string;
  fromName: string;
}

function getEmailConfig(): EmailConfig {
  return {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    fromEmail: process.env.FROM_EMAIL || 'notifications@fundiflow.com',
    fromName: process.env.FROM_NAME || 'FundiFlow'
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json();
    const { to, subject, html, text } = body;

    // Validate input
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const config = getEmailConfig();

    // Check if SMTP is configured
    if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
      console.log('📧 SMTP not configured, logging email to console');
      console.log('\n📧 EMAIL NOTIFICATION (Console Mode)');
      console.log('=====================================');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('\n--- TEXT CONTENT ---');
      console.log(text);
      console.log('=====================================\n');
      
      return NextResponse.json({
        success: true,
        messageId: 'console-log',
        message: 'Email logged to console (SMTP not configured)'
      });
    }

    // Dynamic import of nodemailer (server-side only)
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      },
      // Additional options for Gmail
      ...(config.smtpHost?.includes('gmail') && {
        service: 'gmail'
      })
    });

    const mailOptions = {
      from: `${config.fromName} <${config.fromEmail}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`📧 Email sent successfully to ${to}:`, info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('📧 Email API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}