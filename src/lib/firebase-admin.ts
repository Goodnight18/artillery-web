import * as admin from 'firebase-admin';

// Re-usable project ID
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'artilleryailpr';

function getAdminApp() {
    if (admin.apps.length > 0) return admin.apps[0]!;

    try {
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            return admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectId,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
        }
        
        // Zero-config initialization for Cloud environments (Firebase Hosting / Cloud Run)
        return admin.initializeApp({ projectId });
    } catch (error: any) {
        // Handle race conditions or hot-reloads
        if (admin.apps.length > 0) return admin.apps[0]!;
        console.error("Firebase Admin Initialization Error:", error);
        throw error;
    }
}

// Export getters or initialized instances
export const adminAuth = admin.auth(getAdminApp());
export const adminDb = admin.firestore(getAdminApp());
