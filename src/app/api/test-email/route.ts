import { NextRequest, NextResponse } from 'next/server';
import { runAllEmailTests, quickEmailTest, testBasicEmail } from '@/lib/email-test';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, recipientEmail } = body;

    switch (type) {
      case 'basic':
        if (!recipientEmail) {
          return NextResponse.json(
            { error: 'Recipient email required for basic test' },
            { status: 400 }
          );
        }
        const basicResult = await testBasicEmail(recipientEmail);
        return NextResponse.json({ 
          success: basicResult,
          message: basicResult ? 'Basic email test passed' : 'Basic email test failed'
        });

      case 'quick':
        await quickEmailTest();
        return NextResponse.json({ 
          success: true,
          message: 'Quick test completed. Check server console for output.'
        });

      case 'all':
        await runAllEmailTests(recipientEmail);
        return NextResponse.json({ 
          success: true,
          message: 'All tests completed. Check server console for detailed results.'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid test type. Use: basic, quick, or all' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Email test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FundiFlow Email Test API',
    endpoints: {
      'POST /api/test-email': {
        description: 'Test email notifications',
        body: {
          type: 'basic | quick | all',
          recipientEmail: 'email@example.com (required for basic test)'
        }
      }
    },
    examples: {
      basicTest: {
        type: 'basic',
        recipientEmail: 'test@example.com'
      },
      quickTest: {
        type: 'quick'
      },
      allTests: {
        type: 'all',
        recipientEmail: 'test@example.com'
      }
    }
  });
}