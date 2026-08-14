const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const app = admin.initializeApp({
  projectId: 'ai-studio-saassuivietconso-2944a04a-e75f-4d9f-8500-b428f8a06dc0'
});
const db = getFirestore();

async function run() {
  const doc = await db.collection('company_data').doc('gep').get();
  if (doc.exists) {
    const data = doc.data();
    console.log(JSON.stringify(data.employees || [], null, 2));
  } else {
    console.log("Doc not found");
  }
}
run();
