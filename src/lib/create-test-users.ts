// Utility to create test users for email testing
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function createTestAssembler() {
  try {
    console.log('Creating test assembler user...');
    
    const testUser = {
      email: 'ahumuzacedric@gmail.com', // Using your email for testing
      name: 'Test Assembler',
      role: 'assembler',
      displayName: 'Test Assembler',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create user document with a specific ID
    const userId = 'test-assembler-' + Date.now();
    await setDoc(doc(db, 'users', userId), testUser);
    
    console.log('✅ Test assembler created with ID:', userId);
    return userId;
  } catch (error) {
    console.error('❌ Error creating test assembler:', error);
    throw error;
  }
}

export async function createTestUserPreferences(userId: string) {
  try {
    console.log('Creating test user preferences...');
    
    const preferences = {
      emailNotifications: {
        projectCreated: true,
        projectAssigned: true,
        workSessionCompleted: true,
        deadlineApproaching: true,
        announcements: true,
        emailEnabled: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'userPreferences', userId), preferences);
    
    console.log('✅ Test user preferences created for:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error creating test user preferences:', error);
    throw error;
  }
}