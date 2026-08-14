import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function main() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.error("Config file not found!");
    return;
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    appId: config.appId,
  });
  const db = initializeFirestore(app, { experimentalForceLongPolling: true }, config.firestoreDatabaseId);

  console.log("=== COMPANIES ===");
  const compSnap = await getDocs(collection(db, 'companies'));
  compSnap.forEach(doc => {
    console.log(`- ID: ${doc.id}, Data:`, doc.data());
  });

  console.log("\n=== PUBLISHER CLIENTS ===");
  const pubSnap = await getDocs(collection(db, 'publisher_clients'));
  pubSnap.forEach(doc => {
    console.log(`- ID: ${doc.id}, Data:`, doc.data());
  });

  console.log("\n=== COLLABORATORS ===");
  const colSnap = await getDocs(collection(db, 'collaborators'));
  colSnap.forEach(doc => {
    console.log(`- ID: ${doc.id}, company: ${doc.data().company}, company_id: ${doc.data().company_id}, email: ${doc.data().email}`);
  });

  console.log("\n=== LICENCE REQUESTS ===");
  const reqSnap = await getDocs(collection(db, 'licence_requests'));
  reqSnap.forEach(doc => {
    console.log(`- ID: ${doc.id}, Data:`, doc.data());
  });

  process.exit(0);
}

main();
