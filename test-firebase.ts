import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log("Checking Firebase config...");
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.error("Config file not found!");
    return;
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log("Config loaded:", config.projectId, config.firestoreDatabaseId);

  try {
    const app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId,
    });
    const db = getFirestore(app, config.firestoreDatabaseId);
    console.log("Firebase initialized. Querying licence_requests...");
    const snapshot = await getDocs(collection(db, 'licence_requests'));
    console.log("Query successful. Found documents:", snapshot.size);
    snapshot.forEach(d => {
      console.log(`- Document ID: ${d.id}`, d.data());
    });

    console.log("Testing a mock write to verify permissions...");
    const testDocRef = doc(db, 'licence_requests', 'diagnostic_test_id');
    await setDoc(testDocRef, {
      companyName: "Diagnostic Test Corp",
      requestDate: new Date().toISOString(),
      status: "pending",
      price: 99
    });
    console.log("Write successful!");

  } catch (error) {
    console.error("Firebase/Firestore Error encountered:", error);
  }
}

main();
