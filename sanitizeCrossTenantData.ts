import fs from 'fs';
import path from 'path';

console.log("=================================================");
console.log("🧹 CROSS-TENANT DATA CLEANUP & SANITIZATION UTILITY");
console.log("=================================================");

const COLLABORATORS_PATH = path.join(process.cwd(), 'server', 'collaborators.json');
const CLIENTS_PATH = path.join(process.cwd(), 'server', 'publisher_clients.json');

function cleanCollaboratorsFile() {
  if (!fs.existsSync(COLLABORATORS_PATH)) {
    console.log("ℹ️ No local collaborators.json found.");
    return;
  }

  try {
    const raw = fs.readFileSync(COLLABORATORS_PATH, 'utf8');
    const collaborators = JSON.parse(raw);
    if (!Array.isArray(collaborators)) return;

    let removedCount = 0;
    const sanitized = collaborators.filter((c: any) => {
      if (!c) return false;
      const company = String(c.company || '').toLowerCase();
      const name = String(c.name || '').toLowerCase();
      
      // Check if parent company user is erroneously assigned to GEP
      if (company === 'gep' || company.includes('gep')) {
        if (name.includes('zied ben miled') || name.includes('bochra') || c.email === 'contact@elyssa.pro') {
          console.log(`🧹 Removing misattributed user "${c.name}" (${c.email}) from GEP company record`);
          removedCount++;
          return false;
        }
      }
      return true;
    });

    if (removedCount > 0) {
      fs.writeFileSync(COLLABORATORS_PATH, JSON.stringify(sanitized, null, 2), 'utf8');
      console.log(`✅ Cleaned ${removedCount} cross-tenant misattributed collaborator(s).`);
    } else {
      console.log("✅ No cross-tenant collaborator misattributions detected in local state.");
    }
  } catch (err) {
    console.error("⚠️ Error sanitizing collaborators:", err);
  }
}

cleanCollaboratorsFile();
console.log("=================================================\n");
