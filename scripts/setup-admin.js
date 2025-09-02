#!/usr/bin/env node

/**
 * Setup Initial Admin User
 * Run this script after deploying security rules to create the first admin user
 */

const admin = require('firebase-admin');
const readline = require('readline');
require('dotenv').config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    // Use environment variables for service account credentials
    const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
        universe_domain: "googleapis.com"
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
}

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setupAdmin() {
    console.log('🔧 FundiFlow Admin Setup\n');

    try {
        // Get admin details
        const email = await question('Enter admin email: ');
        const password = await question('Enter admin password (min 6 chars): ');
        const name = await question('Enter admin name: ');

        console.log('\n🔄 Creating admin user...');

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: name,
            emailVerified: true
        });

        console.log(`✅ Created auth user: ${userRecord.uid}`);

        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            name: name,
            email: email,
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true
        });

        console.log('✅ Created user document in Firestore');

        // Set custom claims for role-based access
        await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

        console.log('✅ Set admin role claims');

        console.log('\n🎉 Admin user setup complete!');
        console.log(`📧 Email: ${email}`);
        console.log(`🆔 UID: ${userRecord.uid}`);
        console.log('\n⚠️  Important: Save these credentials securely!');

    } catch (error) {
        console.error('❌ Error setting up admin:', error.message);

        if (error.code === 'auth/email-already-exists') {
            console.log('\n💡 User already exists. Updating role to admin...');

            try {
                const userRecord = await auth.getUserByEmail(email);

                // Update user document
                await db.collection('users').doc(userRecord.uid).set({
                    role: 'admin',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                // Set custom claims
                await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

                console.log('✅ Updated existing user to admin role');

            } catch (updateError) {
                console.error('❌ Error updating user:', updateError.message);
            }
        }
    } finally {
        rl.close();
        process.exit(0);
    }
}

// Check if Firebase Admin is properly configured
async function checkSetup() {
    try {
        // Check if required environment variables are set
        const requiredEnvVars = [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_PRIVATE_KEY_ID', 
            'FIREBASE_PRIVATE_KEY',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_CLIENT_ID'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error('❌ Missing required environment variables:');
            missingVars.forEach(varName => console.error(`   - ${varName}`));
            console.log('\n🔧 Please check your .env file and ensure all Firebase Admin SDK variables are set.');
            return false;
        }

        // Test Firestore connection
        await db.collection('test').limit(1).get();
        console.log('✅ Firebase Admin SDK configured correctly');
        return true;
    } catch (error) {
        console.error('❌ Firebase Admin SDK configuration error:');
        console.error(error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Verify your .env file contains all Firebase Admin SDK variables');
        console.log('2. Check that the private key is properly formatted with \\n for line breaks');
        console.log('3. Ensure the service account has the necessary permissions');
        return false;
    }
}

// Main execution
async function main() {
    const isConfigured = await checkSetup();
    if (isConfigured) {
        await setupAdmin();
    }
}

main().catch(console.error);