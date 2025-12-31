import * as admin from 'firebase-admin';

// Get project ID from environment
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

// Initialize Firebase Admin SDK once per runtime
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      const credentials = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
        projectId: PROJECT_ID || credentials.project_id,
      });
    } else if (PROJECT_ID) {
      // Initialize with project ID explicitly set
      // This uses Application Default Credentials (ADC) which works on GCP/Cloud Run
      // For local development, you may need to set GOOGLE_APPLICATION_CREDENTIALS
      admin.initializeApp({
        projectId: PROJECT_ID,
      });
    } else {
      // Last resort: try to initialize with default credentials
      // This will work if running on GCP with service account attached
      admin.initializeApp();
    }
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
    // Last resort: initialize without explicit credentials; will fail at runtime if not available
    if (!admin.apps.length && PROJECT_ID) {
      try {
        admin.initializeApp({
          projectId: PROJECT_ID,
        });
      } catch (retryError: any) {
        console.error('Firebase Admin retry initialization failed:', retryError.message);
      }
    }
  }
}

export const adminDb = admin.firestore();
export { admin };



