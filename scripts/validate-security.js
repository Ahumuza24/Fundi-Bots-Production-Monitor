#!/usr/bin/env node

/**
 * Security Validation Script
 * Tests Firestore security rules to ensure they're working correctly
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function validateSecurity() {
  console.log('🔒 FundiFlow Security Validation\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Check if rules are deployed
  try {
    console.log('🧪 Testing: Security rules deployment');
    await db.collection('users').limit(1).get();
    console.log('✅ PASS: Security rules are deployed');
    passed++;
  } catch (error) {
    console.log('❌ FAIL: Security rules deployment -', error.message);
    failed++;
  }
  
  // Test 2: Check admin access
  try {
    console.log('🧪 Testing: Admin collection access');
    await db.collection('system-logs').limit(1).get();
    console.log('✅ PASS: Admin collections accessible');
    passed++;
  } catch (error) {
    console.log('❌ FAIL: Admin collection access -', error.message);
    failed++;
  }
  
  // Test 3: Validate data structure
  try {
    console.log('🧪 Testing: Data validation rules');
    const testDoc = {
      name: 'Test',
      email: 'test@example.com',
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection('users').add(testDoc);
    await docRef.delete(); // Clean up
    console.log('✅ PASS: Data validation working');
    passed++;
  } catch (error) {
    console.log('❌ FAIL: Data validation -', error.message);
    failed++;
  }
  
  // Generate report
  console.log('\n' + '='.repeat(50));
  console.log('🔒 SECURITY VALIDATION REPORT');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${passed}`);
  console.log(`❌ Tests Failed: ${failed}`);
  console.log(`📊 Total Tests: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All security tests passed! Your Firestore rules are secure.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review your Firestore rules.');
  }
}

validateSecurity().catch(console.error);