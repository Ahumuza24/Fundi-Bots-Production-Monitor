import { NextRequest, NextResponse } from 'next/server';
import { testSMTPConnection, sendSMTPTestEmail, showGmailSetupInstructions } from '@/lib/smtp-test';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, recipientEmail } = body;

    switch (action) {
      case 'connection':
        const connectionResult = await testSMTPConnection();
        return NextResponse.json({
          success: connectionResult,
          message: connectionResult 
            ? 'SMTP connection successful' 
            : 'SMTP connection failed - check server logs'
        });

      case 'email':
        if (!recipientEmail) {
          return NextResponse.json(
            { error: 'Recipient email required for email test' },
            { status: 400 }
          );
        }
        
        // First test connection
        const connOk = await testSMTPConnection();
        if (!connOk) {
          return NextResponse.json({
            success: false,
            message: 'SMTP connection failed - cannot send email'
          });
        }
        
        // Then send test email
        const emailResult = await sendSMTPTestEmail(recipientEmail);
        return NextResponse.json({
          success: emailResult,
          message: emailResult 
            ? `Test email sent to ${recipientEmail}` 
            : 'Failed to send test email - check server logs'
        });

      case 'full':
        // Test both connection and email
        const fullConnResult = await testSMTPConnection();
        if (!fullConnResult) {
          return NextResponse.json({
            success: false,
            message: 'SMTP connection failed',
            details: { connection: false, email: false }
          });
        }
        
        let emailSent = false;
        if (recipientEmail) {
          emailSent = await sendSMTPTestEmail(recipientEmail);
        }
        
        return NextResponse.json({
          success: fullConnResult && (recipientEmail ? emailSent : true),
          message: recipientEmail 
            ? `Connection: ${fullConnResult ? 'OK' : 'Failed'}, Email: ${emailSent ? 'Sent' : 'Failed'}`
            : 'Connection test passed',
          details: {
            connection: fullConnResult,
            email: recipientEmail ? emailSent : null
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: connection, email, or full' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('SMTP test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FundiFlow SMTP Test API',
    provider: process.env.EMAIL_PROVIDER,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not configured',
    fromEmail: process.env.FROM_EMAIL,
    endpoints: {
      'POST /api/test-smtp': {
        description: 'Test SMTP configuration',
        actions: {
          connection: 'Test SMTP connection only',
          email: 'Test sending email (requires recipientEmail)',
          full: 'Test both connection and email'
        }
      }
    },
    examples: {
      connectionTest: {
        action: 'connection'
      },
      emailTest: {
        action: 'email',
        recipientEmail: 'test@example.com'
      },
      fullTest: {
        action: 'full',
        recipientEmail: 'test@example.com'
      }
    },
    gmailSetup: {
      note: 'For Gmail, you need an App Password',
      steps: [
        'Enable 2-Factor Authentication',
        'Go to Google Account > Security > App passwords',
        'Generate App Password for Mail',
        'Use the 16-character password in SMTP_PASS'
      ],
      link: 'https://support.google.com/accounts/answer/185833'
    }
  });
}