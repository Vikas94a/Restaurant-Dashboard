import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once per runtime
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      const credentials = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    } else {
      // Fallback to application default credentials (works on GCP)
      admin.initializeApp();
    }
  } catch {
    // Last resort: initialize without explicit credentials; will fail at runtime if not available
    if (!admin.apps.length) {
      admin.initializeApp();
    }
  }
}

export const adminDb = admin.firestore();
export { admin };



