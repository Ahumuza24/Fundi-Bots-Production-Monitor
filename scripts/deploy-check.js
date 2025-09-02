#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Checks if the project is ready for production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 FundiFlow Deployment Check\n');

const checks = [
  {
    name: 'TypeScript Compilation',
    command: 'npm run typecheck',
    description: 'Checking for TypeScript errors...'
  },
  {
    name: 'ESLint Validation',
    command: 'npm run lint',
    description: 'Running ESLint checks...'
  },
  {
    name: 'Build Process',
    command: 'npm run build',
    description: 'Testing production build...'
  }
];

const requiredFiles = [
  '.env.local.example',
  'vercel.json',
  'firebase.json',
  'firestore.rules',
  'firestore.indexes.json'
];

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'SMTP_HOST',
  'SMTP_USER'
];

let allPassed = true;

// Check required files
console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
    allPassed = false;
  }
});

// Check environment variables (from .env.local.example)
console.log('\n🔧 Checking environment configuration...');
if (fs.existsSync('.env.local.example')) {
  const envExample = fs.readFileSync('.env.local.example', 'utf8');
  requiredEnvVars.forEach(envVar => {
    if (envExample.includes(envVar)) {
      console.log(`✅ ${envVar} documented`);
    } else {
      console.log(`❌ ${envVar} - Not documented in .env.local.example`);
      allPassed = false;
    }
  });
} else {
  console.log('❌ .env.local.example not found');
  allPassed = false;
}

// Run code quality checks
console.log('\n🔍 Running code quality checks...');
for (const check of checks) {
  try {
    console.log(`${check.description}`);
    execSync(check.command, { stdio: 'pipe' });
    console.log(`✅ ${check.name} passed`);
  } catch (error) {
    console.log(`❌ ${check.name} failed`);
    console.log(error.stdout?.toString() || error.message);
    allPassed = false;
  }
}

// Check package.json for production readiness
console.log('\n📦 Checking package configuration...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (packageJson.scripts.build) {
  console.log('✅ Build script configured');
} else {
  console.log('❌ Build script missing');
  allPassed = false;
}

if (packageJson.scripts.start) {
  console.log('✅ Start script configured');
} else {
  console.log('❌ Start script missing');
  allPassed = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 All checks passed! Ready for deployment.');
  console.log('\nNext steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Connect repository to Vercel');
  console.log('3. Configure environment variables in Vercel');
  console.log('4. Deploy!');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above before deploying.');
  process.exit(1);
}