const admin = require('firebase-admin');
const path = require('path');

try {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    // Initialize Firebase Admin SDK
    const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));

    // Validate service account
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Invalid service account file - missing required fields');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id // Explicitly set project ID
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`📱 Firebase Project ID: ${serviceAccount.project_id}`);
    console.log(`📧 Service Account: ${serviceAccount.client_email}`);
  } else {
    console.log('ℹ️  Firebase Admin SDK already initialized');
  }
  
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:');
  console.error('   Error:', error.message);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('   → firebase-service-account.json file not found');
    console.error('   → Check the file path:', path.join(__dirname, '../firebase-service-account.json'));
  }
  
  process.exit(1);
}

module.exports = admin;