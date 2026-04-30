const admin = require("firebase-admin");

// Initialize application if not already initialized
if (admin.apps.length === 0) {
    // Requires GOOGLE_APPLICATION_CREDENTIALS or default credentials to be set
    // In this local environment, you may have them configured, 
    // or we can initialize with default if running inside a terminal that has access.
    // If not, we can write a script that works with the local config.
    admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

async function cleanData() {
    const targets = ['unit01', 'unit2', 'unit3', 'ro4', 'UNIT001', 'UNIT002', 'UNIT003', 'UNIT004', 'UNIT005', 'UNIT006', 'UNIT007', 'UNIT008', 'UNIT009'];
    let usersDeleted = 0;
    let recordsDeleted = 0;

    console.log("Starting cleanup for units:", targets);

    try {
        const uSnap = await db.collection("users").get();
        const userDocsToDelete = uSnap.docs.filter(doc => {
            const data = doc.data();
            const code = data.unit_code || data.unit;
            return targets.includes(code);
        });

        for (const doc of userDocsToDelete) {
            const uid = doc.id;
            try { 
                await auth.deleteUser(uid); 
                console.log(`Deleted Auth Account: ${uid}`);
            } catch (e) {
                console.warn(`Auth Account ${uid} removal skipped: ${e.message}`);
            }
            await doc.ref.delete();
            usersDeleted++;
        }

        const rSnap = await db.collection("vehicle_records").get();
        const recordDocsToDelete = rSnap.docs.filter(doc => {
            const data = doc.data();
            const code = data.unit_code || data.unit;
            return targets.includes(code);
        });

        for (const doc of recordDocsToDelete) {
            await doc.ref.delete();
            recordsDeleted++;
        }

        console.log(`Cleanup finished. Deleted ${usersDeleted} users and ${recordsDeleted} records.`);
    } catch (e) {
        console.error("Cleanup failed:", e);
    }
}

cleanData();
