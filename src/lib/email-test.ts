/**
 * Email Testing Utilities for FundiFlow
 * 
 * This file provides functions to test email notifications
 * during development and deployment.
 */

import {
  sendTestEmail,
  sendProjectCreatedEmail,
  sendProjectAssignedEmail,
  sendWorkSessionCompletedEmail,
  sendDeadlineApproachingEmails,
  sendAnnouncementEmails
} from './email-notifications';

// Test basic email functionality
export async function testBasicEmail(recipientEmail: string): Promise<boolean> {
  console.log('🧪 Testing basic email functionality...');
  
  try {
    const result = await sendTestEmail(recipientEmail);
    
    if (result) {
      console.log('✅ Basic email test passed');
    } else {
      console.log('❌ Basic email test failed');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Basic email test error:', error);
    return false;
  }
}

// Test project created notification
export async function testProjectCreatedEmail(): Promise<boolean> {
  console.log('🧪 Testing project created email...');
  
  try {
    const result = await sendProjectCreatedEmail(
      ['test-assembler-1', 'test-assembler-2'],
      'Test Circuit Board Assembly',
      'test-project-123'
    );
    
    console.log(`✅ Project created emails sent: ${result}`);
    return result > 0;
  } catch (error) {
    console.error('❌ Project created email test error:', error);
    return false;
  }
}

// Test project assignment notification
export async function testProjectAssignedEmail(): Promise<boolean> {
  console.log('🧪 Testing project assigned email...');
  
  try {
    const result = await sendProjectAssignedEmail(
      'test-assembler-1',
      'John Doe',
      'Test Circuit Board Assembly',
      'test-project-123'
    );
    
    if (result) {
      console.log('✅ Project assigned email sent');
    } else {
      console.log('❌ Project assigned email failed');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Project assigned email test error:', error);
    return false;
  }
}

// Test work session completed notification
export async function testWorkSessionCompletedEmail(): Promise<boolean> {
  console.log('🧪 Testing work session completed email...');
  
  try {
    const result = await sendWorkSessionCompletedEmail(
      'test-project-lead-1',
      'John Doe',
      'Test Circuit Board Assembly',
      'test-project-123',
      {
        duration: 4.5,
        progress: 75,
        tasksCompleted: ['Soldering', 'Testing', 'Quality Check'],
        notes: 'All components installed successfully. Ready for final inspection.'
      }
    );
    
    if (result) {
      console.log('✅ Work session completed email sent');
    } else {
      console.log('❌ Work session completed email failed');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Work session completed email test error:', error);
    return false;
  }
}

// Test deadline approaching notification
export async function testDeadlineApproachingEmail(): Promise<boolean> {
  console.log('🧪 Testing deadline approaching email...');
  
  try {
    const result = await sendDeadlineApproachingEmails(
      ['test-assembler-1', 'test-project-lead-1'],
      'Test Circuit Board Assembly',
      'test-project-123',
      2, // 2 days until deadline
      65, // 65% progress
      [true, false] // first is assembler, second is project lead
    );
    
    console.log(`✅ Deadline approaching emails sent: ${result}`);
    return result > 0;
  } catch (error) {
    console.error('❌ Deadline approaching email test error:', error);
    return false;
  }
}

// Test announcement notification
export async function testAnnouncementEmail(): Promise<boolean> {
  console.log('🧪 Testing announcement email...');
  
  try {
    const result = await sendAnnouncementEmails(
      ['test-assembler-1', 'test-assembler-2', 'test-project-lead-1'],
      'New Safety Protocols',
      'We are implementing new safety protocols for the assembly line. Please review the updated documentation and complete the required training by Friday. All assemblers must wear additional protective equipment when working with high-voltage components.',
      'test-announcement-123'
    );
    
    console.log(`✅ Announcement emails sent: ${result}`);
    return result > 0;
  } catch (error) {
    console.error('❌ Announcement email test error:', error);
    return false;
  }
}

// Run all email tests
export async function runAllEmailTests(testRecipientEmail?: string): Promise<void> {
  console.log('\n🧪 Running FundiFlow Email Tests');
  console.log('==================================');
  
  const results = {
    basic: false,
    projectCreated: false,
    projectAssigned: false,
    workSessionCompleted: false,
    deadlineApproaching: false,
    announcement: false
  };
  
  // Test basic email if recipient provided
  if (testRecipientEmail) {
    results.basic = await testBasicEmail(testRecipientEmail);
  }
  
  // Test all notification types
  results.projectCreated = await testProjectCreatedEmail();
  results.projectAssigned = await testProjectAssignedEmail();
  results.workSessionCompleted = await testWorkSessionCompletedEmail();
  results.deadlineApproaching = await testDeadlineApproachingEmail();
  results.announcement = await testAnnouncementEmail();
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  if (testRecipientEmail) {
    console.log(`Basic Email: ${results.basic ? '✅ PASS' : '❌ FAIL'}`);
  }
  console.log(`Project Created: ${results.projectCreated ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Project Assigned: ${results.projectAssigned ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Work Session Completed: ${results.workSessionCompleted ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Deadline Approaching: ${results.deadlineApproaching ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Announcement: ${results.announcement ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length - (testRecipientEmail ? 0 : 1);
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All email tests passed! Your notification system is ready.');
  } else {
    console.log('⚠️  Some tests failed. Check your email configuration.');
  }
}

// Quick test function for development
export async function quickEmailTest(): Promise<void> {
  console.log('🚀 Quick Email Test (Console Mode)');
  console.log('==================================');
  
  // This will use console mode regardless of configuration
  process.env.EMAIL_PROVIDER = 'console';
  
  await testProjectCreatedEmail();
  await testWorkSessionCompletedEmail();
  
  console.log('\n✅ Quick test completed. Check console output above.');
}

// Export for use in API routes or scripts
export default {
  testBasicEmail,
  testProjectCreatedEmail,
  testProjectAssignedEmail,
  testWorkSessionCompletedEmail,
  testDeadlineApproachingEmail,
  testAnnouncementEmail,
  runAllEmailTests,
  quickEmailTest
};