// Direct email test function
import { sendTestEmail } from './email-notifications';

export async function testEmailSystem() {
  console.log('🧪 Testing email system directly...');
  
  try {
    // Test with your email address
    const result = await sendTestEmail('ahumuzacedric@gmail.com');
    console.log('📧 Direct email test result:', result ? 'SUCCESS' : 'FAILED');
    return result;
  } catch (error) {
    console.error('❌ Direct email test error:', error);
    return false;
  }
}

// Test the notification system with a mock assembler
export async function testNotificationWithMockUser() {
  console.log('🧪 Testing notification system with mock data...');
  
  try {
    const { sendProjectCreatedEmail } = await import('./email-notifications');
    
    // Create a mock assembler ID (this will fail gracefully if user doesn't exist)
    const mockAssemblerIds = ['test-assembler-123'];
    
    const result = await sendProjectCreatedEmail(
      mockAssemblerIds,
      'Test Project',
      'test-project-id'
    );
    
    console.log('📧 Mock notification test result:', result);
    return result;
  } catch (error) {
    console.error('❌ Mock notification test error:', error);
    return false;
  }
}