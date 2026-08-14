import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

async function test() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.log("No firebase config found!");
    return;
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    appId: config.appId,
  });
  const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

  console.log("Fetching collaborator collab_trial_owner_1784187338817...");
  const docSnap = await getDoc(doc(db, 'collaborators', 'collab_trial_owner_1784187338817'));
  if (docSnap.exists()) {
    console.log("Collaborator:", JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log("Collaborator not found in Firestore.");
  }

  console.log("\nFetching company pc-1784187338817...");
  const compSnap = await getDoc(doc(db, 'companies', 'pc-1784187338817'));
  if (compSnap.exists()) {
    console.log("Company from companies:", JSON.stringify(compSnap.data(), null, 2));
  } else {
    console.log("Company not found in companies.");
  }

  console.log("\nFetching publisher_clients...");
  const pubSnap = await getDocs(collection(db, 'publisher_clients'));
  pubSnap.forEach(d => {
    const data = d.data();
    if (data.companyName === 'ML' || data.email?.includes('ml') || data.email?.includes('lm') || d.id === 'pc-1784187338817') {
      console.log(`- ID: ${d.id}, Data:`, JSON.stringify(data, null, 2));
    }
  });
}

test().catch(console.error);
